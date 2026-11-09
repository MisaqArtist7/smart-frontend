import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "../api";
import type {
  SubmitContactInput,
  SubmitContactResponse,
  ContactMessage,
  AdminContactListResponse,
  AdminContactQueryOptions,
  UpdateAdminContactInput,
} from "../types";

export * from "../types";
export * from "../contact-utils";
export { ApiError };

/**
 * ارسال پیام تماس با ما توسط کاربر عمومی یا ثبت‌نام شده
 * POST /contact
 */
export function useSubmitContact() {
  return useMutation({
    mutationFn: async (input: SubmitContactInput): Promise<SubmitContactResponse> => {
      const payload: Record<string, unknown> = {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        subject: input.subject,
        message: input.message.trim(),
        website: input.website ?? "",
      };

      return await apiFetch<SubmitContactResponse>("/contact", {
        method: "POST",
        body: payload,
      });
    },
  });
}

/**
 * دریافت لیست پیام‌های صندوق ارتباط با مشتریان در پنل ادمین
 * GET /admin/contact
 */
export function useAdminContactList(options: AdminContactQueryOptions = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const status = options.status || undefined;
  const subject = options.subject || undefined;
  const search = options.search?.trim() || undefined;
  const dateFrom = options.dateFrom || undefined;
  const dateTo = options.dateTo || undefined;

  return useQuery<AdminContactListResponse>({
    queryKey: [
      "admin-contact",
      { page, limit, status, subject, search, dateFrom, dateTo },
    ],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (page) q.set("page", String(page));
      if (limit) q.set("limit", String(limit));
      if (status) q.set("status", status);
      if (subject) q.set("subject", subject);
      if (search) q.set("search", search);
      if (dateFrom) q.set("dateFrom", dateFrom);
      if (dateTo) q.set("dateTo", dateTo);

      const qs = q.toString();
      const endpoint = `/admin/contact${qs ? `?${qs}` : ""}`;

      return await apiFetch<AdminContactListResponse>(endpoint);
    },
    refetchOnWindowFocus: true,
  });
}

/**
 * دریافت جزئیات یک پیام تماس با ما در پنل ادمین
 * GET /admin/contact/:id
 */
export function useAdminContactMessage(id: number | string | undefined | null) {
  return useQuery<ContactMessage | null>({
    queryKey: ["admin-contact-message", id],
    queryFn: async () => {
      if (!id) return null;
      return await apiFetch<ContactMessage>(`/admin/contact/${id}`);
    },
    enabled: Boolean(id),
  });
}

/**
 * به‌روزرسانی وضعیت یا یادداشت ادمین پیام تماس
 * PATCH /admin/contact/:id
 */
export function useUpdateAdminContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: UpdateAdminContactInput): Promise<ContactMessage> => {
      const payload: Record<string, unknown> = {};
      if (status) payload.status = status;
      if (adminNote !== undefined) {
        payload.adminNote = adminNote.trim() ? adminNote.trim().slice(0, 1000) : null;
      }

      return await apiFetch<ContactMessage>(`/admin/contact/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-contact-message", variables.id],
      });
    },
  });
}

/**
 * حذف یک پیام تماس با ما توسط ادمین
 * DELETE /admin/contact/:id
 */
export function useDeleteAdminContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<{ success?: boolean; message?: string }> => {
      return await apiFetch<{ success?: boolean; message?: string }>(
        `/admin/contact/${id}`,
        {
          method: "DELETE",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
    },
  });
}
