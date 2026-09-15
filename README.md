# Weezy Command Center

Painel profissional para planejamento de conteúdo, edição de Shorts e gestão de conta do criador.

## Recursos

- Banco de ideias, calendário editorial e acompanhamento de produção.
- Editor local de Shorts com cortes, reenquadramento e legendas.
- Clipes configuráveis de até 4 minutos e transcrição completa de entradas de até 3 GB.
- Login seguro com ChatGPT, sem armazenamento de senhas no projeto.
- Usuários, pedidos e acesso aos planos salvos em banco D1.
- Checkout Mercado Pago com Pix e cartão.
- Webhook assinado para confirmar pagamentos e ativar 30 dias de acesso.
- Plano Creator limitado a 5 edições por dia e 150 por mês; plano Pro sem limite.

## Pagamentos

Configure `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` no ambiente do site. A URL pública de webhook é `/api/payments/webhook`.

O processamento de vídeo e legendas continua local no navegador. Arquivos grandes dependem da memória e do codec disponíveis no dispositivo. A publicação direta no YouTube ainda não faz parte desta versão.

## Desenvolvimento

```bash
npm install
npm run db:generate
npm run dev
```
