# Plano do MVP

Última atualização: 2026-09-21

## Status

- Estado geral: Fases 1, 2 e 3 aprovadas; Fase 3 consolidada na `main`
- Fase atual: implementação técnica da Fase 4 concluída; validação física pendente
- Próxima task proposta: executar a matriz manual da Fase 4 em pelo menos duas configurações de hardware
- Próxima task autorizada: validar a Fase 4 sem avançar para a Fase 5

## Objetivo

Validar se uma pessoa consegue controlar, de forma confortável e previsível, o scroll de uma página comum usando movimentos verticais da cabeça detectados pela câmera do dispositivo.

O MVP será considerado útil se permitir:

1. ativar explicitamente o controle;
2. conceder acesso à câmera;
3. calibrar uma posição neutra;
4. rolar para cima e para baixo;
5. permanecer parado em uma zona neutra;
6. ajustar sensibilidade e velocidade;
7. interromper o controle imediatamente;
8. continuar operando depois que o popup da extensão for fechado.

## Hipótese principal

Uma estimativa client-side de orientação da cabeça, combinada com calibração relativa, filtragem temporal, zona neutra e histerese, pode produzir um scroll suficientemente estável para uso durante canto e execução de violão.

O principal risco não é detectar uma face. É distinguir intenção de scroll de movimentos naturais feitos durante uma apresentação.

## Fora do escopo

- aplicativo mobile ou PWA de produto;
- backend, banco de dados ou autenticação;
- contas, pagamentos, anúncios ou sincronização;
- treinamento de modelo próprio;
- gestos personalizados;
- suporte a outros navegadores;
- integrações específicas com sites de cifras;
- reconhecimento de identidade;
- telemetria remota;
- suporte completo a todo tipo de container de scroll.

## Decisões técnicas atuais

- TypeScript como linguagem principal.
- Vue 3 para interfaces que realmente precisem de UI.
- MediaPipe Face Landmarker via `@mediapipe/tasks-vision`.
- POC web antes da extensão.
- WXT e Manifest V3 na etapa de extensão.
- processamento da câmera em documento offscreen na extensão.
- service worker apenas para coordenação e roteamento de mensagens.
- content script responsável por aplicar o scroll na página.
- preferências persistentes em `chrome.storage.local`.
- calibração neutra mantida por sessão, não como preferência permanente.
- bibliotecas, WASM e modelo empacotados localmente.

As justificativas e condições de revisão estão em [DECISIONS.md](DECISIONS.md).

## Arquitetura de referência

```text
Câmera
  -> MediaPipe Face Landmarker
  -> HeadPoseSample { pitch, yaw, roll, confidence, timestamp }
  -> calibração e filtro temporal
  -> Gesture Interpreter
  -> ScrollIntent { action: UP | DOWN | NEUTRAL, intensity }
  -> adaptador do ambiente
  -> scroll da página
```

Na extensão:

```text
Popup/onboarding
  -> service worker
  -> offscreen document: câmera + visão + interpretação
  -> service worker: roteamento para a aba da sessão
  -> content script: animação e scroll
```

## Modelo inicial de interação

- A posição neutra é obtida por uma janela curta de amostras estáveis.
- O controle utiliza pitch relativo ao baseline, não um ângulo absoluto universal.
- Uma dead zone mantém o estado `NEUTRAL`.
- Histerese separa os limites de iniciar e interromper o scroll.
- Uma permanência curta reduz ativações por movimentos transitórios.
- A intensidade da inclinação controla a velocidade até um limite configurável.
- Baixa confiança ou perda da face interrompe o scroll imediatamente.
- Sensibilidade altera limites; velocidade altera pixels por segundo.

Os valores numéricos serão ajustados com o [protocolo de testes](TEST_PROTOCOL.md).

## Fases

### Fase 0 — Planejamento experimental

Status: concluída

- [x] Definir objetivo e limites do MVP.
- [x] Escolher tecnologia inicial de visão computacional.
- [x] Definir arquitetura de referência.
- [x] Definir hipóteses, cenários e métricas de validação.
- [x] Registrar invariantes de privacidade.
- [x] Preparar documentação para continuidade entre sessões.

Critério de aceite: existe um protocolo reproduzível para avaliar o sinal antes da integração com APIs de extensão.

### Fase 1 — POC web instrumentada

Status: concluída e aprovada pelo responsável do projeto em 2026-09-20

- [x] Criar aplicação web local mínima.
- [x] Solicitar somente vídeo da câmera a partir de ação explícita.
- [x] Carregar MediaPipe, WASM e modelo localmente.
- [x] Expor pitch, presença/confiança proxy, FPS e latência para depuração.
- [x] Implementar calibração neutra.
- [x] Produzir `UP`, `DOWN` e `NEUTRAL` sem aplicar scroll inicialmente.
- [x] Adicionar área de página para teste de scroll.
- [x] Encerrar a primeira rodada do protocolo por decisão do responsável do projeto.
- [x] Autorizar a continuidade para a Fase 2.

Evidência técnica: a validação automatizada de 2026-09-07 executou 8 testes do núcleo e o build de produção. Em 2026-09-20, o responsável confirmou a aprovação da Fase 1 e autorizou a continuidade. Não foram fornecidas métricas detalhadas da rodada física para registro.

Critério de aceite: reconhecimento intencional e região neutra demonstrados durante canto e execução de violão, com desempenho suficiente no equipamento de referência.

### Fase 2 — Estabilização do controle

Status: concluída e aprovada pelo responsável do projeto em 2026-09-20

- [x] Implementar filtragem temporal.
- [x] Implementar dead zone e histerese.
- [x] Implementar dwell/debounce.
- [x] Implementar intensidade proporcional.
- [x] Aplicar scroll baseado em tempo usando `requestAnimationFrame`.
- [x] Interromper imediatamente em baixa confiança ou perda da face.
- [x] Permitir recalibração rápida.
- [x] Executar e aprovar sessão contínua de 15 a 20 minutos.

Evidência técnica: `pnpm check` executa 16 testes do núcleo e do adaptador de scroll, além do build de produção. A interface da Fase 2 foi inspecionada em larguras desktop e móvel sem ativar a câmera; os controles de sensibilidade atualizaram os limites exibidos e não houve erro no console. Um teste de regressão cobre o vínculo das APIs nativas de animação após a correção do encerramento indevido da câmera ao iniciar o scroll. Em 2026-09-20, o responsável confirmou que a Fase 2 está aprovada; as métricas detalhadas da sessão física não foram fornecidas para registro.

Critério de aceite: scroll controlável sem deriva relevante e com taxa aceitável de movimentos involuntários.

### Fase 3 — Extensão Chrome mínima

Status: concluída, aprovada e consolidada na `main`

- [x] Criar projeto WXT + Vue em Manifest V3.
- [x] Criar popup de ativação, estado e configurações.
- [x] Criar onboarding/permissão de câmera.
- [x] Criar service worker coordenador.
- [x] Validar criação e ciclo de vida do documento offscreen.
- [x] Manter câmera e inferência após fechamento do popup.
- [x] Injetar content script após gesto explícito do usuário.
- [x] Vincular cada sessão a uma única aba.
- [x] Persistir somente sensibilidade e velocidade.
- [x] Implementar ativar, recalibrar e parar.

Evidência técnica: `pnpm check` executa 24 testes, verificação TypeScript e build WXT para Chrome MV3. Os testes incluem o ciclo de criação, reutilização concorrente e fechamento do documento offscreen, além do consumo e descarte seguro de frames diretamente da faixa de vídeo. O manifest gerado usa apenas `activeTab`, `scripting`, `storage` e `offscreen`; não declara acesso permanente a hosts. O onboarding foi inspecionado visualmente em viewport estreito sem ativar a câmera.

Registro de aceite: após a correção do pipeline offscreen, o responsável do projeto aprovou explicitamente a Fase 3, consolidou-a na `main` e publicou as branches no repositório remoto. Não foram fornecidas métricas detalhadas da rodada manual para registro; este plano não infere resultados quantitativos além da aprovação declarada.

Critério de aceite: a extensão controla uma página comum, continua após o popup fechar e libera a câmera ao ser desativada.

### Fase 4 — Robustez, privacidade e desempenho

Status: implementação técnica concluída; validação física pendente

- [x] Tratar permissão negada ou revogada.
- [x] Tratar câmera ausente, ocupada ou desconectada.
- [x] Tratar recarga, navegação e troca de aba.
- [x] Tratar suspensão/reinício do service worker.
- [x] Informar páginas em que não é possível injetar scripts.
- [x] Verificar encerramento das tracks da câmera.
- [x] Auditar permissões e chamadas de rede.
- [ ] Medir CPU, memória, FPS e latência.
- [ ] Testar em mais de uma configuração de hardware.

Evidência técnica: `pnpm check` executa 39 testes, verificação TypeScript e build WXT. A suíte cobre classificação de falhas da câmera, páginas protegidas, encerramento de todas as tracks em erro ou desconexão, política mínima do manifest e decisão segura de recuperação após reinício do service worker. O manifest gerado mantém somente `activeTab`, `scripting`, `storage` e `offscreen`, sem hosts permanentes, e limita conexões das páginas da extensão aos próprios assets. O popup agora expõe FPS, latência p50/p95, carga relativa da inferência, heap JavaScript quando disponível e configuração obtida da câmera. Essas métricas ainda não constituem uma medição real de CPU/memória nem substituem a matriz física em dois hardwares.

Critério de aceite: falhas são seguras, a câmera sempre pode ser interrompida e nenhuma imagem ou frame sai do dispositivo.

### Fase 5 — MVP instalável

Status: não iniciada

- [ ] Refinar onboarding e mensagens de erro.
- [ ] Mostrar indicador inequívoco de sessão ativa.
- [ ] Disponibilizar parada de emergência por UI e atalho.
- [ ] Documentar instalação unpacked.
- [ ] Executar checklist final em páginas reais.
- [ ] Registrar limitações conhecidas.

Critério de aceite: outra pessoa consegue instalar, conceder permissão, calibrar, usar e desativar o MVP seguindo a documentação.

## Metas provisórias

Estas metas orientam a POC e devem ser revisadas com evidência:

- calibração concluída em até 5 segundos;
- pelo menos 15 inferências por segundo no equipamento de referência;
- resposta percebida ao gesto em até aproximadamente 200 ms;
- parada em até 250 ms após retorno ao neutro ou perda da face;
- no máximo uma ativação involuntária em cinco minutos no cenário principal;
- sessão contínua de 20 minutos sem perda irrecuperável da câmera;
- nenhuma requisição de rede causada pelo pipeline durante a sessão.

## Riscos prioritários

1. movimentos de boca e face durante o canto alterarem a estimativa;
2. postura mudar gradualmente durante a música;
3. dead zone pequena provocar ativações; dead zone grande exigir esforço;
4. filtragem excessiva introduzir atraso e overshoot;
5. desempenho variar entre hardware, câmera e iluminação;
6. fluxo de permissão da câmera não ser claro na extensão;
7. ciclo de vida do offscreen document e do service worker;
8. páginas com scroll interno ou injeção proibida;
9. ausência de feedback visível sobre câmera e sessão ativa.

## Acompanhamento

Ao concluir uma task:

1. marcar apenas os itens realmente verificados;
2. registrar evidências e resultados do experimento;
3. atualizar decisões que mudaram;
4. documentar limitações encontradas;
5. indicar a próxima task proposta;
6. aguardar aprovação antes de mudar de fase.
