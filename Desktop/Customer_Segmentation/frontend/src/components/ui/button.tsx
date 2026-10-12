import { cn } from "@/lib/utils";

/** Minimal ghost/icon variants (no new deps). */
export function buttonVariants({ variant = "ghost", size = "icon" }: {
  variant?: "ghost" | "default"; size?: "icon" | "default";
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
    variant === "ghost" && "text-[#e9dec8] hover:bg-white/10 hover:text-emerald-200",
    variant === "default" && "bg-emerald-300 text-[#060c0a] hover:bg-emerald-200",
    size === "icon" && "size-12",
    size === "default" && "px-5 py-2.5 text-sm"
  );
}
