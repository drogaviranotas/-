import { db } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";
/** O plano só muda aqui, após assinatura válida do Stripe; nunca por chamada do navegador. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET; if (!secret) return new Response("Pagamento não configurado", { status: 503 });
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) return new Response("Assinatura inválida", { status: 400 });
  const ev = JSON.parse(raw), o = ev.data?.object;
  if (ev.type === "checkout.session.completed" && o?.client_reference_id && ["PRO", "BUSINESS"].includes(o.metadata?.plan))
    await db.user.updateMany({ where: { id: o.client_reference_id }, data: { plan: o.metadata.plan, stripeCustomerId: o.customer } });
  if (ev.type === "customer.subscription.deleted" && o?.customer) await db.user.updateMany({ where: { stripeCustomerId: o.customer }, data: { plan: "FREE" } });
  return new Response("ok");
}
