<div align="center">

# 🔪 SLASHER 7.0

### DUNMOORE HORROR STORY

**O que a cidade enterrou ainda sabe o seu nome.**

*Um RPG de investigação e survival horror. Agora, com a mesa conectada.*

![Versão](https://img.shields.io/badge/vers%C3%A3o-7.0-9d2639?style=for-the-badge&labelColor=111115)
![Status](https://img.shields.io/badge/status-MVP%20experimental-702431?style=for-the-badge&labelColor=111115)
![Tecnologias](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JS-frontend-9d2639?style=for-the-badge&labelColor=111115)
![Backend](https://img.shields.io/badge/Supabase-multiplayer-702431?style=for-the-badge&labelColor=111115)

**[Conheça o projeto](#sobre-o-slasher) · [Funcionalidades](#o-que-já-existe) · [Como executar](#como-executar) · [Multiplayer](#ativando-o-multiplayer) · [Roadmap](#o-que-vem-depois)**

</div>

---

> *Três batidas na parede. Uma voz conhecida no corredor.*  
> *O problema nunca foi saber o que está do outro lado.*  
> **O problema é decidir se você vai responder.**

## Sobre o SLASHER

**SLASHER 7.0: Dunmoore Horror Story** é uma plataforma web para jogar um RPG de **horror, investigação e sobrevivência**. Aqui, monstros não são sacos de pontos de vida, ferimentos deixam marcas e descobrir a verdade costuma ser mais importante do que vencer uma luta.

A versão 7.0 leva o sistema para uma mesa digital: jogadores acompanham seus sobreviventes enquanto o mestre organiza a campanha, administra recursos, registra acontecimentos e conduz o terror de Dunmoore.

A proposta é simples: **facilitar a vida de quem narra sem tirar dos jogadores o medo de abrir a próxima porta.**

## Uma olhada em Dunmoore

<p align="center">
  <img src="assets/preview-desktop.webp" alt="Painel do mestre do SLASHER 7.0, com sobreviventes, campanha e últimos acontecimentos" width="100%">
</p>

<details>
<summary><b>📱 Ver a interface no celular</b></summary>
<br>
<p align="center"><img src="assets/preview-mobile.webp" alt="Interface responsiva do SLASHER 7.0 no celular" width="350"></p>
</details>

*As capturas mostram o modo de demonstração. A aparência é a mesma no modo conectado.*

## O que já existe

| Para os jogadores | Para o mestre |
| :-- | :-- |
| 🪪 Fichas digitais com retratos | 🗂️ Criação e organização de campanhas |
| 🎭 **12 classes** com atributos pré-definidos | 🔑 Entrada de jogadores por código de convite |
| ❤️ HP, Stamina, Estresse e condições | 🩸 Controle de recursos e estados dos personagens |
| 🎲 D20 animado e registro das rolagens | 🎁 Conceder ou remover itens e habilidades |
| 📖 Notas e acompanhamento dos personagens | 👥 Gerador de NPCs e atribuição de fichas |
| 📱 Interface adaptada para desktop e celular | 🕯️ Relógios de Suspeita e Perigo, notas secretas e log |

**No modo online**, as fichas, os recursos e as rolagens são armazenados no Supabase e sincronizados entre os membros da campanha. O banco aplica permissões para distinguir ações do mestre e dos jogadores.

### Entrar sem e-mail

A entrada principal é pelo **nome de usuário**, sem senha ou e-mail: o Supabase cria uma **conta anônima única**, e o nome escolhido funciona como apelido. Esse nome **não dá acesso** às contas de outros jogadores, mesmo se duas pessoas escolherem o mesmo.

> [!WARNING]
> **A conta anônima está vinculada à sessão deste navegador.** Não saia da conta, não limpe os dados do site e não troque de aparelho se quiser manter acesso às suas fichas e campanhas. Digitar o mesmo nome novamente cria outra identidade, não recupera a antiga. Para usar uma conta com recuperação, existe a opção secundária **Já tenho conta com e-mail**.

O banco continua aplicando RLS às contas anônimas, que têm IDs independentes. Ative *Allow anonymous sign-ins* no painel do Supabase antes de usar essa forma de entrada. Para um lançamento público, habilite CAPTCHA e considere um sistema de recuperação de contas.

**No modo demo**, essas funções podem ser experimentadas localmente, sem conta nem servidor, mas os dados **não são compartilhados entre computadores**.

### Sobre o combate

O SLASHER foi pensado para que **fugir, investigar, preparar uma armadilha ou encontrar um esconderijo** sejam escolhas tão importantes quanto atacar. A edição 7.0 aproveita as regras do SLASHER 6.0 e inclui um manual na própria aplicação.

## Como executar

Você não precisa instalar React, Node.js ou dependências de build.

### 1. Testar a demonstração

Baixe o repositório e abra **`SLASHER_7_0_Demo.html`** no navegador. Esse arquivo é independente e funciona sem Supabase.

Para servir a aplicação principal localmente, na raiz do projeto execute:

```bash
python -m http.server 8000
```

Depois acesse **http://localhost:8000**.

Sem configurar o Supabase, `index.html` inicia em **modo demonstração local**, usando armazenamento do próprio navegador quando disponível.

### 2. Ativando o multiplayer

Para jogar com pessoas em outros dispositivos, é necessário publicar o site e conectar um projeto [Supabase](https://supabase.com/).

**Passo 1.** Crie um projeto Supabase e, no **SQL Editor**, execute o arquivo [`schema.sql`](schema.sql) em um banco novo. Ele define tabelas, permissões e funções usadas pela aplicação.

**Passo 2.** Encontre a URL do projeto e sua chave **publishable** (ou a chave pública `anon`, em projetos antigos).

**Passo 3.** Preencha o arquivo [`config.js`](config.js):

```js
window.SLASHER_CONFIG = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_PUBLICAVEL'
};
```

> [!CAUTION]
> **Nunca coloque uma chave `service_role`, `sb_secret_*` ou qualquer segredo do servidor no `config.js` ou no GitHub.** Esse arquivo é público. Utilize apenas a chave projetada para aplicações cliente, com as políticas de Row Level Security habilitadas.

**Passo 4.** Publique os arquivos em uma hospedagem estática com HTTPS, como **GitHub Pages**, Cloudflare Pages ou Netlify.

Para usar **GitHub Pages**, abra o repositório e vá em **Settings → Pages → Build and deployment → Deploy from a branch**, selecionando a branch principal e a pasta **`/(root)`**. O site terá um endereço semelhante a:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

**Passo 5.** No Supabase, abra **Authentication → Settings / General** e habilite **Allow anonymous sign-ins** (a localização exata pode variar conforme a versão do painel). Confira **Authentication → URL Configuration** para o endereço do GitHub Pages e, se mantiver o login legado por e-mail, as URLs de confirmação.

**Passo 6.** No SLASHER, escolha um nome de usuário na tela inicial. A autenticação anônima cria uma sessão própria e mantém os convites e fichas associados àquele usuário enquanto o navegador preserva a sessão.

Pronto: o mestre acessa com um nome de usuário, cria uma campanha, compartilha o código de convite e os jogadores entram com suas próprias sessões.

> [!IMPORTANT]
> **Esta é uma versão experimental.** O modo demo foi testado localmente; o fluxo completo de autenticação e a sincronização entre contas reais ainda precisam ser validados em um Supabase configurado. Não interprete a presença do código multiplayer como garantia de produção.

## Estrutura do projeto

```text
SLASHER-7.0/
├── index.html                 # Entrada da aplicação online
├── styles.css                 # Interface preto e vermelho
├── app.js                     # Fichas, campanhas, rolagens e sincronização
├── config.js                  # Configuração pública do Supabase
├── schema.sql                 # Estrutura e permissões do banco
├── SLASHER_7_0_Demo.html      # Demonstração independente
├── manual-6.html              # Manual completo da edição anterior
├── assets/
│   ├── preview-desktop.webp
│   └── preview-mobile.webp
└── README.md
```

**Tecnologias:** HTML, CSS, JavaScript sem etapa de compilação; PostgreSQL, Supabase Auth e Supabase Realtime na modalidade conectada.

## O que vem depois

- [x] Fichas digitais e retratos
- [x] Classes e criação rápida de sobreviventes
- [x] Painel do mestre e NPCs aleatórios
- [x] Inventário, habilidades, condições e rolagens
- [x] Implementação inicial de banco e sincronização
- [ ] Testes completos de multiplayer com contas reais
- [ ] Biblioteca de monstros e perseguições interativas
- [ ] Mensagens privadas e manifestações sobrenaturais na interface
- [ ] Catálogo reutilizável de itens e habilidades por campanha
- [ ] Backup/exportação de campanhas e histórico para desfazer ações
- [ ] Testes de segurança e escala para uso público amplo

## Limitações conhecidas

O SLASHER 7.0 é um **MVP para mesas privadas**, não um serviço comercial pronto para grandes comunidades. Ainda não há backup automático próprio, reversão completa de mudanças ou testes de carga publicados. Salve cópias periódicas dos dados importantes e distribua códigos de convite apenas aos participantes da campanha.

As notas secretas do mestre são protegidas por permissões do banco no modo conectado; já as anotações normais das fichas podem ser vistas pelos membros da mesa. **Não use essas áreas para dados pessoais sensíveis.**

## Participação

Ideias, relatos de bugs e sugestões de mecânicas são bem-vindos pelas **Issues** do GitHub. Ao relatar um problema, informe se aconteceu no modo demo ou online, qual navegador estava usando e como reproduzi-lo, evitando publicar dados privados da campanha.

**Licença:** este repositório ainda não inclui uma licença de uso ou redistribuição. Defina uma licença antes de abrir o projeto para contribuições ou reutilização por terceiros.

---

<div align="center">

### SLASHER 7.0 · DUNMOORE HORROR STORY

*Você não precisa derrotar o monstro.*  
**Precisa sobreviver tempo suficiente para descobrir quem o deixou entrar.**

`DUNMOORE / MAINE / ARQUIVO Nº 07`

</div>