<div align="center">

# S L A S H E R

### DUNMOORE, MAINE · ARQUIVO Nº X

**A cidade nunca esquece. Só muda os registros.**

Uma mesa digital de **survival horror e investigação**, com combate, fichas, registros e a atmosfera de um monitor esquecido nos anos 1990.

**[◈ Entrar em Dunmoore](https://ssunkem.github.io/slasher/) · [⌁ Como jogar](#como-jogar) · [📺 Interface](#interface) · [📖 Manual de regras](manual-6.html)**

</div>

---

## A mesa

O mestre abre uma campanha no navegador, cria a sala e compartilha um **código de nove caracteres**. Os jogadores entram pelo mesmo endereço, sem cadastro. O SLASHER usa **WebRTC** para sincronizar fichas, ações e rolagens. A Cloudflare auxilia na negociação entre navegadores e oferece retransmissão TURN quando necessário.

O mestre controla o estado oficial da campanha. Os dados de jogo são armazenados localmente no navegador dele, não num banco de dados público. **Não é necessário criar uma conta Supabase.**

## Como jogar

| Mestre | Jogadores |
|---|---|
| Acesse **[SLASHER](https://ssunkem.github.io/slasher/)** e escolha **Hospedar como mestre**. | Acesse o mesmo site e escolha **Entrar na mesa do mestre**. |
| Crie ou abra uma campanha e vá à **Sala P2P**. | Informe seu apelido e o código da sala. |
| Clique em **Abrir sala com código curto** e compartilhe o código com a mesa. | Aguarde a conexão e abra a **Mesa Atual**. |
| Mantenha o navegador aberto durante a sessão. | Jogue normalmente com o mestre conectado. |

Uma sala aceita até **seis jogadores**, além do mestre. Em redes restritivas, o WebRTC pode recorrer ao TURN. Caso o serviço de sinalização esteja indisponível, a tela oferece **Conexão avançada / código manual** como alternativa.

> **Importante:** o host deve permanecer online. Salas não têm identidade persistente de jogador nem reconexão automática garantida. Uma conexão de internet com restrições severas pode impedir o P2P mesmo com relay. Compartilhe códigos de sala apenas com quem participará da campanha.

## O que você encontra em Dunmoore

| Sobreviventes | Mestre | Atmosfera |
|---|---|---|
| 12 classes, atributos e retratos | Campanhas, personagens e NPCs | Menus inspirados no survival horror do PS1 |
| HP, Stamina e Estresse | Monstros, turnos e combate | CRT com scanlines e vinheta |
| Inventário, itens e loja | Gestão de estoque e equipamentos | Bloom e aberração cromática ajustáveis |
| Rolagens D20 e ações de combate | Histórico de ações e rolagens | Áudio lo-fi sintetizado |
| Ficha sincronizada com a mesa | Catálogo de criaturas e objetos | Visual responsivo para computador e celular |

O [Catálogo de Dunmoore](CATALOGO_DUNMOORE.md) reúne criaturas, armas e itens pensados para a campanha **O Rei Oculto**.

## Interface

<div align="center">
  <img src="assets/preview-p2p-entry.webp" alt="Entrada da mesa, com opções para hospedar ou participar" width="100%">
  <sub>O mestre abre a porta. Os sobreviventes decidem se entram.</sub>
</div>

<div align="center">
  <img src="assets/preview-desktop.webp" alt="Interface principal da mesa, com visual de monitor CRT" width="100%">
  <sub>Mesa Atual · Fichas, combate e arquivos de Dunmoore</sub>
</div>

<div align="center">
  <img src="assets/preview-settings.webp" alt="Controles de imagem e áudio" width="100%">
  <sub>Configurações · Imagem e som da sessão</sub>
</div>

<details>
<summary><b>Ver interface no celular</b></summary>
<div align="center"><img src="assets/preview-mobile.webp" alt="Visual do SLASHER em tela móvel" width="390"></div>
</details>

## Salvar sua campanha

O SLASHER salva a campanha no **armazenamento local do navegador do mestre**. Na área **Campanhas**, use **Exportar backup** para baixar um JSON e **Restaurar backup** para recuperar uma cópia.

**Faça backup depois de cada sessão.** Limpar dados do navegador, usar uma janela privada ou trocar de aparelho pode apagar a única cópia oficial da campanha. Evite compartilhar arquivos de backup: eles podem conter informações particulares da mesa e notas do mestre.

## Tecnologia

O site é hospedado pelo **GitHub Pages**, em HTML, CSS e JavaScript. A troca de dados da mesa usa **WebRTC DataChannels**. Um **Cloudflare Worker com Durable Objects** conecta os participantes por meio de códigos curtos; o serviço Cloudflare TURN pode servir de relay quando a conexão direta não for possível.

- **[Abrir o aplicativo](https://ssunkem.github.io/slasher/)**
- **[Código-fonte](https://github.com/ssunkem/slasher)**
- **[Serviço de conexão](cloudflare/README.md)**: implantação, configuração e manutenção do Worker
- **[Manual de regras](manual-6.html)**

As credenciais permanentes do TURN ficam nos **Secrets do Cloudflare Worker**, nunca no site, no JavaScript público ou nos arquivos do GitHub. A URL em `signal-config.js` é pública e não contém senhas.

<details>
<summary>Instalação local para colaboradores</summary>

```bash
git clone https://github.com/ssunkem/slasher.git
cd slasher
python -m http.server 8000
```

Abra `http://localhost:8000`. Para implantar sua própria instância do serviço de salas, consulte [`cloudflare/README.md`](cloudflare/README.md). Os arquivos da antiga arquitetura com Supabase estão preservados em [`legacy/`](legacy/), sem participação no fluxo atual.

</details>

---

<div align="center">

### S L A S H E R

*Três batidas. Uma voz conhecida do outro lado.*

**Não responda.**

`DUNMOORE / MAINE / ARQUIVO Nº X`

</div>