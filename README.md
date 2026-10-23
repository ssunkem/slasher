<div align="center">

# 🔪 SLASHER

### DUNMOORE · MAINE

**O que a cidade enterrou ainda sabe o seu nome.**

*Um RPG de investigação e survival horror. Agora, com a mesa conectada.*

![Versão](https://img.shields.io/badge/edi%C3%A7%C3%A3o-VII-70b9d0?style=for-the-badge&labelColor=10212d)
![Status](https://img.shields.io/badge/status-MVP%20experimental-476c80?style=for-the-badge&labelColor=10212d)
![Tecnologias](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JS-frontend-70b9d0?style=for-the-badge&labelColor=10212d)
![Backend](https://img.shields.io/badge/Supabase-multiplayer-476c80?style=for-the-badge&labelColor=10212d)

**[Conheça o projeto](#sobre-o-slasher) · [Funcionalidades](#o-que-já-existe) · [Como executar](#como-executar) · [Multiplayer](#ativando-o-multiplayer) · [Roadmap](#o-que-vem-depois)**

</div>

---

> *Três batidas na parede. Uma voz conhecida no corredor.*  
> *O problema nunca foi saber o que está do outro lado.*  
> **O problema é decidir se você vai responder.**

## Sobre o SLASHER

**SLASHER** é uma plataforma web para jogar um RPG de **horror, investigação e sobrevivência**. Aqui, monstros não são sacos de pontos de vida, ferimentos deixam marcas e descobrir a verdade costuma ser mais importante do que vencer uma luta.

A versão 7.1 leva o sistema para uma mesa digital: jogadores acompanham seus sobreviventes enquanto o mestre organiza a campanha, administra recursos, registra acontecimentos e conduz o terror de Dunmoore.

A proposta é simples: **facilitar a vida de quem narra sem tirar dos jogadores o medo de abrir a próxima porta.**

## Uma olhada em Dunmoore

<p align="center">
  <img src="assets/preview-desktop.png" alt="Painel do mestre do SLASHER 7.1, com sobreviventes, campanha e últimos acontecimentos" width="100%">
</p>

<details>
<summary><b>📱 Ver a interface no celular</b></summary>
<br>
<p align="center"><img src="assets/preview-mobile.png" alt="Interface responsiva do SLASHER 7.1 no celular" width="350"></p>
</details>

*As capturas existentes mostram a interface anterior. A nova identidade usa azul-gelo, montanhas, pinheiros e névoa animada. Confira `SLASHER_Dunmoore_Demo_Local.html` para visualizar o novo tema.*

## Nova identidade e dados locais (edição VII)

O nome do produto agora aparece simplesmente como **SLASHER**. A edição é informada discretamente em **algarismos romanos** no rodapé. A estética visual é inspirada na atmosfera de Dunmoore: **preto azulado, azul-gelo, montanhas, pinheiros e camadas de névoa**. O destaque vermelho fica reservado a alertas, e as animações respeitam `prefers-reduced-motion`.

O D20 e o dado de dano são sorteados **imediatamente no navegador** usando `crypto.getRandomValues`, sem aguardar a resposta do Supabase para exibir o dado. Os resultados são enviados ao banco em segundo plano. O servidor ainda valida as permissões, o equipamento equipado, a defesa e o HP antes de registrar um ataque e alterar a ficha. Se a sincronização falhar, a interface informa que o dado **não foi registrado**.

### Ativar as rolagens locais no multiplayer

1. Abra [`migrate_dice_local.sql`](migrate_dice_local.sql), clique em **Raw** e copie o conteúdo.
2. No projeto Supabase já configurado, entre em **SQL Editor → New query** e execute o script. **Não apague nem refaça `schema.sql`**.
3. Recarregue o site com `Ctrl + F5`, abra a Mesa Atual e teste uma rolagem. Depois teste um combate com duas contas reais.

> [!CAUTION]
> O navegador é uma origem **não confiável** para resultados aleatórios: um usuário técnico pode manipulá-los. O banco confere números válidos e autorização, mas **não pode provar que o D20 foi sorteado honestamente**. Use este modo para mesas privadas e confiáveis. Para mesas públicas/competitivas, mantenha rolagens autoritativas no servidor ou implemente outra forma auditável de sorteio. A migração preserva as funções antigas para compatibilidade.

## Catálogo inicial e criação de monstros (7.1.2)

A Mesa Atual ganhou o dock **Catálogo de Dunmoore**, com **7 modelos de criaturas, 9 armas e 14 itens**. O mestre pode invocar uma criatura, entregar equipamentos ao sobrevivente selecionado, cadastrar produtos individuais na loja ou abastecê-la com um kit inicial em um clique. Tudo sem precisar digitar nome e dano a cada sessão.

O formulário **Criar monstro** também foi corrigido: faltava uma aspa no atributo `data-mesa-form`, impedindo a ação de ser reconhecida. O cadastro manual continua disponível.

Os objetos e ameaças usam como referência a novelização do projeto, renomeada para **O Rei Oculto** e ambientada em **Dunmoore**. Estatísticas, preços e nomes de oponentes são adaptações de gameplay; consulte [CATALOGO_DUNMOORE.md](CATALOGO_DUNMOORE.md) para origem e descrições. Nenhuma criatura é revelada aos jogadores ao abrir a campanha: o mestre escolhe quando invocar.

**Não há SQL novo nesta atualização.** Execute `migrate_7_1.sql` apenas se ainda não tiver instalado a Mesa Atual no Supabase.

## Correção de formulários da Mesa Atual (7.1.1)

A versão 7.1.1 corrige um erro de integração que ignorava formulários da Mesa Atual sem `id`. Agora o mestre pode **entregar itens ou armas**, **abrir/fechar a loja** e **cadastrar produtos** no painel, com mensagens de confirmação. Também foi corrigida a referência interna ao estado do combate no ataque do sobrevivente.

**Não é necessário executar uma nova migração SQL** para esse patch. Para conferir a correção execute `node tests/formularios-mesa71.cjs` (Node.js) ou use a demonstração offline. No site publicado, recarregue a página com `Ctrl + F5`. O código só atualiza os dados de fato depois que a resposta do Supabase confirma a operação.

## Mesa Atual · Novo na 7.1

A página **Mesa Atual** é a central jogável do SLASHER, inspirada em painéis de investigação e inventários de survival horror. Ao entrar numa campanha, cada jogador encontra:

- **Retrato em destaque:** vida, stamina, estresse, efeitos e item equipado; o mestre pode alternar também entre fichas de NPCs e criaturas.
- **Docks personalizados:** inventário, rolagem rápida, combate, loja, log de ataques e notas. Arraste os painéis no desktop ou use as setas; recolha os que não precisa. A ordem é salva no navegador por usuário e campanha.
- **Inventário com armas reais:** o mestre concede uma arma e informa o dado de dano. O jogador a equipa e o ataque utiliza esse dado automaticamente.
- **Combate compartilhado:** o mestre abre o combate. O navegador sorteia D20 e dado de dano; o servidor recebe os resultados e confere arma, defesa, permissão e HP antes de aplicar o golpe. O histórico mostra atacante, alvo, foto, defesa, acerto e **barra animada com HP antes e depois**.
- **Monstros persistentes:** cada criatura tem HP, defesa e dado de ataque próprio, armazenados no Supabase.
- **Loja da cena:** o mestre cadastra itens, preços e estoque, e decide quando abrir. Compras verificam permissões, saldo e estoque no banco.

> [!IMPORTANT]
> O **SLASHER 7.1 requer uma migração adicional no Supabase**. Não execute o `schema.sql` inteiro outra vez nem apague tabelas existentes. O script `migrate_7_1.sql` adiciona somente as estruturas novas. Veja as instruções abaixo.

### Atualizar o banco existente para 7.1

1. Abra **Supabase → SQL Editor → New query**.
2. Abra [`migrate_7_1.sql`](migrate_7_1.sql) no GitHub, clique em **Raw** e copie todo o conteúdo.
3. Cole na nova query e execute **Run** uma vez. O script preserva campanhas, fichas e dados da edição 7.0.
4. Atualize o SLASHER no navegador (`Ctrl + F5`) e abra a nova aba **Mesa Atual**.
5. Consulte [`TESTES_7_1.md`](TESTES_7_1.md) para criar uma criatura, entregar uma arma e validar o combate entre duas contas.

**Conta de jogador:** a entrada rápida por username permanece disponível, desde que **Anonymous Sign-Ins** esteja habilitado em Authentication no Supabase. A identidade pertence à sessão do navegador, não apenas ao apelido.

**Teste sem banco:** abra [`SLASHER_Dunmoore_Demo_Local.html`](SLASHER_7_1_Demo.html). A demo funciona sem conta nem servidor e já vem com duas criaturas, uma arma e uma pequena loja de exemplo. O banco online não é modificado pelo modo demo.

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

**No modo demo**, essas funções podem ser experimentadas localmente, sem conta nem servidor, mas os dados **não são compartilhados entre computadores**.

### Sobre o combate

O SLASHER foi pensado para que **fugir, investigar, preparar uma armadilha ou encontrar um esconderijo** sejam escolhas tão importantes quanto atacar. A edição VII aproveita as regras do SLASHER 6.0 e inclui um manual na própria aplicação.

## Como executar

Você não precisa instalar React, Node.js ou dependências de build.

### 1. Testar a demonstração

Baixe o repositório e abra **`SLASHER_Dunmoore_Demo_Local.html`** no navegador. Esse arquivo é independente e funciona sem Supabase.

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

**Passo 5.** No Supabase, confira as opções de autenticação e as URLs autorizadas em **Authentication → URL Configuration**, principalmente se a confirmação de e-mail estiver ativa.

Pronto: o mestre cria uma conta e uma campanha, compartilha o código de convite e os jogadores entram com suas próprias contas.

> [!IMPORTANT]
> **Esta é uma versão experimental.** O modo demo foi testado localmente; o fluxo completo de autenticação e a sincronização entre contas reais ainda precisam ser validados em um Supabase configurado. Não interprete a presença do código multiplayer como garantia de produção.

## Estrutura do projeto

```text
SLASHER-7.0/
├── index.html                 # Entrada da aplicação online
├── styles.css                 # Interface preto e vermelho
├── app.js                     # Fichas, campanhas, rolagens e sincronização
├── mesa71.js                  # Mesa atual, docks, combate e loja
├── mesa71.css                 # Estética do painel de sessão
├── config.js                  # Configuração pública do Supabase
├── schema.sql                 # Estrutura e permissões base do banco
├── migrate_7_1.sql           # Migração aditiva para a Mesa Atual
├── migrate_dice_local.sql     # Funções para rolagens locais com validação
├── dice-local.js             # Sorteio do D20 e dados no navegador
├── dunmoore.css              # Tema glacial, paisagem e microanimações
├── SLASHER_Dunmoore_Demo_Local.html # Preview sem servidor
├── CATALOGO_DUNMOORE.md      # Referências da novelização, monstros, armas e itens
├── SLASHER_7_1_Demo.html      # Demonstração independente
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
- [x] Monstros persistentes com HP, defesa e ataque
- [x] Loja, equipamentos e combate com dano automático
- [x] Mesa Atual com docks rearranjáveis
- [x] Catálogo mestre com criaturas, armas e itens iniciais
- [x] Criação personalizada de monstros corrigida
- [ ] Perseguições e efeitos sobrenaturais avançados
- [ ] Mensagens privadas e manifestações sobrenaturais na interface
- [ ] Catálogo reutilizável de itens e habilidades por campanha
- [ ] Backup/exportação de campanhas e histórico para desfazer ações
- [ ] Testes de segurança e escala para uso público amplo

## Limitações conhecidas

O SLASHER 7.1 é um **MVP para mesas privadas**, não um serviço comercial pronto para grandes comunidades. A 7.1 é uma versão de teste: ainda é necessário validar o fluxo conectado entre contas reais após a migração. Ainda não há backup automático próprio, reversão completa de mudanças ou testes de carga publicados. Salve cópias periódicas dos dados importantes e distribua códigos de convite apenas aos participantes da campanha.

As notas secretas do mestre são protegidas por permissões do banco no modo conectado; já as anotações normais das fichas podem ser vistas pelos membros da mesa. **Não use essas áreas para dados pessoais sensíveis.**

## Participação

Ideias, relatos de bugs e sugestões de mecânicas são bem-vindos pelas **Issues** do GitHub. Ao relatar um problema, informe se aconteceu no modo demo ou online, qual navegador estava usando e como reproduzi-lo, evitando publicar dados privados da campanha.

**Licença:** este repositório ainda não inclui uma licença de uso ou redistribuição. Defina uma licença antes de abrir o projeto para contribuições ou reutilização por terceiros.

---

<div align="center">

### SLASHER · DUNMOORE

*Você não precisa derrotar o monstro.*  
**Precisa sobreviver tempo suficiente para descobrir quem o deixou entrar.**

`DUNMOORE / MAINE / ARQUIVO Nº 07`

</div>