# Integrações: como ativar cada serviço

O código de todas já existe. Falta só a chave de cada uma no arquivo `.env` (nunca cole chaves em chats, e-mails ou no Git). Depois de editar o `.env`, reinicie o `npm run dev` e abra `http://localhost:3000/api/health`: a seção `integrations` mostra `true/false` para cada serviço, sem revelar os valores.

## 1. Photon (autocompletar de localização) — já ativo, sem chave
Usa o servidor público `photon.komoot.io` (uso moderado). Defina `CONTACT_EMAIL` no `.env`. Para produção com tráfego, hospede seu próprio Photon ou use um provedor pago.

## 2. Google Places (segunda fonte de dados e categorias livres)
1. Em console.cloud.google.com, crie um projeto e ative o faturamento.
2. Ative a API **Places API (New)**.
3. Em Credenciais, crie uma chave de API e restrinja-a à Places API (e ao IP do servidor, em produção).
4. Coloque em `.env`: `GOOGLE_PLACES_API_KEY=...`
5. Configure alertas de orçamento e cotas no Google Cloud: a API é cobrada por requisição.
Atenção a licença: os termos do Google limitam armazenar e exportar seus dados. O SiteHunter não exporta linhas do Google e não guarda buscas com resultados do Google em cache; porém leads salvos guardam uma cópia (nome, endereço, telefone). Consulte os termos atuais do Google e um profissional jurídico antes de operar comercialmente.

## 3. Resend (recuperação de senha por e-mail)
1. Crie conta em resend.com e crie uma chave de API.
2. Para testes, use `MAIL_FROM=onboarding@resend.dev` (envia só para o e-mail da sua própria conta). Para produção, verifique seu domínio e use, por exemplo, `MAIL_FROM=SiteHunter <no-reply@seudominio.com>`.
3. No `.env`: `RESEND_API_KEY=...`, `MAIL_FROM=...`, `APP_URL=http://localhost:3000` (em produção, a URL real do site).

## 4. Stripe (assinaturas Pro e Business)
1. Crie conta em stripe.com e use o **modo de teste**.
2. Em Produtos, crie "Pro" e "Business" com preço recorrente mensal e copie os ids `price_...`.
3. Em Developers > API keys, copie a chave secreta `sk_test_...`.
4. Ative o **Customer Portal** em Settings > Billing > Customer portal (o botão "Gerenciar assinatura" depende disso).
5. Webhook local: instale o Stripe CLI e rode `stripe listen --forward-to localhost:3000/api/billing/webhook`; ele mostra um segredo `whsec_...`. Em produção, crie um endpoint apontando para `https://seusite/api/billing/webhook` com os eventos `checkout.session.completed` e `customer.subscription.deleted`.
6. No `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `APP_URL`.
7. Teste em `/plans` com o cartão `4242 4242 4242 4242` (qualquer data futura e CVC). Só passe para o modo real depois de testar o ciclo completo: assinar, o plano mudar, cancelar pelo portal e voltar para Gratuito.
