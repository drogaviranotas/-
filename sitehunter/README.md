# SiteHunter

Aplicação Next.js para encontrar comércios por localização e categoria, identificar empresas sem site próprio, pontuar oportunidades e organizar contatos em um CRM.

## Tecnologias

- Next.js 15, React 19 e TypeScript
- PostgreSQL com Prisma ORM
- OpenStreetMap/Overpass e Photon; Google Places opcional
- Resend opcional para recuperação de senha
- Stripe opcional para assinaturas

## Rodar localmente (Windows PowerShell)

1. Instale Node.js LTS e Git.
2. Na pasta do projeto, crie seu arquivo local de variáveis:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Edite `.env` e informe `DATABASE_URL` de um banco PostgreSQL. Para desenvolvimento local, você pode usar o `docker-compose.yml` incluído (com Docker instalado).
4. Instale dependências e prepare o banco:

   ```powershell
   npm ci
   npx prisma db push
   ```

5. Inicie o projeto:

   ```powershell
   npm run dev
   ```

Acesse `http://localhost:3000`. O endpoint `/api/health` ajuda a verificar a conexão e as tabelas.

## Publicar no GitHub

1. Crie um repositório vazio no GitHub.
2. Confirme que `.env` não está sendo enviado. O `.gitignore` já bloqueia arquivos de ambiente e segredos.
3. Na pasta do projeto, execute:

   ```bash
   git init
   git add .
   git status
   git commit -m "Preparar SiteHunter para deploy"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```

Substitua a URL pelo endereço do seu repositório. Antes do commit, confira `git status` e nunca publique `.env`, senhas, tokens ou chaves de API.

## Deploy na Vercel

1. Crie um banco PostgreSQL gerenciado (por exemplo, Neon ou Supabase) e copie a URL de conexão com SSL.
2. Na Vercel, escolha **Add New → Project**, importe o repositório GitHub e mantenha o framework **Next.js**.
3. Em **Settings → Environment Variables**, configure ao menos:
   - `DATABASE_URL`: URL do PostgreSQL de produção.
   - `APP_URL`: URL pública do projeto, por exemplo `https://seu-projeto.vercel.app`.
   - `CRON_SECRET`: segredo aleatório longo para proteger a tarefa de limpeza agendada.
   - `CONTACT_EMAIL`: e-mail de contato para identificação nas consultas ao Photon/Overpass.
4. Configure também as integrações opcionais somente se for utilizá-las: `GOOGLE_PLACES_API_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO` e `STRIPE_PRICE_BUSINESS`.
5. Faça o primeiro deploy. O comando de build da Vercel usa `vercel-build` e gera o Prisma Client antes de compilar o Next.js.
6. Depois que o banco estiver configurado, execute **uma única vez** `npx prisma db push` apontando para o `DATABASE_URL` de produção. Você pode fazer isso localmente com a URL de produção no ambiente, ou por um terminal/console seguro. Não coloque credenciais no GitHub.
7. Abra `https://seu-projeto.vercel.app/api/health`. O resultado deve indicar `"ok": true` e as verificações de tabelas como `"ok"`.

A cada push na branch conectada, a Vercel poderá iniciar um novo deploy automaticamente.

## Comandos úteis

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run typecheck  # verificação TypeScript
npm test           # testes automatizados
npx prisma db push # sincronizar schema com o banco configurado
```

## Segurança e observações

- Nunca envie `.env` para GitHub. Use as Environment Variables da Vercel em produção.
- Não use `docker-compose.yml` como banco de produção na Vercel; configure PostgreSQL gerenciado.
- `DATABASE_URL` é obrigatório para login, CRM, histórico e demais recursos persistidos.
- Google Places, Resend e Stripe são opcionais e exigem configuração própria e testes com contas reais. Use o modo de teste do Stripe inicialmente.
- O cron de limpeza está definido em `vercel.json` e exige `CRON_SECRET`. Confira as limitações de cron do plano da sua conta Vercel.
- A busca por ausência de site é uma indicação baseada nas fontes consultadas, não uma confirmação absoluta.
- Revise os termos/licenças dos provedores de dados e a política de privacidade antes de operar comercialmente.
