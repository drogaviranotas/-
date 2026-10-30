import "./globals.css";
export const metadata = {
  title: "SiteHunter — Lead Intelligence",
  description: "Prospecção inteligente de empresas e oportunidades de negócio.",
  applicationName: "SiteHunter",
  robots: { index: false, follow: false },
};
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
