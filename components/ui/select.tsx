"use client";
import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Plain text of option children, e.g. `{c.name}` or `Any {"client"}`. */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Collects `<option>` elements from children, looking through arrays and fragments. */
function collectOptions(children: React.ReactNode, out: SelectOption[] = []): SelectOption[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, out);
      return;
    }
    if (child.type === "option") {
      const p = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const label = textOf(p.children);
      out.push({ value: p.value != null ? String(p.value) : label, label, disabled: p.disabled });
    }
  });
  return out;
}

/** Options at or below this count open without a search box (keyboard still works). */
const SEARCH_THRESHOLD = 6;

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** `<option value="…">Label</option>` elements, as with a native select. */
  children: React.ReactNode;
  placeholder?: string;
  /** Show a search box. Defaults to on for lists longer than six options. */
  searchable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
}

/**
 * Searchable select. Opens a listbox on click, Enter, Space or the arrow keys;
 * type to filter, move with ↑/↓ (Home/End), choose with Enter or a click, close
 * with Escape. Takes `<option>` children so call sites read like a native select.
 */
export function Select({
  value,
  onValueChange,
  children,
  placeholder = "Select…",
  searchable,
  disabled,
  id,
  className,
  contentClassName,
  "aria-label": ariaLabel,
}: SelectProps) {
  const options = React.useMemo(() => collectOptions(children), [children]);
  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const selected = options.find((o) => o.value === value);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const firstEnabled = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < filtered.length; i += step) if (!filtered[i].disabled) return i;
    return -1;
  };

  const openWith = (seed = "") => {
    if (disabled) return;
    setQuery(seed);
    const idx = seed ? 0 : options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const choose = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return;
    setOpen(false);
    if (opt.value !== value) onValueChange(opt.value);
  };

  // Keep the active option in view while navigating.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const move = (next: number) => {
      e.preventDefault();
      if (next >= 0) setActive(next);
    };
    switch (e.key) {
      case "ArrowDown":
        return move(firstEnabled(active + 1, 1));
      case "ArrowUp":
        return move(firstEnabled(active - 1, -1));
      case "Home":
        return move(firstEnabled(0, 1));
      case "End":
        return move(firstEnabled(filtered.length - 1, -1));
      case "Enter":
        e.preventDefault();
        return choose(filtered[active]);
      case "Tab":
        setOpen(false);
        return;
      default:
        // Without a search box, typing jumps to the first option starting with that letter.
        if (!showSearch && e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          const start = filtered.findIndex((o, i) => i > active && !o.disabled && o.label.toLowerCase().startsWith(k));
          const wrap = start >= 0 ? start : filtered.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(k));
          if (wrap >= 0) setActive(wrap);
        }
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => (o ? openWith() : setOpen(false))} modal>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          onKeyDown={(e) => {
            if (open) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              openWith();
            } else if (showSearch && e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
              // Typing on the closed trigger opens it with that text as the search.
              e.preventDefault();
              openWith(e.key);
            }
          }}
          className={cn(
            "flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-card pl-3 pr-2.5 text-left text-sm shadow-xs transition-colors hover:border-zinc-300 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:border-ring",
            className,
          )}
        >
          {/* Every label is laid out invisibly in one grid cell so an auto-width trigger
              sizes to the longest option (like a native select) and never jumps. */}
          <span className="grid min-w-0 flex-1 overflow-hidden">
            {options.map((o) => (
              <span key={o.value} aria-hidden className="invisible col-start-1 row-start-1 truncate whitespace-nowrap">
                {o.label}
              </span>
            ))}
            <span className={cn("col-start-1 row-start-1 truncate whitespace-nowrap", !selected && "text-muted-foreground")}>
              {selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (showSearch ? searchRef.current : listRef.current)?.focus();
          }}
          className={cn(
            "z-50 flex max-h-[min(340px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] min-w-48 max-w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in",
            contentClassName,
          )}
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onListKeyDown}
                placeholder="Search…"
                role="combobox"
                aria-label={ariaLabel ? `Search ${ariaLabel.toLowerCase()}` : "Search options"}
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={filtered[active] ? optionId(active) : undefined}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={showSearch ? -1 : 0}
            aria-activedescendant={!showSearch && filtered[active] ? optionId(active) : undefined}
            onKeyDown={showSearch ? undefined : onListKeyDown}
            className="scrollbar-thin overflow-y-auto overscroll-contain p-1 outline-none"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No results</div>
            ) : (
              filtered.map((o, i) => {
                const isSelected = o.value === value;
                return (
                  <div
                    key={o.value}
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    onPointerMove={() => !o.disabled && i !== active && setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm select-none",
                      i === active && "bg-zinc-100",
                      isSelected && "font-medium",
                      o.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-foreground" />}
                  </div>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
