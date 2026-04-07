
import json
import os
import argparse
from typing import Optional
from openai import OpenAI
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv

load_dotenv()

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL    = "llama-3.3-70b-versatile"


# ══════════════════════════════════════════════════════════════════════════
# 1. PYDANTIC SCHEMA — includes all 5 metric explanations
# ══════════════════════════════════════════════════════════════════════════

class MetricExplanation(BaseModel):
    label: str
    value: str         # formatted string e.g. "42 units", "+18%", "9 days"
    interpretation: str  # one plain sentence explaining what this means for the rep

class SingleRecommendation(BaseModel):
    sku: str
    product_name: str
    action: str           # "reorder_now" | "reorder_soon" | "monitor"
    suggested_qty: int
    confidence: str       # "high" | "medium" | "low"
    urgency_flag: Optional[bool] = False
    rep_rationale: str    # 2-3 sentence summary citing the metrics
    supporting_metrics: list[MetricExplanation]  # one entry per metric

class LLMResponse(BaseModel):
    recommendations: list[SingleRecommendation]
    account_summary: str      # 2 sentences on the overall account situation
    next_best_action: str     # single most important action for the rep today


# ══════════════════════════════════════════════════════════════════════════
# 2. PROMPTS
# ══════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """
You are a B2B order recommendation agent for a wholesale distributor.
You receive ML model outputs including 5 supporting metrics per product
and produce recommendations a sales representative can present confidently
to a customer.

For every recommendation you must:
1. Cite specific numbers from the metrics — never speak in vague generalities
2. Explain what each metric means in plain business language (not technical language)
3. Connect the metrics to the recommended action so the rep can justify it

Metric definitions:
  - demand_forecast:         Predicted units this customer will need in 30 days (EWMA-based)
  - order_velocity:          % change in how often they've ordered recently vs. prior period
  - days_to_stockout:        Days until stock runs out at current demand — urgency driver
  - reorder_cycle_adherence: How closely they follow their own reorder rhythm (% on-time)
  - revenue_at_risk:         Revenue lost if a stockout occurs before replenishment

Rules:
- Only recommend SKUs with reorder_probability_30d >= 0.50
- action = "reorder_now"  if days_to_stockout <= 14 OR days_overdue > 0 OR low_stock_flag = 1
- action = "reorder_soon" if reorder_probability_30d >= 0.65 and none of the above
- action = "monitor"      for all others above 0.50
- urgency_flag = true if days_to_stockout <= 14 OR supply_risk_score > 0.65
- confidence: "high" >= 0.80, "medium" 0.65-0.80, "low" 0.50-0.65
- rep_rationale: 2-3 sentences that MUST cite numbers from at least 3 of the 5 metrics
- supporting_metrics: include ALL 5 metrics, each with a plain-language interpretation
- Never mention "probability", "model", "ML", or "algorithm" to the rep
- Return ONLY valid JSON. No text outside the JSON.
""".strip()


def build_prompt(payload: dict) -> str:
    return f"""
Account ML payload with supporting metrics:
{json.dumps(payload, indent=2)}

Return this exact JSON (no extra text):
{{
  "recommendations": [
    {{
      "sku": "string",
      "product_name": "string",
      "action": "reorder_now | reorder_soon | monitor",
      "suggested_qty": integer,
      "confidence": "high | medium | low",
      "urgency_flag": true or false,
      "rep_rationale": "2-3 sentences citing numbers from at least 3 metrics",
      "supporting_metrics": [
        {{
          "label": "Demand forecast (next 30 days)",
          "value": "e.g. 42 units",
          "interpretation": "one plain sentence for the sales rep"
        }},
        {{
          "label": "Order velocity change",
          "value": "e.g. +18% vs prior 60 days",
          "interpretation": "one plain sentence for the sales rep"
        }},
        {{
          "label": "Days to stockout",
          "value": "e.g. 9 days",
          "interpretation": "one plain sentence for the sales rep"
        }},
        {{
          "label": "Reorder cycle adherence",
          "value": "e.g. 72% (overdue)",
          "interpretation": "one plain sentence for the sales rep"
        }},
        {{
          "label": "Revenue at risk",
          "value": "e.g. $4,200 (HIGH)",
          "interpretation": "one plain sentence for the sales rep"
        }}
      ]
    }}
  ],
  "account_summary": "Two sentences on the overall account ordering situation.",
  "next_best_action": "One sentence — the single most important thing the rep should do today."
}}
""".strip()


# ══════════════════════════════════════════════════════════════════════════
# 3. GROQ CALL
# ══════════════════════════════════════════════════════════════════════════

def call_groq(payload: dict) -> dict:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY not set.\n"
            "  1. Get a free key at https://console.groq.com\n"
            "  2. Add to .env: GROQ_API_KEY=gsk_xxxx"
        )

    client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": build_prompt(payload)},
        ],
        max_tokens=2500,   # increased — metric explanations need more tokens
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed    = json.loads(raw)
    validated = LLMResponse(**parsed)
    return validated.model_dump()


# ══════════════════════════════════════════════════════════════════════════
# 4. ML-ONLY FALLBACK
# ══════════════════════════════════════════════════════════════════════════

def _ml_fallback(payload: dict, error: str = "") -> dict:
    """Builds recommendations directly from metrics when Groq is unavailable."""
    recs = []
    for r in payload.get("ml_recommendations", []):
        prob = r.get("reorder_probability_30d", 0)
        if prob < 0.50:
            continue

        m         = r.get("metrics", {})
        df        = m.get("demand_forecast", {})
        ov        = m.get("order_velocity", {})
        dts       = m.get("days_to_stockout", {})
        rca       = m.get("reorder_cycle_adherence", {})
        rar       = m.get("revenue_at_risk", {})

        dts_val   = dts.get("value", r.get("atp_cover_days", 99))
        overdue   = rca.get("days_overdue", 0)
        low_stock = r.get("low_stock_flag", 0)
        risk      = r.get("supply_risk_score", 0)

        action = (
            "reorder_now"  if (dts_val <= 14 or overdue > 0 or low_stock) else
            "reorder_soon" if prob >= 0.65 else
            "monitor"
        )
        confidence = (
            "high"   if prob >= 0.80 else
            "medium" if prob >= 0.65 else
            "low"
        )

        recs.append({
            "sku":           r["sku"],
            "product_name":  r.get("product_name", r["sku"]),
            "action":        action,
            "suggested_qty": r.get("suggested_qty", 0),
            "confidence":    confidence,
            "urgency_flag":  bool(dts_val <= 14 or risk > 0.65),
            "rep_rationale": (
                f"Stock will run out in {dts_val} days. "
                f"Demand forecast is {df.get('value', '?')} units over the next 30 days. "
                f"Customer is {rca.get('status', 'unknown').replace('_', ' ')} on their reorder cycle."
            ),
            "supporting_metrics": [
                {"label": "Demand forecast (next 30 days)",
                 "value": f"{df.get('value', '?')} units",
                 "interpretation": df.get("description", "")},
                {"label": "Order velocity change",
                 "value": f"{ov.get('value', 0):+.1f}%",
                 "interpretation": ov.get("description", "")},
                {"label": "Days to stockout",
                 "value": f"{dts_val} days",
                 "interpretation": dts.get("description", "")},
                {"label": "Reorder cycle adherence",
                 "value": f"{rca.get('adherence_pct', 0)}% ({rca.get('status', '?')})",
                 "interpretation": rca.get("description", "")},
                {"label": "Revenue at risk",
                 "value": f"${rar.get('value', 0):,.2f} ({rar.get('risk_level', '?').upper()})",
                 "interpretation": rar.get("description", "")},
            ],
        })

    return {
        "recommendations":  recs,
        "account_summary":  "ML-based recommendation (Groq unavailable).",
        "next_best_action": "Review reorder_now items with the customer today.",
        "_fallback":        True,
        "_error":           error,
    }


# ══════════════════════════════════════════════════════════════════════════
# 5. PUBLIC ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════

def generate_recommendation(payload: dict) -> dict:
    """
    Import and call this from your FastAPI service:
        from llm_groq_metrics import generate_recommendation
        result = generate_recommendation(ml_payload)
    """
    try:
        result = call_groq(payload)
        result["_provider"] = GROQ_MODEL
    except EnvironmentError as e:
        print(f"Config error: {e}")
        result = _ml_fallback(payload, str(e))
    except json.JSONDecodeError as e:
        print(f"Groq returned invalid JSON: {e}")
        result = _ml_fallback(payload, str(e))
    except ValidationError as e:
        print(f"Groq response failed schema validation: {e}")
        result = _ml_fallback(payload, str(e))
    except Exception as e:
        print(f"Groq call failed: {e}")
        result = _ml_fallback(payload, str(e))

    result["customer_id"]        = payload.get("customer_id")
    result["generated_at"]       = payload.get("generated_at")
    result["ml_candidate_count"] = len(payload.get("ml_recommendations", []))
    return result


# ══════════════════════════════════════════════════════════════════════════
# 6. MAIN
# ══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload_path", required=True,
                        help="Path to ml_payload_{customer_id}.json from Step 4")
    args = parser.parse_args()

    with open(args.payload_path) as f:
        payload = json.load(f)

    print(f"Customer: {payload.get('customer_id')}")
    print(f"Model:    {GROQ_MODEL} via Groq\n")

    result = generate_recommendation(payload)

    if result.get("_fallback"):
        print("WARNING: Groq unavailable — ML-only fallback.\n")

    print(f"Account summary:")
    print(f"  {result.get('account_summary')}\n")
    print(f"Next best action:")
    print(f"  {result.get('next_best_action')}\n")

    for rec in result.get("recommendations", []):
        urgent = "  *** URGENT ***" if rec.get("urgency_flag") else ""
        print(f"{'─'*60}")
        print(f"  [{rec['action'].upper():13s}] {rec['sku']} — {rec['product_name']}{urgent}")
        print(f"  Qty: {rec['suggested_qty']}  |  Confidence: {rec['confidence']}\n")
        print(f"  Rep rationale:")
        print(f"    {rec['rep_rationale']}\n")
        print(f"  Supporting metrics:")
        for metric in rec.get("supporting_metrics", []):
            print(f"    {metric['label']:35s} {metric['value']}")
            print(f"      → {metric['interpretation']}")

    out_path = args.payload_path.replace("ml_payload", "recommendation")
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()