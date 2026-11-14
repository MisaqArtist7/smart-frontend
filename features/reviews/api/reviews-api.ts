import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  ProductReview,
  ProductReviewsSummary,
  CreateReviewInput,
  AdminReviewListResponse,
  AdminReviewQueryOptions,
  AdminUpdateReviewInput,
  ReviewRecommendation,
  ReviewStatus,
} from "@/lib/types";

interface RawCommentItem {
  id: number;
  productId: number;
  userId?: number | null;
  userName?: string;
  userPhone?: string | null;
  isBuyer?: boolean;
  rating?: number;
  recommendation?: ReviewRecommendation;
  isRecommended?: boolean | null;
  title?: string | null;
  text?: string;
  message?: string;
  status?: string;
  adminReply?: string | null;
  adminReplyAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: number;
    title: string;
    slug: string;
    image?: string | null;
  };
  user?: {
    id: number;
    name?: string;
    phone?: string;
  };
}

interface RawCommentListResponse {
  items?: RawCommentItem[];
  reviews?: RawCommentItem[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * تبدیل دیدگاه از ساختار دیتابیس به ProductReview سازگار با فرانت‌اند
 */
function mapCommentToReview(raw: RawCommentItem): ProductReview {
  let recommendation: ReviewRecommendation = "NO_OPINION";
  if (raw.isRecommended === true) recommendation = "RECOMMENDED";
  else if (raw.isRecommended === false) recommendation = "NOT_RECOMMENDED";
  else if (raw.recommendation) recommendation = raw.recommendation;

  return {
    id: raw.id,
    productId: raw.productId,
    userId: raw.userId ?? null,
    userName: raw.user?.name || raw.userName || "کاربر سایت",
    userPhone: raw.user?.phone || raw.userPhone || null,
    isBuyer: Boolean(raw.isBuyer),
    rating: Number(raw.rating || 5),
    recommendation,
    title: raw.title ?? null,
    message: raw.text || raw.message || "",
    status: (raw.status as ReviewStatus) || "APPROVED",
    adminReply: raw.adminReply ?? null,
    adminReplyAt: raw.adminReplyAt ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
    product: raw.product,
  };
}

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
        let rawList: RawCommentItem[] = [];
        try {
          const res = await apiFetch<RawCommentItem[] | RawCommentListResponse>(
            `/comments/product/${productId}`
          );
          if (Array.isArray(res)) rawList = res;
          else if (res && Array.isArray(res.items)) rawList = res.items;
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            const fallback = await apiFetch<RawCommentItem[] | RawCommentListResponse>(
              `/products/${productId}/reviews`
            );
            if (Array.isArray(fallback)) rawList = fallback;
            else if (fallback?.reviews) rawList = fallback.reviews;
          } else {
            throw err;
          }
        }

        const reviewsList: ProductReview[] = rawList.map(mapCommentToReview);

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
      } catch {
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
    },
  });
}

/**
 * ثبت دیدگاه جدید برای محصول
 * POST /comments/product/:productId
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput): Promise<{ message?: string }> => {
      const payload: Record<string, unknown> = {
        text: input.message.trim(),
      };
      if (input.title && input.title.trim()) {
        payload.title = input.title.trim();
      }
      if (typeof input.rating === "number") {
        payload.rating = input.rating;
      }
      if (input.recommendation === "RECOMMENDED") {
        payload.isRecommended = true;
      } else if (input.recommendation === "NOT_RECOMMENDED") {
        payload.isRecommended = false;
      }

      try {
        return await apiFetch<{ message?: string }>(
          `/comments/product/${input.productId}`,
          {
            method: "POST",
            body: payload,
          }
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // فال‌بک به اندپوینت قدیمی در صورت نیاز
          return await apiFetch<{ message: string }>(
            `/products/${input.productId}/reviews`,
            {
              method: "POST",
              body: {
                rating: input.rating,
                recommendation: input.recommendation,
                title: input.title,
                message: input.message,
              },
            }
          );
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
 * GET /admin/comments
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
      if (productId) params.set("productId", String(productId));

      try {
        const res = await apiFetch<RawCommentListResponse | RawCommentItem[]>(
          `/admin/comments?${params.toString()}`
        );

        let items: ProductReview[] = [];
        let total = 0;

        if (res && "items" in res && Array.isArray(res.items)) {
          items = res.items.map(mapCommentToReview);
          total = res.total ?? items.length;
        } else if (Array.isArray(res)) {
          items = res.map(mapCommentToReview);
          total = items.length;
        }

        // فیلتر جستجوی کلاینت در صورتی که سرور جستجو نداشت
        if (search) {
          const lowerSearch = search.toLowerCase();
          items = items.filter(
            (item) =>
              item.message.toLowerCase().includes(lowerSearch) ||
              (item.title && item.title.toLowerCase().includes(lowerSearch)) ||
              item.userName.toLowerCase().includes(lowerSearch)
          );
        }

        const counts = {
          PENDING: items.filter((i) => i.status === "PENDING").length,
          APPROVED: items.filter((i) => i.status === "APPROVED").length,
          REJECTED: items.filter((i) => i.status === "REJECTED").length,
          TOTAL: total,
        };

        return {
          items,
          total,
          page,
          limit,
          counts,
        };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            items: [],
            total: 0,
            page: 1,
            limit,
            counts: { PENDING: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 },
          };
        }
        throw err;
      }
    },
  });
}

/**
 * به‌روزرسانی وضعیت یا ثبت پاسخ ادمین
 * PATCH /admin/comments/:id/status
 * PATCH /admin/comments/:id/reply
 */
export function useUpdateAdminReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminUpdateReviewInput): Promise<ProductReview> => {
      if (input.status) {
        const res = await apiFetch<RawCommentItem>(`/admin/comments/${input.id}/status`, {
          method: "PATCH",
          body: { status: input.status },
        });
        return mapCommentToReview(res);
      }

      if (input.adminReply !== undefined) {
        const res = await apiFetch<RawCommentItem>(`/admin/comments/${input.id}/reply`, {
          method: "PATCH",
          body: { adminReply: input.adminReply ? input.adminReply.trim() : "" },
        });
        return mapCommentToReview(res);
      }

      const res = await apiFetch<RawCommentItem>(`/admin/comments/${input.id}`, {
        method: "PATCH",
        body: input,
      });
      return mapCommentToReview(res);
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
      await apiFetch<{ message?: string }>(`/admin/comments/${id}`, {
        method: "DELETE",
      });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
}
