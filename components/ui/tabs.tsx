"use client";
import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-dark data-[state=active]:bg-dark data-[state=active]:text-white [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("pt-5 outline-none data-[state=active]:animate-in", className)} {...props} />;
}

/** Pill-style segmented control for view switching. */
export function SegmentedList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-1", className)} {...props} />;
}

export function SegmentedTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-dark data-[state=active]:text-white [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}
