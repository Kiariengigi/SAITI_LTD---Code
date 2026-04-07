#Importing Libraries
import pandas as pd
import numpy as np
from pathlib import Path

#IMPORTING AND CLEANING ONLINE RETAIL II UCL
BASE_DIR = Path(__file__).resolve().parent
df = pd.read_csv(BASE_DIR / "Datasets" / "Online_Retail_II_UCI" / "online_retail_II.csv")
OUT_DIR = BASE_DIR / "Datasets" / "Data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ══════════════════════════════════════════════════════════════════════════
# 2. CLEAN — REMOVE NOISE THAT WOULD CORRUPT FEATURES
# ══════════════════════════════════════════════════════════════════════════
 
# 2a. Drop rows with no CustomerID (guest / unidentified transactions)
df = df.dropna(subset=["Customer ID"])
print(f"  After dropping null CustomerID: {len(df):,}")
 
# 2d. Remove zero-price rows (samples / internal transfers)
df = df[df["Price"] > 0]
 
# 2e. Remove non-product StockCodes (postage, manual adjustments, etc.)
non_product_codes = ["POST", "D", "M", "BANK CHARGES", "PADS", "DOT"]
df = df[~df["StockCode"].isin(non_product_codes)]
df = df[df["StockCode"].str.match(r"^\d{5}", na=False)]  # Only numeric product codes
 
# 2f. Standardise column names
df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
df.rename(columns={
    "invoice":     "invoice_id",
    "stockcode":   "sku",
    "description": "product_name",
    "quantity":    "quantity",
    "invoicedate": "order_date",
    "price":       "unit_price",
    "customer_id": "customer_id",
    "country":     "country"
}, inplace=True)
 
# 2g. Parse dates
df["order_date"] = pd.to_datetime(df["order_date"])
df["order_value"] = df["quantity"] * df["unit_price"]
 
print(f"\n  Clean dataset: {len(df):,} rows | "
      f"{df['customer_id'].nunique():,} customers | "
      f"{df['sku'].nunique():,} SKUs")
 
df.to_parquet(OUT_DIR / "retail_orders_clean.parquet", index=False)
print("  Saved retail_orders_clean.parquet")

# Sort for time-series operations
df = df.sort_values(["customer_id", "sku", "order_date"])
 
# -- 3a. Order-level aggregation: one row per invoice per customer per SKU
orders = (
    df.groupby(["customer_id", "sku", "invoice_id", "order_date"])
    .agg(
        quantity   = ("quantity",    "sum"),
        order_value= ("order_value", "sum"),
        unit_price = ("unit_price",  "mean"),
    )
    .reset_index()
)
 
# -- 3b. Days between consecutive orders (reorder cycle)
orders["prev_order_date"] = orders.groupby(["customer_id", "sku"])["order_date"].shift(1)
orders["days_since_prior"] = (orders["order_date"] - orders["prev_order_date"]).dt.days
 
# -- 3c. Per customer-SKU aggregate features
features = (
    orders.groupby(["customer_id", "sku"])
    .agg(
        total_orders          = ("invoice_id",       "count"),
        total_quantity        = ("quantity",         "sum"),
        total_revenue         = ("order_value",      "sum"),
        avg_order_qty         = ("quantity",         "mean"),
        std_order_qty         = ("quantity",         "std"),
        avg_reorder_cycle_days= ("days_since_prior", "mean"),
        std_reorder_cycle_days= ("days_since_prior", "std"),
        min_reorder_cycle_days= ("days_since_prior", "min"),
        first_order_date      = ("order_date",       "min"),
        last_order_date       = ("order_date",       "max"),
        avg_unit_price        = ("unit_price",       "mean"),
    )
    .reset_index()
)
 
# -- 3d. Derived signals
SNAPSHOT_DATE = df["order_date"].max()
 
features["days_since_last_order"] = (
    SNAPSHOT_DATE - features["last_order_date"]
).dt.days
 
features["customer_tenure_days"] = (
    features["last_order_date"] - features["first_order_date"]
).dt.days
 
# days_overdue: positive = overdue, negative = not yet due
# This is the strongest single predictor of next reorder
features["days_overdue"] = (
    features["days_since_last_order"] - features["avg_reorder_cycle_days"]
)
 
# Reorder regularity: low cv = very regular buyer (predictable)
features["reorder_cv"] = (
    features["std_reorder_cycle_days"] / features["avg_reorder_cycle_days"].clip(lower=0.01)
).replace([np.inf, -np.inf], 1.0).fillna(1.0)
 
# Order size trend: compare last 3 orders qty vs. lifetime avg
last3 = (
    orders.sort_values("order_date")
    .groupby(["customer_id", "sku"])
    .tail(3)
    .groupby(["customer_id", "sku"])["quantity"]
    .mean()
    .reset_index()
    .rename(columns={"quantity": "avg_qty_last3"})
)
features = features.merge(last3, on=["customer_id", "sku"], how="left")
features["qty_trend"] = (
    features["avg_qty_last3"] / features["avg_order_qty"].clip(lower=0.01)
).replace([np.inf, -np.inf], 1.0).fillna(1.0)  # >1 = growing, <1 = shrinking
 
# Return rate per customer-SKU (from our separated returns df)
features.columns = [c.strip().lower().replace(" ", "_") for c in features.columns]
features.rename(columns={"customer_id": "customer_id", "stockcode": "sku"}, errors="ignore", inplace=True)
if "customer_id" in features.columns and "sku" in features.columns:
    return_counts = (
        features.groupby(["customer_id", "sku"])
        .size()
        .reset_index(name="return_count")
    )
    features = features.merge(return_counts, on=["customer_id", "sku"], how="left")
    features["return_count"] = features["return_count"].fillna(0)
    features["return_rate"] = features["return_count"] / features["total_orders"]
else:
    features["return_count"] = 0
    features["return_rate"]  = 0.0
 
# Customer-level total spend (account health proxy)
customer_spend = (
    df.groupby("customer_id")["order_value"]
    .sum()
    .reset_index(name="customer_total_spend")
)
features = features.merge(customer_spend, on="customer_id", how="left")
 
# SKU-level popularity rank (proxy for market demand)
sku_popularity = (
    df.groupby("sku")["quantity"]
    .sum()
    .reset_index(name="sku_total_sold")
)
sku_popularity["sku_popularity_rank"] = (
    sku_popularity["sku_total_sold"].rank(ascending=False, method="min").astype(int)
)
features = features.merge(sku_popularity, on="sku", how="left")
 
print(f"  Feature matrix: {features.shape}")
features.to_parquet(OUT_DIR / "retail_features.parquet", index=False)
print("  Saved retail_features.parquet")
 
# ══════════════════════════════════════════════════════════════════════════
# 4. SIMULATE CAPACITY / STOCK SIGNALS
# ══════════════════════════════════════════════════════════════════════════
# Since the dataset has no inventory data, we simulate stock levels using
# demand patterns — a standard approach for building with public data.
# Replace this with real ATP data when available.
print("\nSimulating capacity signals...")
 
sku_demand = sku_popularity.copy()
 
# Stock cover = inverse of demand rank normalised to 5–60 day range
sku_demand["atp_cover_days"] = (
    60 - (sku_demand["sku_popularity_rank"] / sku_demand["sku_popularity_rank"].max()) * 55
).clip(5, 60).round(0).astype(int)
 
# Supply risk: high-demand items at top wholesalers = higher risk of stockout
sku_demand["supply_risk_score"] = (
    1 - (sku_demand["atp_cover_days"] / 60)
).round(3)
 
# Low stock flag: items with less than 14 days cover
sku_demand["low_stock_flag"] = (sku_demand["atp_cover_days"] < 14).astype(int)
 
capacity = sku_demand[["sku", "atp_cover_days", "supply_risk_score", "low_stock_flag"]]
features = features.merge(capacity, on="sku", how="left")
 
capacity.to_parquet(OUT_DIR / "retail_capacity.parquet", index=False)
print("  Saved retail_capacity.parquet")
 
# ══════════════════════════════════════════════════════════════════════════
# 5. CREATE TRAINING LABELS
# ══════════════════════════════════════════════════════════════════════════
# Label: did this customer reorder this SKU within 30 days of snapshot date?
# We simulate this by checking if any order falls in the last 30 days
print("\nCreating training labels...")
 
LABEL_WINDOW = 30  # days
 
recent_orders = df[
    df["order_date"] >= (SNAPSHOT_DATE - pd.Timedelta(days=LABEL_WINDOW))
][["customer_id", "sku"]].drop_duplicates()
recent_orders["reordered_within_30d"] = 1
 
training_data = features.merge(recent_orders, on=["customer_id", "sku"], how="left")
training_data["reordered_within_30d"] = training_data["reordered_within_30d"].fillna(0).astype(int)
 
# Keep only customers with enough history (cold start filter)
training_data = training_data[training_data["total_orders"] >= 3]
 
# Drop date columns not needed for ML
drop_cols = ["first_order_date", "last_order_date"]
training_data = training_data.drop(columns=drop_cols)
 
# Fill remaining NaNs
training_data = training_data.fillna(0)
 
pos = training_data["reordered_within_30d"].sum()
neg = len(training_data) - pos
print(f"  Training rows: {len(training_data):,}")
print(f"  Positive (will reorder): {pos:,} ({pos/len(training_data)*100:.1f}%)")
print(f"  Negative (won't reorder): {neg:,} ({neg/len(training_data)*100:.1f}%)")
 
training_data.to_parquet(OUT_DIR / "retail_training_data.parquet", index=False)
print("  Saved retail_training_data.parquet")
print("\nOnline Retail II preparation complete.")
print(f"Feature columns: {[c for c in training_data.columns if c not in ['customer_id','sku','reordered_within_30d']]}")
