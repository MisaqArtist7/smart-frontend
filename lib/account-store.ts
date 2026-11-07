"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type User,
  type Address,
  type Order,
  INITIAL_USER,
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
} from "./account-data";

interface AccountStore {
  user: User;
  addresses: Address[];
  orders: Order[];
  isAuthenticated: boolean;
  setAuthUser: (userData: { id?: string | number; name?: string; phone: string; role?: User["role"] }) => void;
  logout: () => void;
  updateUser: (name: string) => void;
  addAddress: (address: Omit<Address, "id" | "userId">) => void;
  updateAddress: (id: string, address: Partial<Omit<Address, "id" | "userId">>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  uploadReceipt: (orderId: string, receiptUrl: string) => void;
  addOrder: (order: Order) => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      user: INITIAL_USER,
      addresses: INITIAL_ADDRESSES,
      orders: INITIAL_ORDERS,
      isAuthenticated: false,

      setAuthUser: (userData) =>
        set((state) => ({
          isAuthenticated: true,
          user: {
            ...state.user,
            id: userData.id ? String(userData.id) : state.user.id,
            name: userData.name || state.user.name,
            phone: userData.phone,
            role: userData.role || state.user.role,
          },
        })),

      logout: () =>
        set(() => ({
          isAuthenticated: false,
        })),

      updateUser: (name: string) =>
        set((state) => ({
          user: { ...state.user, name },
        })),

      addAddress: (newAddr) =>
        set((state) => {
          const id = `addr-${Date.now()}`;
          let updatedAddresses = [...state.addresses];
          if (newAddr.isDefault) {
            updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
          }
          const address: Address = {
            ...newAddr,
            id,
            userId: state.user.id,
          };
          return { addresses: [address, ...updatedAddresses] };
        }),

      updateAddress: (id, updated) =>
        set((state) => {
          let addresses = [...state.addresses];
          if (updated.isDefault) {
            addresses = addresses.map((a) => ({ ...a, isDefault: false }));
          }
          addresses = addresses.map((a) => (a.id === id ? { ...a, ...updated } : a));
          return { addresses };
        }),

      deleteAddress: (id) =>
        set((state) => {
          const remaining = state.addresses.filter((a) => a.id !== id);
          // اگر آدرس پیش‌فرض حذف شد و آدرس دیگری وجود داشت، اولین را پیش‌فرض کن
          if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
            remaining[0].isDefault = true;
          }
          return { addresses: remaining };
        }),

      setDefaultAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        })),

      uploadReceipt: (orderId, receiptUrl) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  receiptUrl,
                  paymentStatus: "PAID",
                  status: o.status === "PENDING" ? "CONFIRMED" : o.status,
                }
              : o
          ),
        })),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),
    }),
    {
      name: "smart-electric-account",
    }
  )
);

