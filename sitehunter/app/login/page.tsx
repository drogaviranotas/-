"use client";
import { useRef, useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const formRef = useRef<HTMLFormElement>(null);

  async function send(action: "login" | "register") {
    if (!formRef.current || busy) return;
    setErr("");
    setBusy(true);
    const form = new FormData(formRef.current);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: form.get("email"), password: form.get("password") }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || (action === "login" ? "Não foi possível entrar. Confira seus dados." : "Não foi possível criar a conta."));
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mercury-wrapper login-page">
      <div className="login-noise" aria-hidden="true" />
      <div className="login-stage" aria-hidden="true">
        <span className="login-blob blob-one" /><span className="login-blob blob-two" />
        <span className="login-blob blob-three" /><span className="login-blob blob-four" />
        <span className="login-orbit orbit-one" /><span className="login-orbit orbit-two" />
      </div>
      <section className="auth-container">
        <header className="auth-header">
          <span className="brand-id"><span className="status-dot" /> SITEHUNTER / SECURE ACCESS</span>
          <div className="auth-wordmark">SITE<span>HUNTER</span></div>
          <h1>{mode === "login" ? <>Acesse.<br /><span>Descubra.</span></> : <>Crie sua<br /><span>conta.</span></>}</h1>
          <p className="auth-intro">{mode === "login" ? "Entre na plataforma para encontrar oportunidades de negócio." : "Crie seu acesso e organize sua prospecção em um só lugar."}</p>
        </header>

        <form ref={formRef} className="auth-form" onSubmit={(event) => { event.preventDefault(); void send(mode); }}>
          <div className="form-group">
            <label htmlFor="email">IDENTIDADE / E-MAIL</label>
            <input id="email" name="email" type="email" placeholder="voce@empresa.com" autoComplete="email" required />
            <span className="input-glow" />
          </div>
          <div className="form-group">
            <label htmlFor="password">CHAVE DE ACESSO</label>
            <input id="password" name="password" type="password" placeholder="Mínimo de 10 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} required />
            <span className="input-glow" />
          </div>
          {err && <p className="auth-error" role="alert">{err}</p>}
          <div className="submit-wrap">
            <button type="submit" className="btn-base" disabled={busy}>{busy ? <><span className="auth-spinner" /> VALIDANDO ACESSO...</> : mode === "login" ? "ENTRAR NA PLATAFORMA ↗" : "CRIAR CONTA ↗"}</button>
          </div>
        </form>

        <div className="auth-switch">
          <span>{mode === "login" ? "AINDA NÃO TEM ACESSO?" : "JÁ POSSUI UMA CONTA?"}</span>
          <button type="button" onClick={() => { setErr(""); setMode(mode === "login" ? "register" : "login"); }}> {mode === "login" ? "CRIAR CONTA" : "FAZER LOGIN"}</button>
        </div>
        <footer className="auth-footer">
          <a href="/reset">RECUPERAR ACESSO</a>
          <a href="/privacidade">PRIVACIDADE</a>
          <span>CONEXÃO PROTEGIDA</span>
        </footer>
      </section>
      <div className="login-coordinate" aria-hidden="true">SH / 01 — LEAD INTELLIGENCE</div>
    </main>
  );
}
