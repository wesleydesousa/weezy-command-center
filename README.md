# Weezy Command Center

Painel profissional para planejamento de conteúdo, edição de Shorts e gestão de conta do criador.

## Recursos

- Banco de ideias, calendário editorial e acompanhamento de produção.
- Editor local de Shorts com cortes, reenquadramento e legendas.
- Login seguro com ChatGPT, sem armazenamento de senhas no projeto.
- Usuários, pedidos e acesso aos planos salvos em banco D1.
- Checkout Mercado Pago com Pix e cartão.
- Webhook assinado para confirmar pagamentos e ativar 30 dias de acesso.

## Pagamentos

Configure `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` no ambiente do site. A URL pública de webhook é `/api/payments/webhook`.

## Desenvolvimento

```bash
npm install
npm run db:generate
npm run dev
```
