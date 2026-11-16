"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface ComboboxOption {
  value: number;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "انتخاب کنید...",
  searchPlaceholder = "جستجو...",
  emptyText = "موردی یافت نشد",
  disabled = false,
  loading = false,
  error = null,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <Popover.Trigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          !selectedOption && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">
          {loading
            ? "در حال بارگذاری..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          sideOffset={4}
          align="start"
          className="z-[100] w-[var(--anchor-width)] pointer-events-auto"
        >
          <Popover.Popup
            dir="rtl"
            className="w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg outline-none"
          >
            <div className="flex items-center border-b border-border px-2.5 py-2 gap-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto p-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>در حال دریافت لیست...</span>
                </div>
              ) : error ? (
                <div className="py-4 px-3 text-center text-xs text-destructive">
                  {error}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onValueChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-right text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/60 font-medium"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
