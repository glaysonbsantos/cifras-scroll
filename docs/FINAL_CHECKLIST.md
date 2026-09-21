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

- [x] Seguiu `docs/INSTALLATION.md` sem orientação adicional.
- [x] Identificou e selecionou corretamente `.output/chrome-mv3`.
- [x] Entendeu por que a câmera é solicitada e confirmou que nenhum áudio foi pedido.
- [x] Encontrou o botão de ativação, o indicador da sessão e as duas formas de parada.

## Uso em páginas reais

Executar no mínimo em uma página longa de leitura e em uma página de cifra:

- [x] Ativação em página `http` ou `https` inicia a calibração.
- [x] Calibração conclui em postura confortável.
- [x] Selo `ON` permanece visível com o popup fechado.
- [x] Movimentos para cima e para baixo produzem scroll na direção correta.
- [x] Retorno ao neutro interrompe o scroll.
- [x] Perda da face mostra `PAUS`, neutraliza o scroll e mantém indicação clara de câmera ligada.
- [x] **Retomar** volta ao controle somente após ação explícita.
- [x] **Parar agora** interrompe o scroll, fecha a sessão, remove o selo e libera a câmera.
- [x] O atalho configurado faz a mesma parada com o popup fechado.
- [x] Ativação em `chrome://extensions` mostra orientação acionável sem ligar a câmera.
- [x] Troca de aba, recarga e navegação encerram a sessão sem deixar scroll ou câmera ativos.

## Registro da rodada

| Campo | Resultado |
|---|---|
| Data e pessoa testadora | 2026-09-21 · responsável do projeto |
| Chrome e sistema operacional | Chrome; versões não informadas |
| Hardware e câmera | Não informados |
| Página longa | Aprovada; endereço não informado |
| Página de cifra | Aprovada; endereço não informado |
| Instalação sem ajuda | Aprovada |
| Calibração e scroll | Aprovados |
| Indicador com popup fechado | Aprovado |
| Parada pelo popup | Aprovada |
| Parada pelo atalho | Aprovada |
| Liberação da câmera | Aprovada |
| Problemas e limitações observados | Nenhum bug identificado |
| Decisão de aprovação | Fase 5 aprovada e autorizada para merge |

Depois da rodada, copie os resultados agregados relevantes para `docs/TEST_PROTOCOL.md`. Não registre frames, imagens, áudio nem dados identificáveis derivados da câmera.
