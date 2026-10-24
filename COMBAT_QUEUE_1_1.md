# SLASHER 1.1 · Fase 1: combate mais legível

Esta é uma melhoria **de interface para o sistema 1.0**. Nenhuma classe, atributo, dificuldade ou dado de dano foi alterado.

## O que mudou

- Uma **fila visual** aparece acima das janelas personalizáveis assim que o narrador inicia um combate.
- Mostra Rodada, **AGINDO**, **PRÓXIMO**, **JÁ AGIU** e **CAÍDO**, com retrato, HP e, para sobreviventes, STA/EST.
- Os controles **Concluir turno** e **Nova rodada** aparecem **somente para o mestre**.
- Quando todos concluem seus turnos, a fila espera o mestre clicar em **Nova rodada**. Nunca avança a rodada sozinha.
- Participantes incapacitados são destacados e pulados automaticamente.
- Sobreviventes e monstros criados ou adicionados durante a cena entram no fim da lista, sem apagar a ordem ou a rodada em andamento.
- Uma faixa de **Última ação** exibe graficamente quem atacou quem, o dado D20, total versus defesa, acerto e dano.
- O registro detalhado dos ataques continua disponível na janela **Registro de combate**.
- Alterações de turno são salvas junto ao encontro em `slasher71_local_<campanha>` e transmitidas pelo snapshot P2P para jogadores.

## Como testar

### Sem instalar nada

1. Acesse `SLASHER_1.1_PREVIEW_LOCAL.html` nesta branch e clique em **Download raw file**.
2. Abra o HTML com Chrome ou Edge.
3. Clique em **Hospedar como mestre**, crie uma campanha e pelo menos dois sobreviventes.
4. No **Painel do mestre**, crie uma criatura. Em **Combate atual**, inicie o confronto.
5. Confira a ordem visível, use **Concluir turno** e **Nova rodada** e faça um ataque. Teste também uma criatura a 0 HP.

### Teste de integração da branch

```bash
git clone -b feat/slasher-1-1-combat-queue --single-branch https://github.com/ssunkem/slasher.git
cd slasher
node tests/combat-queue.cjs
node tests/dados-locais.cjs
python -m http.server 8000
```

Abra `http://localhost:8000`. Para testar multiplayer, use dois navegadores/dispositivos, com o host online e a sala P2P funcionando.

## Detalhes técnicos

- `combat-queue.js`: funções puras `start/reconcile/advance/newRound/status`, sem bibliotecas ou dependência do DOM.
- `combat-queue.css`: cartões, estados e versão mobile responsiva.
- `mesa71.js`: integra o rastreador ao fluxo de encontros e à persistência existente; valida todas as alterações de rodada como exclusivas do mestre.
- `index.html`: apenas carrega os dois arquivos novos e atualiza as versões de cache.

**Limites intencionais:** a fila não é uma mecânica automática de iniciativa; começa pela ordem de fichas e monstros cadastrados. Reordenação manual e atrasar ação ficam para a fase 2. O sistema D20 continua resolvendo os ataques sem encerrar o turno automaticamente.

**Segurança de lançamento:** os dados salvos pela 1.0 permanecem compatíveis. Esta é uma branch de avaliação, ainda não aplicada ao site público.
