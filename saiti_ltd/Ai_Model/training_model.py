import pandas as pd 
import numpy as np 
import json 
from pathlib import Path 

import xgboost as xgb 
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_score, recall_score, f1_score, classification_report
)

BASE_DIR = Path(__file__).resolve().parent
PROC_DIR = Path("Datasets/Data/processed")
PROC_DIR = Path(BASE_DIR / "Datasets" / "Data" / "processed")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

retail = pd.read_parquet(PROC_DIR / "retail_training_data.parquet")
instacart = pd.read_parquet(PROC_DIR / "instacart_training_data.parquet")

retail.rename(columns={"reordered_within_30d": "label"}, inplace=True)
instacart.rename(columns={"reordered_in_next_order": "label"}, inplace=True)

print(f"  Online Retail II rows: {len(retail):,}")
print(f"  Instacart rows: {len(instacart):,}")


#Common features in both 
SHARED_FEATURES = [
    # Past order signals
    "total_orders",
    "avg_order_qty",
    "std_order_qty",
    "avg_reorder_cycle_days",
    "std_reorder_cycle_days",
    "reorder_cv",
    "reorder_rate",
    "purchase_frequency_rate",
    "recency_score",
    "qty_trend",
    "is_habitual",
 
    # Sales / revenue signals
    "total_revenue",
    "avg_unit_price",
    "customer_total_spend",
 
    # Capacity / stock signals
    "atp_cover_days",
    "supply_risk_score",
    "low_stock_flag",
 
    # SKU-level demand
    "sku_total_orders",
    "sku_reorder_rate",
    "sku_popularity_rank",
]

retail_cols    = set(retail.columns)
instacart_cols = set(instacart.columns)

def align_dataset(df, features, label_col, source_name):
    for feat in features:
        if feat not in df.columns:
            df[feat] = 0.0
    df = df[features + [label_col]].copy()
    df["source"] = source_name
    return df 

retail_aligned    = align_dataset(retail,    SHARED_FEATURES, "label", "retail")
instacart_aligned = align_dataset(instacart, SHARED_FEATURES, "label", "instacart")
 
# Combine
combined = pd.concat([retail_aligned, instacart_aligned], ignore_index=True)
combined["source_id"] = (combined["source"] == "instacart").astype(int)
combined = combined.drop(columns=["source"])
 
combined.to_parquet(PROC_DIR / "combined_training_data.parquet", index=False)
print(f"\n  Combined training set: {len(combined):,} rows")
print(f"  Label balance: {combined['label'].mean()*100:.1f}% positive")
 
# ══════════════════════════════════════════════════════════════════════════
# 3. TRAIN / TEST SPLIT
# ══════════════════════════════════════════════════════════════════════════
FEATURE_COLS = SHARED_FEATURES + ["source_id"]
 
X = combined[FEATURE_COLS].astype(float)
y = combined["label"].astype(int)

# Handle any remaining inf or NaN values
X = X.replace([np.inf, -np.inf], np.nan).fillna(0.0)
 
# Stratified split to preserve label balance
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n  Train: {len(X_train):,} | Test: {len(X_test):,}")
 
# ══════════════════════════════════════════════════════════════════════════
# 4. HANDLE CLASS IMBALANCE
# ══════════════════════════════════════════════════════════════════════════
# Reorder data is typically imbalanced (more non-reorders than reorders).
# XGBoost's scale_pos_weight corrects for this.
neg_count = (y_train == 0).sum()
pos_count = (y_train == 1).sum()
scale_pos_weight = neg_count / pos_count
print(f"  Imbalance ratio (scale_pos_weight): {scale_pos_weight:.2f}")
 
# ══════════════════════════════════════════════════════════════════════════
# 5. TRAIN XGBOOST MODEL
# ══════════════════════════════════════════════════════════════════════════
print("\nTraining XGBoost model...")
 
model = xgb.XGBClassifier(
    n_estimators       = 500,
    max_depth          = 6,
    learning_rate      = 0.05,
    subsample          = 0.8,
    colsample_bytree   = 0.8,
    scale_pos_weight   = scale_pos_weight,
    eval_metric        = "auc",
    early_stopping_rounds = 30,
    random_state       = 42,
    n_jobs             = -1,
    verbosity          = 0,
)
 
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50,
)
 
# ══════════════════════════════════════════════════════════════════════════
# 6. EVALUATE
# ══════════════════════════════════════════════════════════════════════════
print("\nEvaluating...")
y_prob = model.predict_proba(X_test)[:, 1]
y_pred = (y_prob >= 0.5).astype(int)
 
auc    = roc_auc_score(y_test, y_prob)
ap     = average_precision_score(y_test, y_prob)
prec   = precision_score(y_test, y_pred)
rec    = recall_score(y_test, y_pred)
f1     = f1_score(y_test, y_pred)
 
report = classification_report(y_test, y_pred, target_names=["no reorder", "reorder"])
 
print(f"\n  ROC-AUC:           {auc:.4f}")
print(f"  Avg Precision:     {ap:.4f}")
print(f"  Precision @ 0.5:   {prec:.4f}")
print(f"  Recall @ 0.5:      {rec:.4f}")
print(f"  F1 @ 0.5:          {f1:.4f}")
print(f"\n{report}")
 
# Feature importance
importance = (
    pd.Series(model.feature_importances_, index=FEATURE_COLS)
    .sort_values(ascending=False)
)
print("  Top 10 features by importance:")
print(importance.head(10).to_string())
 
# ══════════════════════════════════════════════════════════════════════════
# 7. SAVE ARTEFACTS
# ══════════════════════════════════════════════════════════════════════════
model_path = MODEL_DIR / "xgboost_reorder_model.json"
model.save_model(str(model_path))
print(f"\n  Model saved: {model_path}")
 
with open(MODEL_DIR / "feature_columns.json", "w") as f:
    json.dump(FEATURE_COLS, f, indent=2)
print("  Feature columns saved: models/feature_columns.json")
 
eval_text = f"""XGBoost Reorder Model — Evaluation Report
==========================================
Training rows : {len(X_train):,}
Test rows     : {len(X_test):,}
Label balance : {y.mean()*100:.1f}% positive
 
ROC-AUC          : {auc:.4f}
Avg Precision    : {ap:.4f}
Precision @ 0.5  : {prec:.4f}
Recall @ 0.5     : {rec:.4f}
F1 @ 0.5         : {f1:.4f}
 
Classification Report:
{report}
 
Feature Importance (top 10):
{importance.head(10).to_string()}
"""
with open(MODEL_DIR / "evaluation_report.txt", "w") as f:
    f.write(eval_text)
print("  Evaluation report saved: models/evaluation_report.txt")
print("\nTraining complete.")

