// Products_Page/Products_main.tsx
// ================================================================
// Fully functional products page.
// Fetches products from GET /api/products/all
// Fetches AI insights from GET /api/products/insights
// ================================================================

import { useState, useEffect, useCallback } from "react";
import Navbar from "../User_Profile/Header";
import Promo_Banner from "./Promo_Banner";
import AI_Insights from "./AI_Insights";
import ProductGrid from "./ProductGrid";
import OrderModal from "./OrderModal";
import axios from "../api/axios";

// ── Shared types exported so child components can import ─────────
export interface ProductItem {
    id:                string;
    productName:       string;
    description:       string | null;
    category:          string | null;
    unitOfMeasure:     string;
    price:             string;           // Prisma Decimal → string
    currentStockLevel: string;
    reorderPoint:      string;
    isActive:          boolean;
    createdAt:         string;
    producer?: {
        companyName: string;
        location:    string | null;
    } | null;
    wholesalerProducts?: {
        sellingPrice: string | null;
        stockLevel:   string;
        wholesaler:   { companyName: string };
    }[];
}

export interface InsightItem {
    id:           string;
    productId:    string;
    insightType:  string;
    forecastValue: string | null;
    confidence:    string | null;
    severity:      "low" | "medium" | "high" | "critical";
    insightText:   string;
    expiresAt:     string | null;
    generatedAt:   string;
    product: {
        productName:       string;
        category:          string | null;
        currentStockLevel: string;
        reorderPoint:      string;
        price:             string;
        unitOfMeasure:     string;
        producer:          { companyName: string } | null;
    };
}

export interface InsightsSummary {
    totalInsights:      number;
    criticalCount:      number;
    highCount:          number;
    stockoutWarnings:   InsightItem[];
    demandForecasts:    InsightItem[];
    reorderSuggestions: InsightItem[];
}

export interface ProductsResponse {
    products:   ProductItem[];
    total:      number;
    page:       number;
    pageSize:   number;
    totalPages: number;
    categories: string[];
}

export interface SelectedOrderItem {
    productId:     string;
    productName:   string;
    category:      string | null;
    unitOfMeasure: string;
    producerName:  string;
    stockLevel:    number;
    unitPrice:     number;
    quantity:      number;
}

// ── Query params state ───────────────────────────────────────────
export interface ProductFilters {
    search:   string;
    category: string;
    sortBy:   string;
    order:    "asc" | "desc";
    page:     number;
    pageSize: number;
}

function Products_main() {
    // ── Products state ─────────────────────────────────────────
    const [productsData, setProductsData] = useState<ProductsResponse>({
        products: [], total: 0, page: 1, pageSize: 20, totalPages: 1, categories: [],
    });
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError,   setProductsError]   = useState<string | null>(null);

    // ── Insights state ─────────────────────────────────────────
    const [insights,        setInsights]        = useState<InsightItem[]>([]);
    const [insightsSummary, setInsightsSummary] = useState<InsightsSummary | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(true);

    // ── Filters ────────────────────────────────────────────────
    const [filters, setFilters] = useState<ProductFilters>({
        search:   "",
        category: "",
        sortBy:   "createdAt",
        order:    "desc",
        page:     1,
        pageSize: 20,
    });

    // ── Order selection state ──────────────────────────────────
    const [selectedItems, setSelectedItems] = useState<Record<string, SelectedOrderItem>>({});
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [orderNotes, setOrderNotes] = useState("");
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

    // ── Fetch products ─────────────────────────────────────────
    const fetchProducts = useCallback(async (f: ProductFilters) => {
        setProductsLoading(true);
        setProductsError(null);
        try {
            const params = new URLSearchParams();
            if (f.search)   params.set("search",   f.search);
            if (f.category) params.set("category", f.category);
            params.set("sortBy",   f.sortBy);
            params.set("order",    f.order);
            params.set("page",     String(f.page));
            params.set("pageSize", String(f.pageSize));

            const res = await axios.get(`/products/all?${params.toString()}`);
            setProductsData(res.data.data ?? res.data);
        } catch (err: any) {
            setProductsError(
                err?.response?.data?.message ?? "Failed to load products. Please try again."
            );
        } finally {
            setProductsLoading(false);
        }
    }, []);

    // ── Fetch insights ─────────────────────────────────────────
    const fetchInsights = useCallback(async () => {
        setInsightsLoading(true);
        try {
            const res = await axios.get("/products/insights");
            const data = res.data.data ?? res.data;
            setInsights(data.insights        ?? []);
            setInsightsSummary(data.summary  ?? null);
        } catch {
            // Insights failing silently — not a blocking error for the page
            setInsights([]);
            setInsightsSummary(null);
        } finally {
            setInsightsLoading(false);
        }
    }, []);

    // ── Initial load ───────────────────────────────────────────
    useEffect(() => {
        fetchProducts(filters);
        fetchInsights();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Re-fetch when filters change (except initial render) ───
    useEffect(() => {
        fetchProducts(filters);
    }, [filters, fetchProducts]);

    // ── Handlers passed down to ProductGrid ───────────────────
    const handleFilterChange = (patch: Partial<ProductFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggleProductSelect = (product: ProductItem, selected: boolean) => {
        const unitPrice = Number(product.wholesalerProducts?.[0]?.sellingPrice ?? product.price);
        const stockLevel = Number(product.currentStockLevel);

        setSelectedItems((prev) => {
            const next = { ...prev };
            if (selected) {
                next[product.id] = {
                    productId: product.id,
                    productName: product.productName,
                    category: product.category,
                    unitOfMeasure: product.unitOfMeasure,
                    producerName: product.producer?.companyName ?? "Supplier",
                    stockLevel: Number.isFinite(stockLevel) ? stockLevel : 0,
                    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
                    quantity: 1,
                };
            } else {
                delete next[product.id];
            }
            return next;
        });

        setOrderError(null);
        setOrderSuccess(null);
        if (selected) {
            setOrderModalOpen(true);
        }
    };

    const getSuggestedQuantity = (item: InsightItem) => Math.max(1, Math.floor(Number(item.forecastValue ?? item.product.reorderPoint) || 1));

    const handleOrderSuggestedItem = (item: InsightItem) => {
        const unitPrice = Number(item.product.price);
        const stockLevel = Number(item.product.currentStockLevel);
        const suggestedQuantity = getSuggestedQuantity(item);

        setSelectedItems((prev) => ({
            ...prev,
            [item.productId]: {
                productId: item.productId,
                productName: item.product.productName,
                category: item.product.category,
                unitOfMeasure: item.product.unitOfMeasure,
                producerName: item.product.producer?.companyName ?? "Supplier",
                stockLevel: Number.isFinite(stockLevel) ? stockLevel : 0,
                unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
                quantity: suggestedQuantity,
            },
        }));

        setOrderError(null);
        setOrderSuccess(null);
        setOrderModalOpen(true);
    };

    const handleOrderAllSuggestions = (items: InsightItem[]) => {
        if (items.length === 0) {
            return;
        }

        setSelectedItems(() => {
            const next: Record<string, SelectedOrderItem> = {};

            for (const item of items) {
                const unitPrice = Number(item.product.price);
                const stockLevel = Number(item.product.currentStockLevel);
                const suggestedQuantity = getSuggestedQuantity(item);

                next[item.productId] = {
                    productId: item.productId,
                    productName: item.product.productName,
                    category: item.product.category,
                    unitOfMeasure: item.product.unitOfMeasure,
                    producerName: item.product.producer?.companyName ?? "Supplier",
                    stockLevel: Number.isFinite(stockLevel) ? stockLevel : 0,
                    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
                    quantity: suggestedQuantity,
                };
            }

            return next;
        });

        setOrderError(null);
        setOrderSuccess(null);
        setOrderModalOpen(true);
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        const sanitizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
        setSelectedItems((prev) => {
            const existing = prev[productId];
            if (!existing) return prev;
            return {
                ...prev,
                [productId]: {
                    ...existing,
                    quantity: sanitizedQuantity,
                },
            };
        });
    };

    const handleRemoveSelected = (productId: string) => {
        setSelectedItems((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const handleSubmitOrder = async () => {
        const items = Object.values(selectedItems);
        if (items.length === 0) {
            setOrderError("Select at least one product before sending an order.");
            return;
        }

        setOrderSubmitting(true);
        setOrderError(null);
        setOrderSuccess(null);
        try {
            const payload = {
                items: items.map((item) => ({
                    productId: item.productId,
                    quantityOrdered: item.quantity,
                })),
                ...(orderNotes.trim() ? { notes: orderNotes.trim() } : {}),
            };

            const res = await axios.post("/orders/create", payload, { withCredentials: true });
            const orderCount = Number(res?.data?.data?.orderCount ?? 1);

            setOrderSuccess(
                orderCount > 1
                    ? `Order request split and sent to ${orderCount} suppliers successfully.`
                    : "Order sent successfully."
            );

            setSelectedItems({});
            setOrderNotes("");
            setOrderModalOpen(false);
        } catch (err: any) {
            setOrderError(
                err?.response?.data?.message ?? "Failed to send order. Please try again."
            );
        } finally {
            setOrderSubmitting(false);
        }
    };

    const selectedItemsList = Object.values(selectedItems);

    return (
        <>
            <Navbar />
            <Promo_Banner />

            {/* AI Insights — only renders when there is data */}
            <AI_Insights
                insights={insights}
                summary={insightsSummary}
                loading={insightsLoading}
                onOrderSuggestion={handleOrderSuggestedItem}
                onOrderAllSuggestions={handleOrderAllSuggestions}
            />

            <ProductGrid
                productsData={productsData}
                loading={productsLoading}
                error={productsError}
                filters={filters}
                selectedItems={selectedItems}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                onRetry={() => fetchProducts(filters)}
                onOpenOrderModal={() => setOrderModalOpen(true)}
                onToggleProductSelect={handleToggleProductSelect}
            />

            <OrderModal
                isOpen={orderModalOpen}
                items={selectedItemsList}
                notes={orderNotes}
                submitting={orderSubmitting}
                error={orderError}
                success={orderSuccess}
                onClose={() => setOrderModalOpen(false)}
                onNotesChange={setOrderNotes}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveSelected}
                onSubmit={handleSubmitOrder}
            />
        </>
    );
}

export default Products_main;