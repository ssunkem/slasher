# 🔪 SLASHER 7.1 · Roteiro de testes

**Migração necessária:** no seu Supabase já configurado para a 7.0, execute `migrate_7_1.sql` pelo SQL Editor. O arquivo preserva suas campanhas e personagens. Não rode em um banco com outro esquema sem antes revisar o SQL.

## Teste rápido (sem servidor)

Abra `SLASHER_7_1_Demo.html`, entre na demonstração e selecione a campanha. A aba **Mesa Atual** deverá abrir automaticamente.

1. Teste alterar o personagem em foco entre Eleanor Hayes, Sr. Wallace e Escavado da Mina.
2. Use `←`, `→` ou arraste uma janela. Recarregue: a disposição deve continuar igual.
3. No inventário de Eleanor, equipe o **Canivete de Caça (1d6)**.
4. Em **Combate atual**, escolha o Escavado e ataque. O registro deve mostrar atacante, alvo, acerto/erro, HP antes e depois e animação de dano quando acertar.
5. No **Painel do mestre**, crie outro monstro e configure a rodada e o turno.
6. Abra a loja, compre um produto e confirme que o estoque e o dinheiro diminuíram e o item entrou na ficha.
7. Teste o painel no celular e recolha/expanda uma janela.

## Teste multiplayer real

Após executar `migrate_7_1.sql`, atualize o site via `Ctrl + F5`.

1. Mestre: crie uma criatura, conceda uma arma a um sobrevivente e inicie o combate.
2. Jogador: entre com outra conta e o código da campanha, escolha a própria ficha na **Mesa Atual**.
3. Jogador: equipe a arma e ataque a criatura. O servidor valida dono da ficha, arma e defesa.
4. Mestre: confira a alteração de HP no seu navegador. Ataque o jogador com a criatura.
5. Jogador: verifique que o próprio HP foi reduzido e o log revela a sequência do ataque.
6. Mestre: abra a loja, cadastre um item e ajuste dinheiro. Jogador: compre e confirme que o estoque mudou para todos.
7. Tente atualizar o painel em ambos os dispositivos e confirme que os dados persistem.

### Segurança e limites atuais

- A defesa segue a regra experimental: **D20 + REF contra Defesa (criatura) ou 10 + REF (humano)**. 20 natural acerta, 1 natural erra; acerto gera dano do dado da arma/criatura, +2 em crítico. O dano é aplicado automaticamente ao alvo.
- Armas, monstros, moedas e loja ficam no Supabase e são validados por funções SQL; ações de mestre exigem papel de mestre no banco. Docks são preferências locais por usuário/dispositivo.
- A primeira versão não oferece munição, distância, resistência, turnos obrigatórios, mapa nem reversão de ataques. O mestre ainda controla o ritmo narrativo e pode alterar o HP pelo painel administrativo da 7.0.
- Dados antigos como itens de texto da 7.0 são exibidos no inventário, mas não viram armas automaticamente. Conceda uma versão com dado de dano no painel da 7.1 para permitir ataques automáticos.
- Retratos existentes dos jogadores e NPCs aparecem na nova mesa. Monstros criados pela versão inicial usam um ícone até receberem suporte de imagem específico.
- A demo usa os dados locais e **não é multiplayer**. A migração SQL e a autorização real ainda precisam ser testadas no seu projeto Supabase.