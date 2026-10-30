"use client";
import { useState } from "react";
export default function Reset() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget), token = new URLSearchParams(location.search).get("token");
    const body = token ? { action: "confirm", token, password: f.get("password") } : { action: "request", email: f.get("email") };
    const r = await fetch("/api/auth/reset", { method: "POST", body: JSON.stringify(body) }), j = await r.json();
    setMsg(r.ok ? (token ? "Senha alterada. Faça login." : "Se o e-mail existir, enviaremos um link.") : j.error);
  }
  const hasToken = typeof location !== "undefined" && new URLSearchParams(location.search).has("token");
  return (<main><h1>Redefinir senha</h1><form onSubmit={submit}>
    {hasToken ? <input name="password" type="password" minLength={10} placeholder="Nova senha (10+)" required /> : <input name="email" type="email" placeholder="E-mail" required />}
    <button className="primary">Enviar</button></form>{msg && <p role="status">{msg}</p>}<a href="/login">Voltar ao login</a></main>);
}
