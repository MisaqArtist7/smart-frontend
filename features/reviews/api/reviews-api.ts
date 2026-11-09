import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  ProductReview,
  ProductReviewsSummary,
  CreateReviewInput,
  AdminReviewListResponse,
  AdminReviewQueryOptions,
  AdminUpdateReviewInput,
} from "@/lib/types";

/**
 * دریافت دیدگاه‌های تأییدشده یک محصول به همراه آمار کلی
 */
export function useProductReviews(productId: number | undefined | null) {
  return useQuery<{
    reviews: ProductReview[];
    summary: ProductReviewsSummary;
  }>({
    queryKey: ["product-reviews", productId],
    enabled: typeof productId === "number" && productId > 0,
    queryFn: async () => {
      try {
        const data = await apiFetch<{
          reviews?: ProductReview[];
          items?: ProductReview[];
          summary?: ProductReviewsSummary;
        } | ProductReview[]>(`/products/${productId}/reviews`);

        let reviewsList: ProductReview[] = [];
        if (Array.isArray(data)) {
          reviewsList = data;
        } else if (data && typeof data === "object") {
          reviewsList = data.reviews || data.items || [];
        }

        // فقط دیدگاه‌های تأییدشده برای عموم کاربران
        const approvedReviews = reviewsList.filter(
          (r) => !r.status || r.status === "APPROVED"
        );

        // محاسبه آمار و خلاصه دیدگاه‌ها
        const total = approvedReviews.length;
        const sumRating = approvedReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
        const averageRating = total > 0 ? Number((sumRating / total).toFixed(1)) : 5;

        const recommendedCount = approvedReviews.filter(
          (r) => r.recommendation === "RECOMMENDED"
        ).length;
        const notRecommendedCount = approvedReviews.filter(
          (r) => r.recommendation === "NOT_RECOMMENDED"
        ).length;
        const noOpinionCount = approvedReviews.filter(
          (r) => r.recommendation === "NO_OPINION"
        ).length;

        const evaluatedCount = recommendedCount + notRecommendedCount;
        const satisfactionRate =
          evaluatedCount > 0
            ? Math.round((recommendedCount / evaluatedCount) * 100)
            : total > 0
            ? 100
            : 0;

        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        approvedReviews.forEach((r) => {
          const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
          ratingCounts[star] = (ratingCounts[star] || 0) + 1;
        });

        const summary: ProductReviewsSummary = {
          averageRating,
          totalReviews: total,
          satisfactionRate,
          recommendationCounts: {
            recommended: recommendedCount,
            notRecommended: notRecommendedCount,
            noOpinion: noOpinionCount,
          },
          ratingCounts,
        };

        return { reviews: approvedReviews, summary };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // فال‌بک به اندپوینت عمومی /reviews?productId=
          try {
            const fallback = await apiFetch<ProductReview[]>(
              `/reviews?productId=${productId}`
            );
            const list = Array.isArray(fallback) ? fallback : [];
            return {
              reviews: list,
              summary: {
                averageRating: 5,
                totalReviews: list.length,
                satisfactionRate: 100,
                recommendationCounts: { recommended: list.length, notRecommended: 0, noOpinion: 0 },
                ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: list.length },
              },
            };
          } catch {
            // در صورت عدم وجود اندپوینت، یک پاسخ پیش‌فرض استاندارد
            return {
              reviews: [],
              summary: {
                averageRating: 5,
                totalReviews: 0,
                satisfactionRate: 100,
                recommendationCounts: { recommended: 0, notRecommended: 0, noOpinion: 0 },
                ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              },
            };
          }
        }
        throw err;
      }
    },
  });
}

/**
 * ثبت دیدگاه جدید برای محصول
 * POST /products/:productId/reviews
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput): Promise<{ message: string }> => {
      const payload = {
        rating: input.rating,
        recommendation: input.recommendation,
        title: input.title ? input.title.trim() : undefined,
        message: input.message.trim(),
      };

      try {
        return await apiFetch<{ message: string }>(
          `/products/${input.productId}/reviews`,
          {
            method: "POST",
            body: payload,
          }
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<{ message: string }>(`/reviews`, {
            method: "POST",
            body: { ...payload, productId: input.productId },
          });
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-reviews", variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
}

/**
 * دریافت لیست دیدگاه‌ها در پنل ادمین
 * GET /admin/comments (با فال‌بک به /admin/reviews)
 */
export function useAdminReviews(options: AdminReviewQueryOptions = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const status = options.status === "ALL" ? "" : options.status || "";
  const search = options.search?.trim() || "";
  const productId = options.productId;

  return useQuery<AdminReviewListResponse>({
    queryKey: ["admin-reviews", { page, limit, status, search, productId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (productId) params.set("productId", String(productId));

      try {
        return await apiFetch<AdminReviewListResponse>(
          `/admin/comments?${params.toString()}`
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<AdminReviewListResponse>(
            `/admin/reviews?${params.toString()}`
          );
        }
        throw err;
      }
    },
  });
}

/**
 * به‌روزرسانی وضعیت یا ثبت پاسخ ادمین
 * PATCH /admin/comments/:id
 */
export function useUpdateAdminReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminUpdateReviewInput): Promise<ProductReview> => {
      const payload: Record<string, unknown> = {};
      if (input.status) payload.status = input.status;
      if (input.adminReply !== undefined) {
        payload.adminReply = input.adminReply ? input.adminReply.trim() : null;
      }

      try {
        return await apiFetch<ProductReview>(`/admin/comments/${input.id}`, {
          method: "PATCH",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<ProductReview>(`/admin/reviews/${input.id}`, {
            method: "PATCH",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
}

/**
 * حذف یک دیدگاه توسط ادمین
 * DELETE /admin/comments/:id
 */
export function useDeleteAdminReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean }> => {
      try {
        return await apiFetch<{ success: boolean }>(`/admin/comments/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<{ success: boolean }>(`/admin/reviews/${id}`, {
            method: "DELETE",
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
}

