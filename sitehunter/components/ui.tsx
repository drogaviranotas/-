import { cn } from "@/lib/cn";
/** Primitivos no estilo shadcn/ui, com Tailwind. */
export function Button({ variant = "outline", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) {
  return <button className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60", variant === "primary" && "border-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white", variant === "outline" && "border border-[var(--bd)] bg-transparent", variant === "ghost" && "border-0 bg-transparent", className)} {...p} />;
}
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-[var(--bd)] bg-[var(--card)] p-4 shadow-sm", className)} {...p} />;
}
export function Badge({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", className)} {...p} />;
}
