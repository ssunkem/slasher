<div align="center">

# S L A S H E R

### DUNMOOR, MAINE · ARQUIVO Nº X

**A cidade nunca esquece. Só muda os registros.**

**SLASHER 2.0 · Edição de Teste I (branch de desenvolvimento)**

[◈ Abrir a mesa pública 1.0](https://ssunkem.github.io/slasher/) · [Regras rápidas 2.0](REGRAS_V2.md) · [Código-fonte](https://github.com/ssunkem/slasher)

</div>

## O que mudou na edição de teste

A mesa digital está sendo migrada do D20 para o sistema percentil do **SLASHER · Livro Básico, Edição de Teste I**.

- **Fichas sem classes:** seis atributos (FOR, AGI, PER, RAC, PRE, FIR), valores 65/55/50/45/40/35; doze Históricos; cinco Competências treinadas, uma delas especializada; Contato e três Vínculos.
- **D100:** Alvo igual a atributo + treinamento + circunstâncias, limitado entre 10 e 90. Dificuldades Normal, Difícil e Extremo; sucessos Normal/Forte/Extraordinário, Virada 01 e Revés 100.
- **Recursos:** Vitalidade 6, Fôlego 5, Tensão 0/6, Preparo 2 por Caso, Ferimentos Graves e Risco de Morte 0–3.
- **Combate:** ataques percentuais, dano fixo por equipamento, esquiva com Reação/Fôlego. Ameaças anômalas não ganham HP artificial.
- **Caçadas:** Distância 0–4, manobras, velocidade do perseguidor e Saída declarada.
- **Investigação:** pistas confirmadas, hipóteses e perguntas públicas; arquivo secreto separado no navegador do Narrador.
- **Relógios:** contadores da cena configuráveis (4 ou 6 segmentos) e relógios de campanha mantidos.

O núcleo das regras está em `rules-engine.js`; a ficha e rolagens, em `slasher-v2.js`; os encontros, em `mesa-v2.js`; e o quadro de casos, em `investigation.js`.

**Nota de escopo:** a implementação cobre os fluxos fundamentais e ainda é de *playtest*. Testes forçados, tipos de ferimentos com recuperação automatizada, evolução por gasto de Marcas, editor avançado de fichas de anomalias e aprovação formal de Preparo Retroativo ainda dependem de operações do Narrador. Consulte o livro para resolver esses casos. Não trate esta branch como sistema final homologado.

## Hospedar e participar

O SLASHER usa **GitHub Pages**, **WebRTC DataChannels** e serviço de sinalização **Cloudflare** para códigos curtos. Os dados oficiais permanecem no navegador do mestre; o host precisa manter a sessão aberta.

1. O mestre escolhe **Hospedar como mestre**, cria ou abre uma campanha e ativa a **Sala P2P**.
2. Compartilha o código curto de nove caracteres.
3. Os jogadores escolhem **Entrar na mesa do mestre**, digitam seu apelido e o código.
4. O mestre controla os dados da campanha. O jogador cria e consulta sua própria ficha e pede ações ao host.

O P2P não tem identidade persistente forte nem reconexão automaticamente garantida. Compartilhe o código apenas com os participantes.

## Compatibilidade e backups

A edição 2.0 **não converte automaticamente** atributos D20 em competências percentuais: não existe equivalência fiel. Personagens e mesas do sistema 1.0 são preservados e identificados como legados. Crie novas fichas 2.0 para jogar com estas regras.

O armazenamento anterior usa `slasher7-demo-v1` e `slasher71_local_`. A cena 2.0 usa `slasher2_table_`, e o quadro compartilhado de investigação usa `slasher2_investigation_`. As notas sigilosas do narrador ficam em `slasher2_secrets_`.

Na área **Campanhas**, exporte um backup antes de testes e após sessões. Apagar os dados do navegador pode eliminar a cópia oficial. Faça backup também das notas sigilosas que não estejam incluídas em exportações antigas.

## Testes

Os novos testes estão em `tests/rules-v2.cjs` e `tests/mesa-v2.cjs`; rodam com Node.js sem dependências externas:

```bash
node tests/rules-v2.cjs
node tests/mesa-v2.cjs
```

Os testes originais em `tests/` e o material em `legacy/` permanecem para referência histórica. Alguns verificam componentes 1.0 deliberadamente retirados do fluxo principal e não representam mais o comportamento do site 2.0.

## Execução local

```bash
git clone https://github.com/ssunkem/slasher.git
cd slasher
python -m http.server 8000
```

Acesse `http://localhost:8000`. Para a configuração do serviço de salas, consulte `cloudflare/README.md`.

## Cânone

O módulo de cenário atual chama-se **Dunmoor** e o antagonista **O Rei Oculto**. A antiga novelização **O Messias Afogado**, ambientada em Ashborough, é fonte de atmosfera, não uma regra mecânica do Livro Básico. Catálogos e arquivos legados permanecem disponíveis para consulta histórica.
