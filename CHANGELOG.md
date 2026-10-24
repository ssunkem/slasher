# SLASHER · Histórico de alterações

## 2.0.0-beta · Livro Básico, Edição de Teste I

- Migração da interface principal de D20 para D100, com Alvo 10–90, dificuldades e graus.
- Substituição de 12 classes por 12 Históricos, atributos FOR/AGI/PER/RAC/PRE/FIR e Competências.
- Ficha completa: Contato, Vínculos, Inventário, Preparo, Vitalidade, Fôlego, Tensão, Marcas, Risco de Morte e Ferimentos.
- Mesa Atual reescrita: ameaças humanas vs. anomalias, ataque e dano fixo, reação de esquiva, relógios configuráveis e caçadas.
- Nova aba de investigação com pistas, hipóteses e perguntas compartilhadas; notas secretas do narrador locais.
- Sincronização WebRTC mantida, com autorização centralizada para alteração de fichas e ações de jogadores.
- Compatibilidade preservada: fichas e módulos legados ficam armazenados sem conversão mecânica automática.
- Testes percentuais e de integração iniciais adicionados. Lançamento experimental, sujeito a playtest.

---


## 1.0.0 · Lançamento público (24 de outubro de 2026)

- Campanhas novas começam vazias, sem fichas, criaturas, itens, loja ou combate pré-preenchidos.
- O arquivo de exemplo de versões anteriores não aparece mais na lista padrão, sem apagar os dados locais.
- A entrada do mestre apresenta uma identidade neutra; a interface abandona os rótulos de demonstração.
- Convites curtos de nove caracteres são o caminho principal de entrada, via Cloudflare Worker; WebRTC manual permanece como opção avançada.
- Tela principal, configurações e manual atualizados para a versão pública.
- Persistência local da mesa P2P reforçada para alterações do mestre em combate, inventário e loja.
- Os dados continuam no navegador do mestre; recomendamos exportar backup ao fim de cada sessão.

### Compatibilidade

O formato legado do armazenamento local é mantido para evitar perda de campanhas e fichas existentes.

### Limitações conhecidas

O mestre precisa manter a aba aberta durante a sessão. Dependendo da rede, o WebRTC pode recorrer ao TURN. A reconexão automática não é garantida.