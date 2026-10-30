"use client";
import { useState } from "react";
import { PLANS } from "@/lib/plans";
import { Button, Card, Badge } from "@/components/ui";
export default function Plans() {
  const [msg, setMsg] = useState("");
  async function go(path: string, body?: object) {
    const r = await fetch(path, { method: "POST", body: JSON.stringify(body ?? {}) }), j = await r.json();
    if (r.status === 401) location.href = "/login"; else if (r.ok) location.href = j.url; else setMsg(j.error);
  }
  return (<main><header className="top"><h1>Planos</h1><a href="/">← Buscar</a></header>
    <div className="grid gap-4 sm:grid-cols-3">{Object.entries(PLANS).map(([k, p]) => (
      <Card key={k} className="flex flex-col gap-2"><div className="flex items-center justify-between"><b>{k}</b>{k === "PRO" && <Badge className="bg-indigo-100 text-indigo-800">popular</Badge>}</div>
        <p className="text-sm opacity-70">{p.searchesPerDay} buscas por dia · {p.leads} leads</p>
        {k === "FREE" ? <span className="text-sm opacity-70">Plano padrão</span> : <Button variant="primary" onClick={() => go("/api/billing/checkout", { plan: k })}>Assinar</Button>}</Card>))}</div>
    <p className="mt-4"><Button onClick={() => go("/api/billing/portal")}>Gerenciar assinatura (cancelar, cartão, faturas)</Button></p>
    <p className="mt-6 text-sm opacity-70"><a href="/privacidade">Como tratamos seus dados</a> · <button className="border-0 bg-transparent p-0 text-red-500 underline" onClick={async () => { if (confirm("Excluir sua conta e todos os seus leads? Isso não pode ser desfeito.")) { await fetch("/api/auth", { method: "DELETE" }); location.href = "/login"; } }}>Excluir minha conta e dados</button></p>
    {msg && <Card role="alert" className="mt-4">{msg}</Card>}</main>);
}
