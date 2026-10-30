import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
/** Stripe Checkout (assinatura). Requer STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS, APP_URL. Nunca testado com conta real. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const plan = String((await req.json().catch(() => null))?.plan ?? ""), price = ({ PRO: process.env.STRIPE_PRICE_PRO, BUSINESS: process.env.STRIPE_PRICE_BUSINESS } as Record<string, string | undefined>)[plan];
  const { STRIPE_SECRET_KEY: key, APP_URL: app } = process.env;
  if (!key || !app || !price) return bad("Pagamento não configurado.", 503);
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", signal: AbortSignal.timeout(15000),
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ mode: "subscription", "line_items[0][price]": price, "line_items[0][quantity]": "1", success_url: `${app}/plans?ok=1`, cancel_url: `${app}/plans`, client_reference_id: u.id, customer_email: u.email, "metadata[plan]": plan }) });
  const j = await r.json(); if (!r.ok) return bad("Falha ao criar o checkout.", 502);
  return NextResponse.json({ url: j.url });
}
