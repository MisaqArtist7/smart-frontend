import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { normalizePhone } from "../contact-utils";
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

/**
 * ارسال مستقیم فرم تماس به اندپوینت POST /contact
 */
export async function submitContactForm(
  data: SubmitContactInput
): Promise<SubmitContactResponse> {
  const normalizedPhone = normalizePhone(data.phone);
  const payload = {
    fullName: data.fullName.trim(),
    phone: normalizedPhone,
    subject: data.subject,
    message: data.message.trim(),
    website: data.website || "",
  };

  return await apiFetch<SubmitContactResponse>("/contact", {
    method: "POST",
    body: payload,
  });
}

/**
 * هوک ارسال پیام تماس با ما توسط کاربر عمومی یا لاگین شده
 * POST /contact
 */
export function useSubmitContact() {
  return useMutation({
    mutationFn: async (input: SubmitContactInput): Promise<SubmitContactResponse> => {
      return await submitContactForm(input);
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
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (status) params.set("status", status);
      if (subject) params.set("subject", subject);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      return await apiFetch<AdminContactListResponse>(
        `/admin/contact?${params.toString()}`
      );
    },
  });
}

/**
 * دریافت جزئیات یک پیام در پنل ادمین
 * GET /admin/contact/:id
 */
export function useAdminContactMessage(id: number | null | undefined) {
  return useQuery<ContactMessage>({
    queryKey: ["admin-contact", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      return await apiFetch<ContactMessage>(`/admin/contact/${id}`);
    },
  });
}

/**
 * به‌روزرسانی وضعیت یا یادداشت ادمین برای یک پیام
 * PATCH /admin/contact/:id
 */
export function useUpdateAdminContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: UpdateAdminContactInput;
    }): Promise<ContactMessage> => {
      const payload: Record<string, unknown> = {};
      if (input.status !== undefined) payload.status = input.status;
      if (input.adminNote !== undefined) {
        payload.adminNote = input.adminNote ? input.adminNote.trim() : null;
      }

      return await apiFetch<ContactMessage>(`/admin/contact/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-contact", variables.id],
      });
    },
  });
}

/**
 * حذف یک پیام از صندوق پنل ادمین
 * DELETE /admin/contact/:id
 */
export function useDeleteAdminContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>(
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
