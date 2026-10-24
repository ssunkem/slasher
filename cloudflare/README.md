# SLASHER · Cloudflare Worker

O arquivo `src/worker.js` contém um Worker de **sinalização WebSocket com Durable Objects**. Ele cria salas de nove caracteres, encaminha ofertas/respostas/candidatos ICE e solicita credenciais temporárias TURN. **Dados do RPG nunca são enviados a este Worker.**

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put TURN_KEY_ID
npx wrangler secret put TURN_API_TOKEN
```

Aponte `window.SLASHER_SIGNAL_URL` (arquivo `../signal-config.js`) para a URL `https://...workers.dev`. O domínio `https://ssunkem.github.io` já está autorizado em `wrangler.toml`. Para outro domínio, atualize `ALLOWED_ORIGINS` antes de implantar.

O `TURN_KEY_ID` e `TURN_API_TOKEN` devem vir de **Cloudflare Realtime → TURN**. Não são o token global da conta Cloudflare. O Worker solicita as credenciais através de `https://rtc.live.cloudflare.com/v1/turn/keys/{id}/credentials/generate-ice-servers`, com TTL de 21600 segundos.

## Endpoints

- `GET /health`: status e se TURN está configurado, sem expor segredos.
- `POST /v1/rooms`: abre uma sala e retorna `code` e `hostToken` secreto ao anfitrião.
- `GET /v1/rooms/{code}/ws?role=host|guest`: WebSocket de negociação.
- `POST /v1/rooms/{code}/ice`: entrega ICE servers a sessões válidas por token temporário.

A sala aceita **1 host + 6 jogadores**. Limite básico de criação: **12 salas por IP/hora**. Mensagens de sinalização são validadas e limitadas a 33 KB. O Worker só aceita as origens explicitamente configuradas. Para uso público amplo, adicione Cloudflare WAF/Rate Limiting e monitore tráfego e custos de TURN: estes limites de aplicação não substituem proteção contra abuso distribuído.

## Testes

```bash
npm run check
node tests/signal.test.mjs
```

Os testes locais simulam o Durable Object e os WebSockets. **Não substituem** o deploy real e o teste WebRTC entre browsers / redes diferentes.