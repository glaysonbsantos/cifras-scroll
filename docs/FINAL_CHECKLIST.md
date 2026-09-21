# Checklist final do MVP instalável

Use esta checklist com o pacote de produção em `.output/chrome-mv3`. Nenhum item que envolva pessoa ou câmera deve ser marcado sem observação real.

## Verificação técnica — 2026-09-21

- [x] `pnpm check`: 42 testes, verificação TypeScript e build WXT aprovados.
- [x] Manifest V3 gerado com Chrome 116 mínimo.
- [x] Permissões limitadas a `activeTab`, `scripting`, `storage` e `offscreen`, sem acesso permanente a hosts.
- [x] Comando `stop-session` incluído com atalhos sugeridos para Windows/Linux e macOS.
- [x] Modelo e WASM presentes no pacote local; CSP sem origem remota em `connect-src`.
- [x] Estados do selo global cobertos por testes: `ON`, `PAUS`, `!` e desligado.
- [x] Mensagens de câmera e página protegida cobertas por testes sem expor erros internos ao usuário.

Esta verificação não ligou a câmera e não substitui a rodada manual abaixo.

## Instalação por outra pessoa

- [ ] Seguiu `docs/INSTALLATION.md` sem orientação adicional.
- [ ] Identificou e selecionou corretamente `.output/chrome-mv3`.
- [ ] Entendeu por que a câmera é solicitada e confirmou que nenhum áudio foi pedido.
- [ ] Encontrou o botão de ativação, o indicador da sessão e as duas formas de parada.

## Uso em páginas reais

Executar no mínimo em uma página longa de leitura e em uma página de cifra:

- [ ] Ativação em página `http` ou `https` inicia a calibração.
- [ ] Calibração conclui em postura confortável.
- [ ] Selo `ON` permanece visível com o popup fechado.
- [ ] Movimentos para cima e para baixo produzem scroll na direção correta.
- [ ] Retorno ao neutro interrompe o scroll.
- [ ] Perda da face mostra `PAUS`, neutraliza o scroll e mantém indicação clara de câmera ligada.
- [ ] **Retomar** volta ao controle somente após ação explícita.
- [ ] **Parar agora** interrompe o scroll, fecha a sessão, remove o selo e libera a câmera.
- [ ] O atalho configurado faz a mesma parada com o popup fechado.
- [ ] Ativação em `chrome://extensions` mostra orientação acionável sem ligar a câmera.
- [ ] Troca de aba, recarga e navegação encerram a sessão sem deixar scroll ou câmera ativos.

## Registro da rodada

| Campo | Resultado |
|---|---|
| Data e pessoa testadora | Pendente |
| Chrome e sistema operacional | Pendente |
| Hardware e câmera | Pendente |
| Página longa | Pendente |
| Página de cifra | Pendente |
| Instalação sem ajuda | Pendente |
| Calibração e scroll | Pendente |
| Indicador com popup fechado | Pendente |
| Parada pelo popup | Pendente |
| Parada pelo atalho | Pendente |
| Liberação da câmera | Pendente |
| Problemas e limitações observados | Pendente |
| Decisão de aprovação | Pendente |

Depois da rodada, copie os resultados agregados relevantes para `docs/TEST_PROTOCOL.md`. Não registre frames, imagens, áudio nem dados identificáveis derivados da câmera.

