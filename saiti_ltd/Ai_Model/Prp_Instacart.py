#Importing Libraries
import pandas as pd
import numpy as np
from pathlib import Path

#Cleaning INSTACART Dataset 
#IMPORTING DATASET FROM DRIVE
BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = Path(BASE_DIR / "Datasets" / "Instacart_Market_Basket_Analysis")
OUT_DIR = BASE_DIR / "Datasets" / "Data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════════════
# REDUCE DATASET SIZE FOR MANAGEABLE ML TRAINING
# ═══════════════════════════════════════════════════════════════════════════
print("Loading datasets...")
orders       = pd.read_csv(RAW_DIR / "orders.csv")
products     = pd.read_csv(RAW_DIR / "products.csv")
departments  = pd.read_csv(RAW_DIR / "departments.csv")
aisles       = pd.read_csv(RAW_DIR / "aisles.csv")

# Sample orders to reduce dataset size (keep 5% = ~50K orders)
sample_size = min(50000, len(orders))
orders_sampled = orders.sample(n=sample_size, random_state=42).copy()
sampled_order_ids = set(orders_sampled['order_id'].values)

print(f"  Total orders: {len(orders):,} → Sampled: {sample_size:,}")

# Load and filter large datasets to only include sampled orders
print("Filtering prior order-products...")
prior_chunks = []
for chunk in pd.read_csv(RAW_DIR / "order_products__prior.csv", chunksize=50000):
    prior_chunks.append(chunk[chunk['order_id'].isin(sampled_order_ids)])
prior = pd.concat(prior_chunks, ignore_index=True) if prior_chunks else pd.DataFrame()

print("Filtering train order-products...")
train_chunks = []
for chunk in pd.read_csv(RAW_DIR / "order_products__train.csv", chunksize=50000):
    train_chunks.append(chunk[chunk['order_id'].isin(sampled_order_ids)])
train = pd.concat(train_chunks, ignore_index=True) if train_chunks else pd.DataFrame()

# Reassign sampled data
orders = orders_sampled

print(f"  Prior order-products: {len(prior):,}")
print(f"  Train order-products: {len(train):,}")
print(f"  Products: {len(products):,}")

#Splitting Orders 
prior_orders = orders[orders["eval_set"] == "prior"]
train_orders = orders[orders["eval_set"] == "train"] 

prior_full = prior.merge(
    prior_orders[["order_id", "user_id", "order_number",
                  "order_dow", "order_hour_of_day", "days_since_prior_order"]],
    on="order_id",
    how="left"
)
 
# Enrich with product info (name, department, aisle)
prior_full = prior_full.merge(products, on="product_id", how="left")
prior_full = prior_full.merge(departments, on="department_id", how="left")
prior_full = prior_full.merge(aisles, on="aisle_id", how="left")
 
# Rename for consistency with our B2B schema
prior_full.rename(columns={
    "user_id":             "customer_id",
    "product_id":          "sku",
    "product_name":        "product_name",
    "department":          "category",
    "aisle":               "subcategory",
    "order_number":        "order_sequence",
    "days_since_prior_order": "days_since_prior",
    "order_dow":           "order_day_of_week",
    "order_hour_of_day":   "order_hour",
}, inplace=True)
 
print(f"  Prior order history rows: {len(prior_full):,}")
prior_full.to_parquet(OUT_DIR / "instacart_orders_clean.parquet", index=False)
print("  Saved instacart_orders_clean.parquet")

# ══════════════════════════════════════════════════════════════════════════
# 4. FEATURE ENGINEERING — PER CUSTOMER × SKU
# ══════════════════════════════════════════════════════════════════════════
print("\nEngineering features...")
 
# ── 4a. Per customer-SKU purchase history ──────────────────────────────
product_history = (
    prior_full.groupby(["customer_id", "sku"])
    .agg(
        total_orders          = ("order_id",          "count"),
        avg_add_to_cart_pos   = ("add_to_cart_order", "mean"),   # lower = bought first = habitual
        reorder_flag_sum      = ("reordered",          "sum"),    # how many times was it a reorder?
        avg_days_since_prior  = ("days_since_prior",   "mean"),
        std_days_since_prior  = ("days_since_prior",   "std"),
        last_order_sequence   = ("order_sequence",     "max"),
        first_order_sequence  = ("order_sequence",     "min"),
        avg_order_dow         = ("order_day_of_week",  "mean"),
        avg_order_hour        = ("order_hour",         "mean"),
    )
    .reset_index()
)
 
# ── 4b. Customer-level order behaviour ────────────────────────────────
customer_stats = (
    prior_orders.groupby("user_id")
    .agg(
        total_customer_orders  = ("order_number",          "max"),
        avg_days_between_orders= ("days_since_prior_order","mean"),
        std_days_between_orders= ("days_since_prior_order","std"),
    )
    .reset_index()
    .rename(columns={"user_id": "customer_id"})
)
product_history = product_history.merge(customer_stats, on="customer_id", how="left")
 
# ── 4c. Derived signals ───────────────────────────────────────────────
 
# Reorder rate: how often does this customer actually reorder this item?
product_history["reorder_rate"] = (
    product_history["reorder_flag_sum"] / product_history["total_orders"]
).clip(0, 1)
 
# Purchase frequency rate: how often does customer buy THIS product
# vs. all their orders? (loyalty metric)
product_history["purchase_frequency_rate"] = (
    product_history["total_orders"] / product_history["total_customer_orders"]
).clip(0, 1)
 
# Average reorder cycle for this product per customer
product_history["avg_reorder_cycle_days"] = product_history["avg_days_since_prior"]
 
# Reorder regularity: low cv = regular buyer
product_history["reorder_cv"] = (
    product_history["std_days_since_prior"] / product_history["avg_days_since_prior"].clip(lower=0.01)
).replace([np.inf, -np.inf], 1.0).fillna(1.0).clip(0, 5)
 
# Days overdue (estimated): we don't have a true snapshot date,
# so we use order_sequence distance as a proxy
product_history["orders_since_last_purchase"] = (
    product_history["total_customer_orders"] - product_history["last_order_sequence"]
)
 
# Normalised recency: 0 = bought in last order, 1 = very long ago
product_history["recency_score"] = (
    product_history["orders_since_last_purchase"] /
    product_history["total_customer_orders"].clip(lower=1)
).clip(0, 1)
 
# Habitual buyer flag: bought in >70% of their orders AND reorder rate > 0.8
product_history["is_habitual"] = (
    (product_history["purchase_frequency_rate"] > 0.7) &
    (product_history["reorder_rate"] > 0.8)
).astype(int)
 
# Cart position signal: items added first (position 1-3) are habitual
product_history["is_early_cart"] = (
    product_history["avg_add_to_cart_pos"] <= 3
).astype(int)
 
# ── 4d. Product-level popularity (market demand proxy) ────────────────
product_popularity = (
    prior_full.groupby("sku")
    .agg(
        sku_total_orders   = ("order_id",   "count"),
        sku_total_reorders = ("reordered",  "sum"),
        sku_unique_buyers  = ("customer_id","nunique"),
    )
    .reset_index()
)
product_popularity["sku_reorder_rate"] = (
    product_popularity["sku_total_reorders"] / product_popularity["sku_total_orders"]
).round(3)
 
product_popularity["sku_popularity_rank"] = (
    product_popularity["sku_total_orders"]
    .rank(ascending=False, method="min")
    .astype(int)
)
 
product_history = product_history.merge(product_popularity, on="sku", how="left")
 
# ── 4e. Department / category features ───────────────────────────────
dept_info = prior_full[["sku", "category", "subcategory"]].drop_duplicates("sku")
product_history = product_history.merge(dept_info, on="sku", how="left")
 
# Encode category as integer ID for the model
product_history["category_id"] = product_history["category"].astype("category").cat.codes
product_history["subcategory_id"] = product_history["subcategory"].astype("category").cat.codes
 
print(f"  Feature matrix shape: {product_history.shape}")
 
# ══════════════════════════════════════════════════════════════════════════
# 5. SIMULATE CAPACITY / STOCK SIGNALS
# ══════════════════════════════════════════════════════════════════════════
# Instacart has no inventory data. We simulate capacity from demand signals.
# Replace with real stock data when available.
print("\nSimulating capacity signals...")
 
capacity = product_popularity[["sku", "sku_popularity_rank", "sku_total_orders"]].copy()
 
# High-demand items (low rank number) = more likely to have stock pressure
max_rank = capacity["sku_popularity_rank"].max()
capacity["atp_cover_days"] = (
    5 + (capacity["sku_popularity_rank"] / max_rank) * 55
).round(0).astype(int)
 
capacity["supply_risk_score"] = (
    1 - (capacity["atp_cover_days"] / 60)
).round(3)
 
capacity["low_stock_flag"] = (capacity["atp_cover_days"] < 14).astype(int)
 
product_history = product_history.merge(
    capacity[["sku", "atp_cover_days", "supply_risk_score", "low_stock_flag"]],
    on="sku",
    how="left"
)
 
capacity.to_parquet(OUT_DIR / "instacart_capacity.parquet", index=False)
print("  Saved instacart_capacity.parquet")
 
product_history.to_parquet(OUT_DIR / "instacart_features.parquet", index=False)
print("  Saved instacart_features.parquet")
 
# ══════════════════════════════════════════════════════════════════════════
# 6. CREATE TRAINING LABELS FROM 'train' SPLIT
# ══════════════════════════════════════════════════════════════════════════
# The Instacart 'train' set contains the ACTUAL next order for each user.
# reordered=1 means the item appeared in that next order.
# This is our ground truth label: "will customer reorder this SKU next?"
print("\nCreating training labels from Instacart train split...")
 
# Join train order-products with user IDs
train_labels = train.merge(
    train_orders[["order_id", "user_id"]],
    on="order_id",
    how="left"
)
train_labels.rename(columns={
    "user_id":    "customer_id",
    "product_id": "sku",
    "reordered":  "reordered_in_next_order"   # our label
}, inplace=True)
 
# The train file only contains products that WERE ordered in the next order.
# For negative samples, we need all prior products NOT in the next order.
 
# All customer-SKU pairs that the customer has ever bought
all_prior_pairs = prior_full[["customer_id","sku"]].drop_duplicates()
 
# Products that appeared in next order (positives)
positives = train_labels[["customer_id", "sku"]].drop_duplicates()
positives["reordered_in_next_order"] = 1
 
# Merge all prior pairs with positives → missing = negative (didn't reorder)
training_data = all_prior_pairs.merge(positives, on=["customer_id","sku"], how="left")
training_data["reordered_in_next_order"] = (
    training_data["reordered_in_next_order"].fillna(0).astype(int)
)
 
# Only keep users that have a train label (exclude test-set users)
train_user_ids = train_orders["user_id"].unique()
training_data = training_data[training_data["customer_id"].isin(train_user_ids)]
 
# Attach features
training_data = training_data.merge(product_history, on=["customer_id","sku"], how="inner")
 
# Cold start filter: only customers with 3+ prior orders
training_data = training_data[training_data["total_orders"] >= 3]
 
# Drop non-numeric / date columns not needed by the model
drop_cols = ["category", "subcategory"]
training_data = training_data.drop(columns=[c for c in drop_cols if c in training_data.columns])
 
# Fill NaNs
training_data = training_data.fillna(0)
 
pos = training_data["reordered_in_next_order"].sum()
neg = len(training_data) - pos
print(f"  Training rows: {len(training_data):,}")
print(f"  Positive (will reorder): {int(pos):,} ({pos/len(training_data)*100:.1f}%)")
print(f"  Negative (won't reorder): {int(neg):,} ({neg/len(training_data)*100:.1f}%)")
 
training_data.to_parquet(OUT_DIR / "instacart_training_data.parquet", index=False)
print("  Saved instacart_training_data.parquet")
 
# ══════════════════════════════════════════════════════════════════════════
# 7. PRINT FINAL FEATURE SUMMARY
# ══════════════════════════════════════════════════════════════════════════
feature_cols = [c for c in training_data.columns
                if c not in ["customer_id", "sku", "reordered_in_next_order"]]
print(f"\nFinal feature set ({len(feature_cols)} features):")
for i, col in enumerate(feature_cols, 1):
    print(f"  {i:2}. {col}")
 
print("\nInstacart preparation complete.")