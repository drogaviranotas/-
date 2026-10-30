import { db } from "@/lib/db";
/** Diagnóstico: abre http://localhost:3000/api/health para ver se o banco responde e se as tabelas estão em dia com o schema. */
export async function GET() {
  const prod = process.env.NODE_ENV === "production", checks: Record<string, string> = {};
  const tables: Record<string, () => Promise<unknown>> = { User: () => db.user.count(), Session: () => db.session.count(), Lead: () => db.lead.count(), SearchLog: () => db.searchLog.count(), RateHit: () => db.rateHit.count(), PasswordReset: () => db.passwordReset.count() };
  for (const [name, fn] of Object.entries(tables)) {
    try { await fn(); checks[name] = "ok"; } catch (e) { checks[name] = prod ? "erro" : `erro: ${(e as Error).message.split("\n").filter(Boolean).pop()}`; }
  }
  const ok = Object.values(checks).every((v) => v === "ok");
  const e = process.env, integrations = { photon: "ativo (sem chave)", google: !!e.GOOGLE_PLACES_API_KEY, resend: !!(e.RESEND_API_KEY && e.MAIL_FROM && e.APP_URL),
    stripe: !!(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET && e.STRIPE_PRICE_PRO && e.STRIPE_PRICE_BUSINESS && e.APP_URL), contactEmail: !!e.CONTACT_EMAIL };
  return Response.json({ ok, integrations, hint: ok ? undefined : "Rode `npm run db:push` e reinicie o servidor (e confira DATABASE_URL e se o PostgreSQL está ativo).", checks }, { status: ok ? 200 : 500 });
}
