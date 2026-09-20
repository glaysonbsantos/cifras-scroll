# Registro de decisões

Última atualização: 2026-09-20

Este documento registra decisões que afetam arquitetura, escopo, dependências, privacidade ou permissões. Uma decisão pode ser substituída, mas não deve ser apagada; registre a decisão nova e indique a anterior.

## D-001 — Usar MediaPipe Face Landmarker diretamente

- Status: aceita
- Data: 2026-09-07
- Decisão: iniciar com `@mediapipe/tasks-vision`, sem TensorFlow.js.
- Motivo: o Face Landmarker já fornece landmarks 3D e matriz de transformação facial apropriados ao experimento, evitando um runtime adicional sem benefício demonstrado.
- Consequência: modelo e WASM devem ser tratados como assets locais e o comportamento síncrono da inferência deve ser medido.
- Revisar se: benchmarks reais mostrarem problemas de precisão, desempenho ou compatibilidade.
- Referência: <https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js>

## D-002 — Validar primeiro em uma POC web

- Status: aceita
- Data: 2026-09-07
- Decisão: implementar câmera, pose, calibração, interpretação e scroll em uma POC web antes da extensão.
- Motivo: separar riscos de visão/ergonomia dos riscos de ciclo de vida e permissões do Chrome.
- Consequência: a POC será um laboratório instrumentado, não uma PWA ou produto paralelo.
- Revisar se: não aplicável antes da conclusão da primeira rodada experimental.

## D-003 — Separar núcleo compartilhado de adaptadores

- Status: aceita
- Data: 2026-09-07
- Decisão: manter pose, calibração e interpretação fora das APIs específicas da extensão.
- Motivo: permitir que POC e extensão usem a mesma lógica e preservar reutilização futura sem generalização excessiva.
- Consequência: o limite principal será um `HeadPoseSample` de entrada e um `ScrollIntent` de saída.
- Revisar se: o empacotamento demonstrar custo desproporcional para a POC.

## D-004 — Usar offscreen document para câmera na extensão

- Status: aceita, sujeita a spike de ciclo de vida
- Data: 2026-09-07
- Decisão: câmera e inferência devem residir em um documento offscreen; popup não será dono da sessão e service worker não processará vídeo.
- Motivo: o popup fecha ao perder foco e o service worker MV3 não possui DOM; a Offscreen API oferece um documento oculto com suporte ao motivo `USER_MEDIA`.
- Consequência: a extensão terá mensageria entre popup, service worker, offscreen document e content script.
- Revisar se: o fluxo de primeira permissão, a persistência da câmera ou o desempenho não forem confiáveis na versão mínima do Chrome.
- Referência: <https://developer.chrome.com/docs/extensions/reference/api/offscreen>

## D-005 — Minimizar acesso a páginas com activeTab

- Status: aceita
- Data: 2026-09-07
- Decisão: preferir `activeTab` + `scripting` em vez de `<all_urls>` no MVP.
- Motivo: o acesso à página deve ocorrer apenas após gesto explícito do usuário e permanecer limitado à aba da sessão.
- Consequência: navegação para outro domínio exige nova ativação; páginas protegidas pelo navegador não serão suportadas.
- Revisar se: testes mostrarem que o modelo de sessão precisa sobreviver a navegações incompatíveis com `activeTab`.
- Referência: <https://developer.chrome.com/docs/extensions/develop/concepts/activeTab>

## D-006 — Manter o pipeline integralmente local

- Status: aceita e obrigatória
- Data: 2026-09-07
- Decisão: não enviar, persistir ou gravar frames e não capturar áudio.
- Motivo: privacidade é um requisito arquitetural do MVP.
- Consequência: código, WASM e modelo usados pela extensão serão empacotados; não haverá telemetria remota.
- Revisar se: somente por decisão explícita de produto futura, fora do escopo deste MVP.
- Referência: <https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3>

## D-007 — Calibrar posição neutra por sessão

- Status: aceita
- Data: 2026-09-07
- Decisão: não persistir o baseline de pose entre sessões.
- Motivo: câmera, cadeira, postura, distância e enquadramento variam; um valor antigo pode causar movimentos involuntários.
- Consequência: ativação exige calibração curta e deve oferecer recalibração fácil.
- Revisar se: testes demonstrarem que uma retomada segura pode reutilizar o baseline no mesmo contexto físico.

## D-008 — Limitar o MVP a uma aba por sessão

- Status: aceita
- Data: 2026-09-07
- Decisão: uma sessão controla apenas a aba em que foi ativada.
- Motivo: evita scroll inesperado e reduz complexidade de permissões e roteamento.
- Consequência: troca de aba, fechamento ou navegação incompatível devem pausar ou encerrar a sessão de forma segura.
- Revisar se: a experiência validada indicar necessidade clara de continuidade entre abas.

## D-009 — Usar Vite, Vue 3 e pnpm na POC

- Status: aceita
- Data: 2026-09-07
- Decisão: estruturar a POC como aplicação Vue 3 + TypeScript construída com Vite e gerenciada por pnpm.
- Motivo: Vue já era a escolha aprovada para interfaces; Vite fornece uma base local mínima e o lockfile do pnpm torna a instalação reproduzível.
- Consequência: os comandos oficiais passam a ser `pnpm dev`, `pnpm test`, `pnpm build` e `pnpm check`; TypeScript permanece em 5.9.x enquanto o verificador do Vue não for compatível com TypeScript 7.
- Revisar se: a etapa de extensão exigir uma organização de workspace diferente ou o WXT impuser outra integração.

## D-010 — Empacotar os assets do Face Landmarker na POC

- Status: aceita
- Data: 2026-09-07
- Decisão: servir JavaScript/WASM do `@mediapipe/tasks-vision` 1.0.1 e o modelo `face_landmarker.task` a partir de `public/mediapipe`, sem CDN em runtime.
- Motivo: garantir inferência local, permitir auditoria de rede e antecipar a restrição de código remoto do Manifest V3.
- Consequência: o repositório inclui aproximadamente 26 MB de assets; o SHA-256 do modelo é `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
- Revisar se: a etapa WXT fornecer um pipeline confiável de cópia e verificação desses assets ou se o tamanho puder ser reduzido sem perder compatibilidade.
- Referência: <https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js>

## D-011 — Medir a inferência síncrona na thread principal antes de adicionar Worker

- Status: aceita para a Fase 1
- Data: 2026-09-07
- Decisão: executar `detectForVideo` com delegate CPU na thread principal e medir FPS e latências atual, p50 e p95.
- Motivo: a Fase 1 deve obter um baseline simples antes de introduzir concorrência; a própria documentação informa que a chamada é síncrona e pode bloquear a interface.
- Consequência: travamento da UI ou falha nas metas de desempenho aciona a avaliação de Web Worker já prevista no protocolo.
- Revisar se: a primeira rodada não atingir 15 inferências por segundo ou apresentar latência/interação inadequadas.
- Referência: <https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js>

## D-012 — Tratar detecção de face como proxy binária de confiança

- Status: aceita provisoriamente
- Data: 2026-09-07
- Decisão: expor `100%` quando o Face Landmarker retornar face e matriz de transformação e `0%` quando não retornar, nomeando o dado como “presença (proxy)”.
- Motivo: a API Web permite configurar limites mínimos de detecção, presença e tracking, mas o resultado público do Face Landmarker não expõe esses escores por face.
- Consequência: a POC não apresenta uma confiança contínua inventada; baixa confiança abaixo dos limites se manifesta como perda de face e produz `NEUTRAL` imediatamente.
- Revisar se: uma API oficial passar a expor o score ou os testes exigirem outro indicador local e justificável.

## D-013 — Estabilizar o gesto antes do adaptador de scroll

- Status: aceita provisoriamente para a Fase 2
- Data: 2026-09-20
- Decisão: manter um interpretador com estado no núcleo, usando suavização exponencial temporal de 70 ms, entrada inicial em 6°, saída em 3,5°, dwell de 120 ms e intensidade proporcional até 18°. A sensibilidade escala esses limites entre 70% e 140%.
- Motivo: filtrar ruído, impedir oscilações junto ao neutro e rejeitar movimentos transitórios sem acoplar a interpretação às APIs do navegador.
- Consequência: o adaptador web recebe somente `ScrollIntent` e aplica deslocamento por tempo com `requestAnimationFrame`, velocidade máxima ajustável e intervalo limitado a 50 ms para evitar saltos após pausas da aba. Perda de face ou baixa confiança zera o interpretador, pausa o controle e exige reativação explícita.
- Revisar se: a sessão física ultrapassar as metas de latência, conforto ou falsos positivos, ou se a taxa de inferência exigir outra constante de filtragem.
