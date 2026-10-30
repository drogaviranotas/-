export const metadata = { title: "Privacidade · SiteHunter" };
/** Texto-base informativo: revise com um profissional jurídico antes de operar em produção. */
export default function Privacidade() {
  return (<main><h1>Privacidade</h1>
    <p>Guardamos apenas o necessário: seu e-mail e a senha (armazenada apenas como hash), os leads que você salvar (cópia de dados comerciais públicos obtidos de OpenStreetMap ou Google Places), seu histórico de pesquisas (localização, categoria e data) e sessões de login.</p>
    <p>Sessões expiram em 7 dias. O histórico de pesquisas é apagado após 90 dias. Os leads ficam até você removê-los.</p>
    <p>Você pode excluir sua conta e todos os dados associados a qualquer momento na página <a href="/plans">Planos</a>. Não usamos cookies de publicidade nem rastreadores; o único cookie é o de sessão.</p>
    <p className="muted">Este texto é informativo e deve ser revisado juridicamente (LGPD/GDPR) antes de uso comercial.</p>
    <a href="/">← Voltar</a></main>);
}
