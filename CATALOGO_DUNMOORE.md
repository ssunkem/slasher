# ☠ Arquivo de Dunmoore
### Catálogo inicial do SLASHER 7.1.2 | O Rei Oculto

> **Uso na mesa:** este arquivo contém pistas narrativas e sugestões de monstros. O catálogo visual fica no dock **Catálogo de Dunmoore**, exclusivo do mestre. Os monstros **não aparecem automaticamente** para os jogadores. O mestre decide quando invocá-los.

## Origem e limites da adaptação

A referência narrativa disponível para este catálogo é a edição ampliada da história que ainda trazia o título **O Messias Afogado**, posteriormente renomeada no projeto para **O Rei Oculto**, com a cidade substituída por **Dunmoore**.

**Elementos presentes no texto:** galeria da North Ridge, marcas de unhas na parede, uma figura muito magra na mina que recua ante um flash, três batidas, vozes familiares e interferência de rádio, papel de parede deformado por um rosto, desaparecimentos, imagens e nomes apagados, a passarela da mina, cerimônia com pessoas envolvidas no acordo e uma figura coroada que emerge da água negra.

**Adaptação de jogo:** os nomes dos oponentes abaixo (exceto a renomeação acordada de Rei Oculto), seus PV, defesas, danos, ações e recompensas são **propostas de SLASHER**, não informações estabelecidas pela prosa. Armas, estoques e preços são igualmente ferramentas de balanceamento, não uma lista de compras canônica da novelização.

## Criaturas prontas

| Modelo de RPG | HP | Defesa | Dano | Origem / intenção |
|---|---:|---:|---|---|
| Escavado da Mina | 18 | 12 | 1d8 | Silhueta da North Ridge, sensível ao flash |
| Vigia das Três Batidas | 16 | 13 | 1d6 | Presença anunciada pelo som |
| Eco sem Nome | 12 | 14 | 1d4 | Imitador de voz; a estática denuncia sua presença |
| Rosto sob o Papel | 12 | 15 | 1d4 | Manifestação nas paredes; fugir é melhor que lutar |
| Segurança da Passarela | 19 | 12 | 1d6 | Oponente humano da operação clandestina |
| Operário Marcado | 17 | 11 | 1d8 | Adaptação a partir das vítimas dos registros da mina |
| O Rei Oculto | 300 | 20 | 1d12 | Figura coroada da água; **não trate o HP como caminho normal de vitória** |

Os sinais e fraquezas do catálogo devem funcionar como convites à investigação, não como obrigação de matar criaturas. Para o Rei Oculto, o número de HP é apenas um marcador para não travar o protótipo de combate. A resolução da história deve depender de nomes, testemunhos, acordos e decisões dos sobreviventes.

## Armas

| Modelo | Dano | Preço (créditos) |
|---|---|---:|
| Canivete dobrável | 1d4 | 12 |
| Faca de caça | 1d6 | 28 |
| Barra de ferro | 1d8 | 22 |
| Martelo de oficina | 1d6 | 20 |
| Chave inglesa pesada | 1d6 | 18 |
| Cabo de picareta | 1d8 | 14 |
| Picareta de mineração | 1d10 | 42 |
| Bastão de madeira | 1d6 | 9 |
| Tesoura escolar | 1d4 | 5 |

As armas são equipamentos comuns ou improvisados, apropriados para personagens humanos. O dano não determina automaticamente acerto: o sistema ainda usa ataque D20 contra defesa.

## Itens de sobrevivência e investigação

| Item | Preço | Uso sugerido |
|---|---:|---|
| Lanterna portátil | 15 | Explorar túneis |
| Pilhas sobressalentes | 6 | Alimentar equipamentos |
| Câmera descartável com flash | 22 | Distrair a criatura da galeria |
| Rádio portátil | 28 | Gerar estática contra imitações |
| Gravador portátil de fita | 35 | Registrar vozes e anomalias |
| Fita cassete virgem | 8 | Recolher testemunhos |
| Corda de manutenção (15 m) | 14 | Escalada e acesso a galerias |
| Kit básico de ferramentas | 35 | Abrir painéis e improvisar soluções |
| Kit de primeiros socorros | 25 | Estabilizar ferimentos com tempo e recursos |
| Mapa anotado da North Ridge | 0 | Pista / recompensa narrativa |
| Fotografia antiga | 0 | Evidência de pessoas esquecidas |
| Fio vermelho de marcação | 2 | Marcar rotas e conexões |
| Sacos plásticos para arquivos | 4 | Proteger documentos da umidade |
| Máscara antipó descartável | 5 | Proteção limitada contra poeira |

Os itens de evidência com preço zero não são adicionados automaticamente à loja pelo botão de estoque inicial: o mestre pode oferecê-los separadamente como pistas ou recompensas.

## Como usar no SLASHER

1. Entre numa campanha como **mestre**, vá a **Mesa Atual** e abra o dock **Catálogo de Dunmoore**.
2. Em *Criaturas preparadas*, clique em **Invocar**. O monstro fica salvo na campanha e pode participar do combate. A invocação não inicia o confronto.
3. Em *Armas e itens preparados*, selecione um sobrevivente como personagem em foco e clique em **+ Inventário** para entregar o equipamento.
4. Clique em **+ Loja** para cadastrar individualmente ou **Abastecer loja com kit inicial** para inserir modelos selecionados sem duplicar os já cadastrados. A loja **permanece fechada** até o mestre clicar em **Abrir loja**.
5. Para criar criaturas próprias, o formulário **Criar monstro** do painel do mestre foi corrigido e continua disponível.

### Restrições atuais

- O catálogo é predefinido no código, não um editor completo de bestiário. O mestre ainda pode cadastrar monstros personalizados no formulário já existente.
- Inventário e loja usam as funções e permissões SQL da migração **`migrate_7_1.sql`**, previamente instalada na 7.1. **Este patch 7.1.2 não requer SQL novo.**
- As descrições de criaturas e dicas estão no catálogo do frontend, não em tabelas de lore protegidas; portanto não devem ser tratadas como segredos inacessíveis a quem examina o código-fonte público.
- A versão multiplayer depende das funções existentes do Supabase. O modo demonstração permite experimentar tudo em uma única sessão sem servidor.