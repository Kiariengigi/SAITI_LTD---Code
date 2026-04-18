
import { Request, Response } from "express";
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";

// ── Types matching InsightsCache model ───────────────────────────
type InsightType =
    | "demand_forecast"
    | "stockout_warning"
    | "reorder_recommendation"
    | "excess_inventory"
    | "delivery_bottleneck";

type Severity = "low" | "medium" | "high" | "critical";

interface InsightPayload {
    productId:    string;
    insightType:  InsightType;
    forecastValue?: number;
    confidence?:    number;
    severity?:      Severity;
    insightText:    string;
    expiresAt?:     string; // ISO date string
}

const MIN_ORDERS_FOR_INSIGHTS = 3;

type GeneratedInsightSeed = {
    productId: string;
    productName: string;
    category: string | null;
    currentStockLevel: number;
    reorderPoint: number;
    price: number;
    unitOfMeasure: string;
    producerName: string | null;
    totalOrders: number;
    totalQuantity: number;
    avgQuantity: number;
};

class InsightsController {
    private static async generateInsightsForUser(userId: string) {
        const orderCount = await prisma.order.count({
            where: { userId },
        });

        if (orderCount < MIN_ORDERS_FOR_INSIGHTS) {
            return [];
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            select: {
                id: true,
                orderItems: {
                    select: {
                        quantityOrdered: true,
                        productId: true,
                        product: {
                            select: {
                                id: true,
                                productName: true,
                                category: true,
                                currentStockLevel: true,
                                reorderPoint: true,
                                price: true,
                                unitOfMeasure: true,
                                producer: {
                                    select: { companyName: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const productStats = new Map<string, GeneratedInsightSeed>();

        for (const order of orders) {
            for (const item of order.orderItems) {
                const productId = item.product.id;
                const quantity = Number(item.quantityOrdered);
                const existing = productStats.get(productId);

                if (!existing) {
                    productStats.set(productId, {
                        productId,
                        productName: item.product.productName,
                        category: item.product.category,
                        currentStockLevel: Number(item.product.currentStockLevel),
                        reorderPoint: Number(item.product.reorderPoint),
                        price: Number(item.product.price),
                        unitOfMeasure: item.product.unitOfMeasure,
                        producerName: item.product.producer?.companyName ?? null,
                        totalOrders: 1,
                        totalQuantity: quantity,
                        avgQuantity: quantity,
                    });
                    continue;
                }

                existing.totalOrders += 1;
                existing.totalQuantity += quantity;
                existing.avgQuantity = existing.totalQuantity / existing.totalOrders;
                existing.currentStockLevel = Number(item.product.currentStockLevel);
                existing.reorderPoint = Number(item.product.reorderPoint);
                existing.price = Number(item.product.price);
            }
        }

        const seededProducts = [...productStats.values()]
            .filter((item) => item.totalOrders > 0)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 8);

        if (seededProducts.length === 0) {
            return [];
        }

        const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;
        const now = new Date();

        const payloads = seededProducts.flatMap((item) => {
            const forecastValue = Math.max(1, Math.round(item.avgQuantity * 30));
            const daysToStockout = item.avgQuantity > 0
                ? Math.max(1, Math.round(item.currentStockLevel / item.avgQuantity))
                : null;
            const suggestedQty = Math.max(1, Math.round(Math.max(item.reorderPoint, item.avgQuantity * 2) - item.currentStockLevel));

            const severity: Severity =
                daysToStockout !== null && daysToStockout <= 7 ? "critical"
                : daysToStockout !== null && daysToStockout <= 14 ? "high"
                : item.currentStockLevel <= item.reorderPoint ? "medium"
                : "low";

            return [
                {
                    productId: item.productId,
                    insightType: "demand_forecast" as const,
                    forecastValue,
                    confidence: 0.78,
                    severity: item.totalOrders >= 5 ? ("high" as const) : ("medium" as const),
                    insightText: `${item.productName} has been ordered ${item.totalOrders} time${item.totalOrders === 1 ? "" : "s"}. Expected demand is about ${forecastValue} ${item.unitOfMeasure} over the next 30 days.`,
                    expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS).toISOString(),
                },
                {
                    productId: item.productId,
                    insightType: "stockout_warning" as const,
                    forecastValue: daysToStockout ?? undefined,
                    confidence: 0.8,
                    severity,
                    insightText: daysToStockout !== null
                        ? `${item.productName} has about ${daysToStockout} day${daysToStockout === 1 ? "" : "s"} of stock left at the current pace. Current stock is ${item.currentStockLevel} ${item.unitOfMeasure}.`
                        : `${item.productName} does not yet have enough history to estimate stockout timing confidently.`,
                    expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS).toISOString(),
                },
                {
                    productId: item.productId,
                    insightType: "reorder_recommendation" as const,
                    forecastValue: suggestedQty,
                    confidence: 0.76,
                    severity: item.currentStockLevel <= item.reorderPoint ? "high" : "medium",
                    insightText: `${item.productName} should be replenished with roughly ${suggestedQty} ${item.unitOfMeasure} to keep stock above the reorder point of ${item.reorderPoint}.`,
                    expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS).toISOString(),
                },
            ];
        });

        await Promise.all(
            payloads.map((p) =>
                prisma.insightsCache.upsert({
                    where: {
                        userId_productId_insightType: {
                            userId,
                            productId: p.productId,
                            insightType: p.insightType,
                        },
                    },
                    create: {
                        userId,
                        productId: p.productId,
                        insightType: p.insightType,
                        insightText: p.insightText,
                        forecastValue: p.forecastValue ?? null,
                        confidence: p.confidence ?? null,
                        severity: p.severity as Severity,
                        expiresAt: p.expiresAt ? new Date(p.expiresAt) : new Date(now.getTime() + DEFAULT_TTL_MS),
                        generatedAt: now,
                    },
                    update: {
                        insightText: p.insightText,
                        forecastValue: p.forecastValue ?? null,
                        confidence: p.confidence ?? null,
                        severity: p.severity as Severity,
                        expiresAt: p.expiresAt ? new Date(p.expiresAt) : new Date(now.getTime() + DEFAULT_TTL_MS),
                        generatedAt: now,
                    },
                })
            )
        );

        return payloads;
    }

    // ── GET /api/products/insights ────────────────────────────────
    // Returns all non-expired insights for the authenticated user.
    // The frontend AI_Insights component reads from this endpoint.
    static getInsights = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;
            if (!userId) return Send.unauthorized(res, null, "Unauthorized");

            const productId   = typeof req.query.productId   === "string" ? req.query.productId   : undefined;
            const insightType = typeof req.query.insightType === "string" ? req.query.insightType  : undefined;
            const severity    = typeof req.query.severity    === "string" ? req.query.severity     : undefined;

            const insights = await prisma.insightsCache.findMany({
                where: {
                    userId,
                    // Only return non-expired insights
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                    ...(productId   ? { productId }              : {}),
                    ...(insightType ? { insightType: insightType as InsightType } : {}),
                    ...(severity    ? { severity: severity as Severity }          : {}),
                },
                include: {
                    product: {
                        select: {
                            productName:       true,
                            category:          true,
                            currentStockLevel: true,
                            reorderPoint:      true,
                            price:             true,
                            unitOfMeasure:     true,
                            producer: {
                                select: { companyName: true },
                            },
                        },
                    },
                },
                orderBy: [
                    // Critical first, then high, medium, low
                    { severity:    "desc" },
                    { generatedAt: "desc" },
                ],
            });

            if (insights.length === 0) {
                await InsightsController.generateInsightsForUser(userId);
            }

            const refreshedInsights = insights.length > 0
                ? insights
                : await prisma.insightsCache.findMany({
                    where: {
                        userId,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } },
                        ],
                        ...(productId   ? { productId }              : {}),
                        ...(insightType ? { insightType: insightType as InsightType } : {}),
                        ...(severity    ? { severity: severity as Severity }          : {}),
                    },
                    include: {
                        product: {
                            select: {
                                productName:       true,
                                category:          true,
                                currentStockLevel: true,
                                reorderPoint:      true,
                                price:             true,
                                unitOfMeasure:     true,
                                producer: {
                                    select: { companyName: true },
                                },
                            },
                        },
                    },
                    orderBy: [
                        { severity:    "desc" },
                        { generatedAt: "desc" },
                    ],
                });

            // Build the summary the AI_Insights component needs
            const summary = {
                totalInsights:      refreshedInsights.length,
                criticalCount:      refreshedInsights.filter((i) => i.severity === "critical").length,
                highCount:          refreshedInsights.filter((i) => i.severity === "high").length,
                stockoutWarnings:   refreshedInsights.filter((i) => i.insightType === "stockout_warning"),
                demandForecasts:    refreshedInsights.filter((i) => i.insightType === "demand_forecast"),
                reorderSuggestions: refreshedInsights.filter((i) => i.insightType === "reorder_recommendation"),
            };

            if (refreshedInsights.length === 0) {
                return res.status(204).send();
            }

            return Send.success(res, { insights: refreshedInsights, summary });
        } catch (error) {
            console.error("getInsights failed:", error);
            return Send.error(res, null, "Failed to fetch insights");
        }
    };

    // ── POST /api/products/insights ───────────────────────────────
    // Saves one or more insights. Uses upsert so duplicate insight
    // types for the same user+product just update, not duplicate.
    // Called by your Python ML model after running inference, OR
    // by the Groq LLM layer after generating recommendations.
    static saveInsights = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;
            if (!userId) return Send.unauthorized(res, null, "Unauthorized");

            // Accept either a single insight or an array
            const raw      = req.body;
            const payloads: InsightPayload[] = Array.isArray(raw) ? raw : [raw];

            if (payloads.length === 0) {
                return Send.badRequest(res, null, "No insight data provided");
            }

            // Validate each payload has the minimum required fields
            for (const p of payloads) {
                if (!p.productId)   return Send.badRequest(res, null, "productId is required for each insight");
                if (!p.insightType) return Send.badRequest(res, null, "insightType is required for each insight");
                if (!p.insightText) return Send.badRequest(res, null, "insightText is required for each insight");
            }

            // Verify all products exist
            const productIds = [...new Set(payloads.map((p) => p.productId))];
            const products   = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true },
            });
            const foundIds = new Set(products.map((p) => p.id));
            const missing  = productIds.filter((id) => !foundIds.has(id));
            if (missing.length > 0) {
                return Send.notFound(res, null, `Products not found: ${missing.join(", ")}`);
            }

            // Default TTL: insights expire in 4 hours
            const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;

            // Upsert each insight — one row per userId × productId × insightType
            const upserted = await Promise.all(
                payloads.map((p) => {
                    const expiresAt = p.expiresAt
                        ? new Date(p.expiresAt)
                        : new Date(Date.now() + DEFAULT_TTL_MS);

                    const data = {
                        insightText:  p.insightText,
                        forecastValue: p.forecastValue ?? null,
                        confidence:    p.confidence    ?? null,
                        severity:     (p.severity ?? "medium") as Severity,
                        expiresAt,
                        generatedAt:  new Date(),
                    };

                    return prisma.insightsCache.upsert({
                        where: {
                            userId_productId_insightType: {
                                userId,
                                productId:   p.productId,
                                insightType: p.insightType,
                            },
                        },
                        create: {
                            userId,
                            productId:   p.productId,
                            insightType: p.insightType,
                            ...data,
                        },
                        update: data,
                        include: {
                            product: {
                                select: { productName: true },
                            },
                        },
                    });
                })
            );

            return res.status(201).json({
                ok:       true,
                message:  `${upserted.length} insight(s) saved successfully`,
                data:     { insights: upserted },
            });
        } catch (error) {
            console.error("saveInsights failed:", error);
            return Send.error(res, null, "Failed to save insights");
        }
    };
}

export default InsightsController;