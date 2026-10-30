"use client";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (<main><h1>Algo deu errado</h1><p className="muted">{error.message}</p><button onClick={reset}>Tentar de novo</button> <a href="/">Início</a></main>);
}
