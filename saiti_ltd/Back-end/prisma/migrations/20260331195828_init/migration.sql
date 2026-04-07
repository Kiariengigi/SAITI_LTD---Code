/*
  Warnings:

  - The primary key for the `producers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `producer_id` on the `producers` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `producers` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `producers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_name` to the `producers` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `producers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `producers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `producers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "role_type" AS ENUM ('producer', 'wholesaler', 'merchant', 'admin');

-- CreateEnum
CREATE TYPE "producer_stock_reason" AS ENUM ('production', 'sale', 'adjustment', 'return', 'wastage', 'initial_stock');

-- CreateEnum
CREATE TYPE "wholesaler_stock_reason" AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'wastage', 'initial_stock');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'returned');

-- CreateEnum
CREATE TYPE "insight_type" AS ENUM ('demand_forecast', 'stockout_warning', 'reorder_recommendation', 'excess_inventory', 'delivery_bottleneck');

-- CreateEnum
CREATE TYPE "severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "trigger_type" AS ENUM ('scheduled', 'manual', 'dashboard', 'api');

-- CreateEnum
CREATE TYPE "rec_action" AS ENUM ('reorder_now', 'reorder_soon', 'monitor');

-- CreateEnum
CREATE TYPE "confidence" AS ENUM ('high', 'medium', 'low');

-- DropForeignKey
ALTER TABLE "producers" DROP CONSTRAINT "producers_userId_fkey";

-- DropIndex
DROP INDEX "producers_userId_key";

-- AlterTable
ALTER TABLE "producers" DROP CONSTRAINT "producers_pkey",
DROP COLUMN "producer_id",
DROP COLUMN "userId",
ADD COLUMN     "company_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "industry_type" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "producers_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_type" "role_type" NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesalers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry_type" TEXT,
    "location" TEXT,
    "phone_number" TEXT,
    "credit_limit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wholesalers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "industry_type" TEXT,
    "location" TEXT,
    "phone_number" TEXT,
    "credit_limit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "producer_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'unit',
    "price" DECIMAL(12,2) NOT NULL,
    "current_stock_level" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "reorder_point" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesaler_products" (
    "wholesaler_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "selling_price" DECIMAL(12,2),
    "stock_level" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "listed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesaler_products_pkey" PRIMARY KEY ("wholesaler_id","product_id")
);

-- CreateTable
CREATE TABLE "producer_stock_store" (
    "id" UUID NOT NULL,
    "producer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity_change" DECIMAL(10,3) NOT NULL,
    "reason" "producer_stock_reason" NOT NULL DEFAULT 'adjustment',
    "balance_after" DECIMAL(10,3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producer_stock_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesaler_stock_store" (
    "id" UUID NOT NULL,
    "wholesaler_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity_change" DECIMAL(10,3) NOT NULL,
    "reason" "wholesaler_stock_reason" NOT NULL DEFAULT 'adjustment',
    "balance_after" DECIMAL(10,3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesaler_stock_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "recommendation_id" UUID,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "total_value" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity_ordered" DECIMAL(10,3) NOT NULL,
    "quantity_delivered" DECIMAL(10,3),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "was_recommended" BOOLEAN NOT NULL DEFAULT false,
    "is_reorder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_features" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "avg_order_qty" DECIMAL(10,3),
    "std_order_qty" DECIMAL(10,3),
    "avg_reorder_cycle_days" DECIMAL(8,1),
    "days_since_last_order" DECIMAL(8,1),
    "days_overdue" DECIMAL(8,1),
    "reorder_rate" DECIMAL(5,3),
    "qty_trend" DECIMAL(6,3),
    "current_stock_level" DECIMAL(10,3),
    "days_to_stockout" DECIMAL(8,1),
    "supply_risk_score" DECIMAL(4,3),
    "demand_forecast_30d" DECIMAL(10,3),
    "order_velocity_pct" DECIMAL(7,2),
    "reorder_adherence_pct" DECIMAL(5,1),
    "revenue_at_risk" DECIMAL(14,2),
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights_cache" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "insight_type" "insight_type" NOT NULL,
    "forecast_value" DECIMAL(10,3),
    "confidence" DECIMAL(5,3),
    "severity" "severity" NOT NULL DEFAULT 'medium',
    "insight_text" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "model_id" UUID,
    "llm_provider" TEXT NOT NULL DEFAULT 'groq/llama-3.3-70b-versatile',
    "account_summary" TEXT,
    "next_best_action" TEXT,
    "ml_candidate_count" INTEGER,
    "raw_llm_response" JSONB,
    "raw_ml_payload" JSONB,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "trigger_type" "trigger_type" NOT NULL DEFAULT 'scheduled',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_items" (
    "id" UUID NOT NULL,
    "recommendation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" TEXT,
    "action" "rec_action" NOT NULL,
    "suggested_qty" DECIMAL(10,3),
    "confidence" "confidence",
    "urgency_flag" BOOLEAN NOT NULL DEFAULT false,
    "rep_rationale" TEXT,
    "demand_forecast_30d" DECIMAL(10,3),
    "order_velocity_pct" DECIMAL(7,2),
    "days_to_stockout" INTEGER,
    "reorder_adherence_pct" DECIMAL(5,1),
    "revenue_at_risk" DECIMAL(14,2),
    "revenue_at_risk_level" TEXT,
    "metrics_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wholesalers_user_id_key" ON "wholesalers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_user_id_key" ON "merchants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_features_user_id_product_id_key" ON "user_features"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "insights_cache_user_id_product_id_insight_type_key" ON "insights_cache"("user_id", "product_id", "insight_type");

-- CreateIndex
CREATE UNIQUE INDEX "producers_user_id_key" ON "producers"("user_id");

-- AddForeignKey
ALTER TABLE "producers" ADD CONSTRAINT "producers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesalers" ADD CONSTRAINT "wholesalers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_wholesaler_id_fkey" FOREIGN KEY ("wholesaler_id") REFERENCES "wholesalers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_stock_store" ADD CONSTRAINT "producer_stock_store_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_stock_store" ADD CONSTRAINT "producer_stock_store_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesaler_stock_store" ADD CONSTRAINT "wholesaler_stock_store_wholesaler_id_fkey" FOREIGN KEY ("wholesaler_id") REFERENCES "wholesalers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesaler_stock_store" ADD CONSTRAINT "wholesaler_stock_store_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights_cache" ADD CONSTRAINT "insights_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights_cache" ADD CONSTRAINT "insights_cache_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
