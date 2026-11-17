"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectProps = React.ComponentProps<"select">

interface ParsedOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

const EMPTY_VALUE_SENTINEL = "__SELECT_EMPTY__"

function toInternalValue(val: string): string {
  return val === "" ? EMPTY_VALUE_SENTINEL : val
}

function fromInternalValue(val: string | null): string {
  if (!val || val === EMPTY_VALUE_SENTINEL) return ""
  return val
}

function extractOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    if (child.type === "option") {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>
      const rawValue = props.value !== undefined ? String(props.value) : String(props.children ?? "")
      options.push({
        value: rawValue,
        label: props.children,
        disabled: props.disabled,
      })
    } else if (child.type === "optgroup" || child.type === React.Fragment) {
      const props = child.props as { children?: React.ReactNode }
      if (props.children) {
        options.push(...extractOptions(props.children))
      }
    }
  })

  return options
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      name,
      id,
      disabled,
      required,
      ...props
    },
    forwardedRef
  ) => {
    const nativeRef = React.useRef<HTMLSelectElement | null>(null)
    const options = React.useMemo(() => extractOptions(children), [children])

    const isControlled = value !== undefined
    const initialUncontrolled =
      defaultValue !== undefined
        ? String(defaultValue)
        : options[0]?.value ?? ""

    const [uncontrolledValue, setUncontrolledValue] =
      React.useState<string>(initialUncontrolled)

    const currentValue = isControlled ? String(value ?? "") : uncontrolledValue

    // Sync uncontrolled value if react-hook-form updates native select DOM value (e.g. reset / setValue)
    React.useEffect(() => {
      if (!isControlled && nativeRef.current) {
        const domVal = nativeRef.current.value
        if (domVal !== uncontrolledValue) {
          setUncontrolledValue(domVal)
        }
      }
    })

    const setRefs = React.useCallback(
      (node: HTMLSelectElement | null) => {
        nativeRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef]
    )

    const selectedOption = options.find((opt) => opt.value === currentValue)

    const handleValueChange = (nextInternal: string | null) => {
      const nextValue = fromInternalValue(nextInternal)

      if (!isControlled) {
        setUncontrolledValue(nextValue)
      }

      if (nativeRef.current) {
        nativeRef.current.value = nextValue
        if (onChange) {
          const syntheticEvent = {
            target: nativeRef.current,
            currentTarget: nativeRef.current,
          } as React.ChangeEvent<HTMLSelectElement>
          onChange(syntheticEvent)
        }
      }
    }

    const handleOpenChange = (open: boolean) => {
      if (!open && onBlur && nativeRef.current) {
        const syntheticBlur = {
          target: nativeRef.current,
          currentTarget: nativeRef.current,
        } as React.FocusEvent<HTMLSelectElement>
        onBlur(syntheticBlur)
      }
    }

    return (
      <div className="relative w-full">
        {/* Hidden native select for react-hook-form ref/reset/form compatibility */}
        <select
          ref={setRefs}
          name={name}
          id={id}
          disabled={disabled}
          required={required}
          value={currentValue}
          onChange={onChange ?? (() => {})}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {children}
        </select>

        <SelectPrimitive.Root
          value={toInternalValue(currentValue)}
          onValueChange={handleValueChange}
          onOpenChange={handleOpenChange}
          disabled={disabled}
        >
          <SelectPrimitive.Trigger
            data-slot="select"
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 cursor-pointer text-start",
              className
            )}
          >
            <span
              className={cn(
                "truncate",
                !selectedOption || selectedOption.value === ""
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {selectedOption ? selectedOption.label : "انتخاب کنید"}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150" />
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              sideOffset={4}
              align="start"
              className="z-50"
            >
              <SelectPrimitive.Popup
                dir="rtl"
                data-slot="select-content"
                className="z-50 min-w-(--anchor-width) max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
              >
                <SelectPrimitive.List className="space-y-0.5">
                  {options.map((opt) => (
                    <SelectPrimitive.Item
                      key={toInternalValue(opt.value)}
                      value={toInternalValue(opt.value)}
                      disabled={opt.disabled}
                      className="relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs sm:text-sm outline-none transition-colors data-highlighted:bg-primary/10 data-highlighted:text-primary data-selected:bg-primary/10 data-selected:text-primary data-selected:font-bold data-disabled:pointer-events-none data-disabled:opacity-50"
                    >
                      <SelectPrimitive.ItemText className="truncate">
                        {opt.label}
                      </SelectPrimitive.ItemText>
                      <SelectPrimitive.ItemIndicator className="shrink-0 text-primary">
                        <Check className="size-4" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
