# Infraestrutura de conexão | SLASHER

O SLASHER usa um **Cloudflare Worker com Durable Objects** para criar salas privadas por código e trocar mensagens de sinalização WebRTC. A campanha, as fichas e as rolagens oficiais permanecem no navegador do mestre. O serviço não funciona como banco de dados da mesa.

**Instância pública:** [`slasher-p2p.slasher-dunmoore.workers.dev`](https://slasher-p2p.slasher-dunmoore.workers.dev/health)

## Manutenção e implantação

Na pasta `cloudflare/`:

```bash
npm install
npx wrangler login
npx wrangler deploy
```

O `wrangler.toml` define o binding `ROOMS` do Durable Object e as origens aceitas. O GitHub Pages consulta o endereço público definido em [`../signal-config.js`](../signal-config.js). Para outra instalação, ajuste a URL pública e a lista de origens.

## TURN

O TURN é opcional e retransmite dados quando os navegadores não conseguem estabelecer uma rota direta. Crie uma TURN Key em **Cloudflare Realtime → TURN** e armazene os valores no Worker como **Secrets**, nunca no frontend ou em commits:

```bash
npx wrangler secret put TURN_KEY_ID
npx wrangler secret put TURN_API_TOKEN
```

A rota `GET /health` informa `turnConfigured` para indicar a **presença** dos dois segredos. Isso não comprova que a API gerou credenciais ou que uma conexão utilizou o relay. A confirmação real requer uma sessão WebRTC; um par ICE selecionado de tipo `relay` comprova a retransmissão.

## Rotas de serviço

| Endpoint | Finalidade |
|---|---|
| `GET /health` | Estado do serviço, sem revelar segredos |
| `POST /v1/rooms` | Criação da sala de nove caracteres |
| `GET /v1/rooms/{code}/ws` | Troca de ofertas, respostas e candidatos ICE por WebSocket |
| `POST /v1/rooms/{code}/ice` | Credenciais temporárias para sessões autorizadas |

Cada sala aceita um mestre e até seis jogadores. Há limites básicos de mensagens e criação de salas, mas o serviço público deve ser acompanhado por monitoramento de uso e custos e, quando necessário, regras adicionais de segurança/rate limiting no painel Cloudflare. O código de uma sala deve ser compartilhado apenas com participantes de confiança.

Os scripts de verificação técnica ficam em `cloudflare/tests/` e `../tests/`. Eles não substituem verificações de conectividade entre redes reais.