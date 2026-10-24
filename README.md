<div align="center">

# S L A S H E R

### DUNMOORE, MAINE · ARQUIVO Nº X

**A cidade nunca esquece. Só muda os registros.**

RPG digital de **survival horror, investigação e mistério**. Menus inspirados nos clássicos do PS1, efeitos CRT e uma mesa conectada diretamente entre jogadores e mestre.

![Edição](https://img.shields.io/badge/edi%C3%A7%C3%A3o-X-8d9fe7?style=flat-square&labelColor=080b14)
![Modo](https://img.shields.io/badge/modo%20padr%C3%A3o-P2P%20experimental-64b977?style=flat-square&labelColor=080b14)
![Stack](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JS-b4bed5?style=flat-square&labelColor=080b14)
![Servidor](https://img.shields.io/badge/banco%20de%20dados-nenhum-7599c7?style=flat-square&labelColor=080b14)

**[🎮 Abrir SLASHER](https://ssunkem.github.io/slasher/) · [⌁ Conectar uma mesa](#-jogar-p2p) · [📺 Interface](#-interface) · [📁 Backup](#-arquivos-e-backups) · [📖 Manual](manual-6.html)**

</div>

---

## ⌁ O que mudou?

O **SLASHER 10.2 (P2P + Cloudflare opcional)** funciona por padrão **sem Supabase**. O site é estático no GitHub Pages, mas as fichas, rolagens e alterações da sessão são sincronizadas via **WebRTC DataChannels**. O navegador do **mestre** é o host e mantém os dados oficiais da campanha.

- **Mestre:** cria ou abre uma campanha local, oferece conexões e mantém sua aba aberta.
- **Jogadores:** abrem o mesmo endereço, escolhem "Entrar na mesa do mestre" e participam sem criar contas.
- **RNG autoritativo do host:** o jogador solicita uma rolagem ou ataque; o mestre sorteia os valores e devolve o resultado confirmado. Isso impede que o jogador escolha livremente o resultado enviado ao host.
- **Permissões:** o host confere o dono da ficha, impede acesso a ações exclusivas do mestre e não compartilha as notas secretas do GM. Criaturas preparadas não são enviadas enquanto não há confronto ativo.
- **Persistência:** a campanha fica no navegador do host, com opção de exportar/importar um arquivo JSON de backup.

> [!IMPORTANT]
> **É um beta P2P; sala curta e TURN exigem implantação própria do Cloudflare Worker.** A conexão foi testada com um transporte WebRTC simulado e com a interface mestre/jogador no navegador. Ainda falta validar ICE/NAT com duas redes reais. Alguns roteadores ou operadoras precisam de retransmissão TURN, que não está configurada nesta versão. O modo P2P não garante conexão em qualquer rede.


> **10.1.3: Conexões manuais não usam TTL de convite.** O navegador tenta ICE enquanto o código de resposta ainda está sendo copiado. Antes de o mestre colar a resposta, `checking` ou até um `failed` precoce **não prova que o convite expirou**. O SLASHER agora mostra *Aguardando o mestre* durante essa etapa e ignora erros de convites antigos. O aviso de **45 segundos começa somente depois que o mestre aplica a resposta**. Se der falha após completar a troca, crie dois códigos novos.

## 🔪 Jogar P2P

O SLASHER usa WebRTC e **não precisa de Supabase**. O conteúdo da campanha fica no navegador do mestre. Quando o Worker Cloudflare estiver configurado, os jogadores entram com apenas **nove caracteres** (exemplo fictício `KD4RX8M2N`). Os detalhes de oferta/resposta e candidatos ICE são transmitidos automaticamente por um canal de sinalização.

### Mestre

1. Abra [SLASHER](https://ssunkem.github.io/slasher/), clique em **Hospedar como mestre**, crie ou abra uma campanha.
2. Na **Sala P2P**, clique em **Abrir sala com código curto**.
3. Envie o código de nove caracteres para os participantes. A sala aceita até seis jogadores nesta primeira implementação.
4. Mantenha a aba aberta. Faça backup da campanha no menu **Campanhas**.

### Jogadores

1. Abrem o mesmo link, escolhem **Entrar na mesa do mestre** e informam apelido e código curto.
2. O navegador troca automaticamente os detalhes WebRTC. Se a conexão direta não funcionar e TURN estiver habilitado, o relay pode ser utilizado.
3. A ficha e as ações são transmitidas ao host por um **WebRTC DataChannel**; o Worker não recebe fichas ou notas da campanha.

**Antes de implantar a Cloudflare**, o modo manual continua em **Conexão avançada / código manual**. É a mesma troca longa de convite/resposta que já tínhamos.

## ☁️ Ativar Cloudflare (uma vez, pelo dono do site)

> Sem a conta Cloudflare configurada, a opção de código curto permanece desativada. **Publicar o código no GitHub não implanta o Worker automaticamente.** Não coloque tokens secretos no GitHub nem no JavaScript público.

### 1. Criar e implantar o Worker

Crie uma conta no [Cloudflare Dashboard](https://dash.cloudflare.com/). Entre na pasta `cloudflare/` do projeto e execute:

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Este projeto usa um **Worker + Durable Object com armazenamento SQLite**, compatível com o plano gratuito do Workers. O Durable Object segura conexões WebSocket para repassar ofertas, respostas e candidatos ICE. **Não armazena dados da campanha**. O `wrangler.toml` já restringe as origens ao GitHub Pages do SLASHER e aos endereços locais de desenvolvimento.

Ao final do deploy, copie a URL pública `https://slasher-p2p.<seu-subdominio>.workers.dev`.

### 2. Habilitar TURN para redes difíceis

No painel Cloudflare, acesse **Realtime → TURN**, crie uma **TURN Key** e obtenha o **TURN Key ID** e o **API Token** da chave. Eles são **segredos permanentes**, não credenciais para enviar aos jogadores.

Na pasta `cloudflare/`, salve-os como *secrets* do Worker:

```bash
npx wrangler secret put TURN_KEY_ID
npx wrangler secret put TURN_API_TOKEN
```

Cole cada valor quando o terminal solicitar. O Worker pedirá credenciais ICE **temporárias** à API oficial da Cloudflare. As credenciais de curta duração serão entregues apenas a navegadores conectados a uma sala ativa, com um token de sessão efêmero.

> A Cloudflare anuncia uma franquia mensal compartilhada de **1.000 GB** de Realtime (TURN/SFU), com cobrança a partir do excedente. Confira a franquia, os preços e os avisos de uso no painel antes de colocar o Worker em produção. Workers e Durable Objects têm limites próprios.

### 3. Apontar o GitHub Pages para o Worker

Edite **`signal-config.js`** na raiz do projeto e coloque somente a **URL pública do Worker**:

```js
window.SLASHER_SIGNAL_URL = 'https://slasher-p2p.SEUSUBDOMINIO.workers.dev';
```

Faça commit dessa alteração. A partir daí, **Hospedar** e **Entrar** mostram o fluxo de código curto. Não há SQL, Supabase ou servidor próprio para administrar fichas.

### 4. Validar

Teste duas janelas independentes e, depois, PC + celular com configurações normais de privacidade. No diagnóstico ICE, uma rota `relay` significa que candidatos TURN foram oferecidos; conexão `connected` e `DataChannel: open` confirmam que a mesa realmente conectou. O Worker tem a rota pública `/health` para verificar se o serviço e o TURN estão configurados.

**Restrições atuais:** sem reconexão de identidade persistente; o código da sala é um convite com acesso à sessão (não publique); máximo de seis jogadores; sem áudio/vídeo e sem banco de dados da campanha na Cloudflare. O host precisa continuar online. O código curto não garante conexão se a Cloudflare não estiver disponível.

## 🧰 Conexão não abriu?

O **SLASHER 10.2** mostra as rotas ICE encontradas, o estado da negociação e falhas de conexão. Se o código de convite não tiver nenhuma rota WebRTC, ele avisa imediatamente em vez de deixar o jogador aguardando para sempre.

1. Teste primeiro com **PC e celular no mesmo Wi-Fi**, sem rede de convidados nem isolamento de dispositivos.
2. Desligue temporariamente VPN, bloqueios de WebRTC e conexões de dados móveis no celular.
3. Se o Worker estiver configurado, entre usando o código curto. Caso contrário, faça a troca manual completa: convite → resposta → aceitação.
4. Mantenha ambas as abas abertas; não recarregue após gerar os códigos.
5. Se aparecer **0 rotas** ou ICE **failed**, tente outro navegador ou rede. Algumas combinações de NAT/CGNAT precisam de um servidor TURN e não podem ser resolvidas apenas com código no GitHub Pages.

O diagnóstico não transmite senhas nem credenciais e não envia sua campanha a um backend.

## 📺 Interface

> *Uma tela velha. Um arquivo aberto. Uma cidade que não deveria existir nos registros.*

<div align="center">
  <img src="assets/preview-p2p-entry.webp" alt="Nova tela inicial P2P: hospedar como mestre ou entrar na mesa" width="100%">
  <sub>Entrada P2P · A estética de Dunmoore, agora sem Supabase</sub>
</div>

<div align="center">
  <img src="assets/preview-desktop.webp" alt="Mesa Atual em estilo survival horror CRT" width="100%">
  <sub>Mesa Atual · CRT Clássico · Bloom 100% · Aberração cromática 100%</sub>
</div>

<br>

<div align="center">
  <img src="assets/preview-settings.webp" alt="Configurações de vídeo e áudio" width="100%">
  <sub>Configurações · Imagem, efeitos e áudio em uma única aba</sub>
</div>

<details>
<summary><b>📱 Ver a interface no celular</b></summary><br>
<div align="center"><img src="assets/preview-mobile.webp" alt="SLASHER no navegador mobile" width="390"></div>
</details>

*As capturas mostram a identidade visual consolidada na versão 10.0; a edição P2P substituiu a antiga entrada por uma tela de hospedagem/conexão. A estética CRT permanece.*

### Funcionalidades atuais

| Para jogadores | Para o mestre | Atmosfera |
| :-- | :-- | :-- |
| 12 classes, retratos e atributos | Criar campanhas e NPCs | CRT Suave / Clássico / Intenso / Desligado |
| HP, Stamina e Estresse | Gerenciar fichas e condições | Bloom e aberração cromática reguláveis |
| Inventário e compra de itens | Loja, estoque, armas e catálogo | Efeitos sonoros lo-fi sintetizados |
| Testes D20 e combate | Monstros, HP, turnos e rolagens | Interface responsiva, vinheta e scanlines |
| Registros compartilhados | Arquivo da sessão armazenado localmente | Aba Configurações independente |

## 📁 Arquivos e backups

O **host salva os dados no armazenamento local do navegador**. Isso não equivale a um banco remoto nem é garantia de persistência: dados podem se perder se o usuário limpar o site, trocar de navegador ou entrar no modo privado.

Na tela **Campanhas**, o mestre encontra **Exportar backup** e **Restaurar backup**. O arquivo JSON guarda campanhas, fichas, rolagens, notas e dados da Mesa Atual. **Exporte ao final de cada sessão** e guarde uma cópia fora do navegador. A restauração substitui os arquivos locais e só é permitida quando não há jogadores conectados.

Os jogadores não mantêm uma cópia oficial da campanha. Se o mestre encerrar a aba, a sessão fica indisponível. **Reconexão automática e recuperação de identidade ainda estão em desenvolvimento**; se alguém retornar com uma nova conexão, o mestre talvez precise reatribuir a ficha.

## 🌐 Hospedagem

O aplicativo é estático. Para montar seu próprio endereço no GitHub Pages:

```bash
git clone https://github.com/ssunkem/slasher.git
cd slasher
python -m http.server 8000
```

O comando acima serve apenas para desenvolvimento local. No GitHub Pages, não é necessário operar um servidor de aplicação; o navegador do mestre é o host da sessão. O uso normal exige navegadores com WebRTC, uma conexão HTTPS (como GitHub Pages) e conectividade P2P entre os participantes.

**Limites atuais:** código curto exige implantação do Worker Cloudflare; TURN exige criação de chave e credenciais; host sempre presente, sem identidade persistente dos jogadores e sem testes de carga entre muitas pessoas. Compartilhe convites apenas com participantes de confiança. Conexões WebRTC podem expor endereços de rede entre os participantes.

## 🎛️ Configurações

A tela **Configurações** reúne intensidade CRT, bloom, aberração cromática, mute, volume e teste de sons. As preferências são individuais, permanecem no navegador e não precisam ser sincronizadas com a mesa.

## 🧪 Testes

Execute na raiz do projeto:

```bash
for file in tests/*.cjs; do node "$file"; done
```

Há testes da geração de dados, catálogo, formulários, controles CRT/SFX e fluxo de **oferta, resposta, sincronização e mensagens P2P** com transporte simulado. Testes reais de conectividade entre operadoras ainda são necessários antes de recomendar o P2P como solução universal.

## 📚 Arquivos principais

| Arquivo | Função |
| :-- | :-- |
| `index.html` | Entrada do aplicativo no GitHub Pages |
| `p2p.js` | Transporte WebRTC e sinalização automática/manual |
| `signal-config.js` | URL **pública** do Cloudflare Worker; sem segredos |
| `cloudflare/` | Worker + Durable Object para código curto e TURN temporário |
| `app.js`, `mesa71.js` | Regras e interface de mesa |
| `crt.js`, `crt.css` | Monitor CRT e efeitos |
| `sfx.js`, `sfx.css` | Sons sintetizados |
| `settings-page.js`, `settings.css` | Aba Configurações |
| `SLASHER_P2P_Preview_Local.html` | Demo local da interface P2P; integração curta depende de Worker |
| `SLASHER_Demo_Offline.html` | Demonstração individual anterior |
| `install.sql`, `schema.sql` | Arquivos históricos opcionais da integração Supabase; **não necessários para o P2P** |

---

<div align="center">

### S L A S H E R

*Três batidas. Uma voz conhecida do outro lado.*

**Não responda.**

`DUNMOORE / MAINE / ARQUIVO Nº X`

</div>


### Diagnóstico ICE 10.1.3

A Sala P2P informa separadamente ICE, estado da conexão e do DataChannel, e lista apenas os **tipos** de candidatos locais e remotos (`host`, `srflx`, `relay`, mDNS), sem expor endereços IP. Isso ajuda a distinguir falhas de sinalização e bloqueios de rede, mas não dispensa TURN quando necessário.