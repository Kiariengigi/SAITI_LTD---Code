import argparse
import json
import pandas as pd
import numpy as np
import xgboost as xgb
from pathlib import Path
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent
PROC_DIR = Path(BASE_DIR / "Datasets" / "data" / "processed")
MODEL_DIR = Path(BASE_DIR / "models")
# ══════════════════════════════════════════════════════════════════════════
# 1. LOAD MODEL AND FEATURES
# ══════════════════════════════════════════════════════════════════════════
def load_artefacts():
    model = xgb.XGBClassifier()
    model.load_model(str(MODEL_DIR / "xgboost_reorder_model.json"))
 
    with open(MODEL_DIR / "feature_columns.json") as f:
        feature_cols = json.load(f)
 
    # Load the feature store — in production this is a DB query, not a file
    # Try retail first, then instacart
    try:
        features = pd.read_parquet(PROC_DIR / "retail_features.parquet")
        capacity = pd.read_parquet(PROC_DIR / "retail_capacity.parquet")
        orders   = pd.read_parquet(PROC_DIR / "retail_orders_clean.parquet")
        dataset  = "retail"
    except FileNotFoundError:
        features = pd.read_parquet(PROC_DIR / "instacart_features.parquet")
        capacity = pd.read_parquet(PROC_DIR / "instacart_capacity.parquet")
        orders   = pd.read_parquet(PROC_DIR / "instacart_orders_clean.parquet")
        dataset  = "instacart"
 
    return model, feature_cols, features, capacity, orders, dataset
 
 
# ══════════════════════════════════════════════════════════════════════════
# 2. BUILD CANDIDATE SET FOR A CUSTOMER
# ══════════════════════════════════════════════════════════════════════════
def get_customer_candidates(customer_id, features, capacity, orders, feature_cols):
    """
    Returns a DataFrame of all SKUs the customer has previously ordered,
    with all features required for model scoring.
    """
    # Convert customer_id to float to match the stored dtype
    customer_features = features[features["customer_id"] == float(customer_id)].copy()
 
    if len(customer_features) == 0:
        raise ValueError(f"Customer {customer_id} not found in feature store. "
                         "They may not have enough order history (minimum 3 orders).")
 
    # Merge in capacity signals if not already present
    if "atp_cover_days" not in customer_features.columns:
        customer_features = customer_features.merge(
            capacity[["sku", "atp_cover_days", "supply_risk_score", "low_stock_flag"]],
            on="sku", how="left"
        )
 
    # Add source_id (retail=0, instacart=1) — needed by the model
    customer_features["source_id"] = 0
 
    # Fill missing features with 0
    for col in feature_cols:
        if col not in customer_features.columns:
            customer_features[col] = 0.0
 
    return customer_features
 
 
# ══════════════════════════════════════════════════════════════════════════
# 3. SCORE CANDIDATES
# ══════════════════════════════════════════════════════════════════════════
def score_candidates(model, customer_features, feature_cols):
    X = customer_features[feature_cols].astype(float).fillna(0)
    customer_features = customer_features.copy()
    customer_features["reorder_probability"] = model.predict_proba(X)[:, 1]
    return customer_features.sort_values("reorder_probability", ascending=False)
 
 
# ══════════════════════════════════════════════════════════════════════════
# 4. BUILD ORDER HISTORY SUMMARY
# ══════════════════════════════════════════════════════════════════════════
def get_order_history(customer_id, orders, top_skus, n=5):
    """Returns last N orders for top recommended SKUs."""
    customer_orders = orders[orders["customer_id"] == float(customer_id)].copy()
    history = []
 
    for sku in top_skus[:n]:
        sku_orders = (
            customer_orders[customer_orders["sku"] == sku]
            .sort_values("order_date", ascending=False)
            .head(3)
        )
        if len(sku_orders) > 0:
            last = sku_orders.iloc[0]
            history.append({
                "sku": sku,
                "product_name": str(last.get("product_name", sku)),
                "last_order_date": str(last["order_date"])[:10]
                    if pd.notnull(last.get("order_date")) else "unknown",
                "last_qty": int(last.get("quantity", 0)),
                "avg_qty": float(sku_orders.get("quantity", pd.Series([0])).mean()),
            })
    return history
 
 
# ══════════════════════════════════════════════════════════════════════════
# 5. ASSEMBLE ML PAYLOAD (the JSON handed to LLM)
# ══════════════════════════════════════════════════════════════════════════
def build_ml_payload(customer_id, scored, orders, top_n=5):
    """
    Builds the structured JSON payload the LLM will use to generate
    its recommendation with rationale.
    """
    # Filter to meaningful candidates (prob > 0.4)
    candidates = scored[scored["reorder_probability"] > 0.4].head(top_n)
 
    top_skus = candidates["sku"].tolist()
    order_history = get_order_history(customer_id, orders, top_skus)
 
    recommendations = []
    for _, row in candidates.iterrows():
        rec = {
            "sku": str(row["sku"]),
            "product_name": str(row.get("product_name", row["sku"])),
            "reorder_probability_30d": round(float(row["reorder_probability"]), 3),
            "days_overdue": round(float(row.get("days_overdue", row.get("recency_score", 0))), 1),
            "avg_reorder_cycle_days": round(float(row.get("avg_reorder_cycle_days", 0)), 1),
            "avg_order_qty": round(float(row.get("avg_order_qty", 0)), 1),
            "suggested_qty": max(1, round(float(row.get("avg_order_qty", 1))
                                * float(row.get("qty_trend", 1.0)))),
            "qty_trend": round(float(row.get("qty_trend", 1.0)), 2),
            "reorder_rate": round(float(row.get("reorder_rate", 0)), 3),
            "supply_risk_score": round(float(row.get("supply_risk_score", 0)), 3),
            "atp_cover_days": int(row.get("atp_cover_days", 30)),
            "low_stock_flag": int(row.get("low_stock_flag", 0)),
        }
        recommendations.append(rec)
 
    # Customer-level summary
    cust_data = scored.iloc[0] if len(scored) > 0 else {}
    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "customer_id": str(customer_id),
        "account_context": {
            "total_distinct_skus_ordered": int(len(scored)),
            "total_customer_orders": int(cust_data.get("total_customer_orders",
                                         cust_data.get("total_orders", 0))),
            "customer_total_spend": round(float(cust_data.get("customer_total_spend", 0)), 2),
            "avg_days_between_orders": round(
                float(cust_data.get("avg_days_between_orders",
                      cust_data.get("avg_reorder_cycle_days", 0))), 1),
        },
        "order_history_sample": order_history,
        "ml_recommendations": recommendations,
        "capacity_summary": {
            "skus_with_low_stock": int((scored["low_stock_flag"] == 1).sum()),
            "skus_with_high_supply_risk": int((scored["supply_risk_score"] > 0.65).sum()),
        },
        "business_rules": {
            "minimum_order_value": 0,        # Set from your config
            "blocked_skus": [],              # Populate from rules engine
        }
    }
    return payload
 
 
# ══════════════════════════════════════════════════════════════════════════
# 6. MAIN
# ══════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--customer_id", required=True, help="Customer ID to score")
    parser.add_argument("--top_n", type=int, default=5, help="Max recommendations")
    parser.add_argument("--output_dir", default=".", help="Where to save the payload JSON")
    args = parser.parse_args()
 
    print(f"Loading artefacts...")
    model, feature_cols, features, capacity, orders, dataset = load_artefacts()
    print(f"  Using dataset: {dataset}")
 
    print(f"Building candidates for customer {args.customer_id}...")
    candidates = get_customer_candidates(
        args.customer_id, features, capacity, orders, feature_cols
    )
 
    print(f"  Found {len(candidates)} candidate SKUs. Scoring...")
    scored = score_candidates(model, candidates, feature_cols)
 
    print(f"  Assembling ML payload (top {args.top_n})...")
    payload = build_ml_payload(args.customer_id, scored, orders, top_n=args.top_n)
 
    out_path = Path(args.output_dir) / f"ml_payload_{args.customer_id}.json"
    with open(out_path, "w") as f:
        json.dump(payload, f, indent=2)
 
    print(f"\nPayload saved: {out_path}")
    print(f"\nTop recommendations:")
    for rec in payload["ml_recommendations"]:
        print(f"  {rec['sku']:20s}  prob={rec['reorder_probability_30d']:.2f}  "
              f"overdue={rec['days_overdue']:+.0f}d  "
              f"stock={rec['atp_cover_days']}d cover  "
              f"risk={rec['supply_risk_score']:.2f}")
 
    print(f"\nThis payload is ready to pass to the LLM prompt builder (Step 5).")
    return payload
 
 
if __name__ == "__main__":
    main()