import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
const bad = (error: string, status: number) => NextResponse.json({ error }, { status });
/** Portal do cliente do Stripe: cancelamento, troca de cartão e faturas. Reembolsos são feitos no painel do Stripe. */
export async function POST() {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const { STRIPE_SECRET_KEY: key, APP_URL: app } = process.env;
  if (!key || !app || !u.stripeCustomerId) return bad("Nenhuma assinatura encontrada ou pagamento não configurado.", 404);
  const r = await fetch("https://api.stripe.com/v1/billing_portal/sessions", { method: "POST", signal: AbortSignal.timeout(15000),
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ customer: u.stripeCustomerId, return_url: `${app}/plans` }) });
  const j = await r.json(); return r.ok ? NextResponse.json({ url: j.url }) : bad("Falha ao abrir o portal.", 502);
}
