export const STATUSES = { NEW: "Novo", RESEARCHED: "Pesquisado", CONTACTED: "Contato realizado", REPLIED: "Respondeu", PROPOSAL: "Proposta enviada", NEGOTIATION: "Negociação", CLIENT: "Cliente", NOT_INTERESTED: "Não interessado" } as const;
export type LeadStatus = keyof typeof STATUSES;
