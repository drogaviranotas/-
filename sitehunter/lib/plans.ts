/** Limites configuráveis por plano. Sem pagamento integrado: o plano é definido manualmente no banco (User.plan). */
export const PLANS = { FREE: { searchesPerDay: 5, leads: 50 }, PRO: { searchesPerDay: 100, leads: 2000 }, BUSINESS: { searchesPerDay: 1000, leads: 20000 } } as const;
export const planOf = (p: string) => PLANS[p as keyof typeof PLANS] ?? PLANS.FREE;
