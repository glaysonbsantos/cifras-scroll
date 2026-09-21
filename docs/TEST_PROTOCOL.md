# Protocolo de testes do MVP

Última atualização: 2026-09-21

## Objetivo

Avaliar se sinais derivados da câmera permitem distinguir movimentos intencionais de scroll dos movimentos naturais de uma pessoa cantando e tocando violão.

O protocolo deve ser usado primeiro na POC web e repetido após a integração com a extensão.

## Regras de privacidade do experimento

- Não gravar nem salvar vídeo, imagens ou frames.
- Não capturar áudio.
- Não usar serviços remotos para inferência ou telemetria.
- Manter gráficos e amostras numéricas apenas em memória durante a sessão.
- Não exportar amostras derivadas sem uma decisão explícita posterior.
- Resultados documentados devem conter métricas agregadas e observações, nunca imagens da câmera.

## Hipóteses

- H1: pitch relativo ao neutro é suficiente para identificar intenção vertical.
- H2: cantar não altera a estimativa a ponto de causar scroll frequente.
- H3: dead zone, histerese e dwell controlam movimentos involuntários.
- H4: 15 a 20 inferências por segundo são suficientes para uma resposta fluida.
- H5: calibração de aproximadamente 2 segundos é estável e aceitável.
- H6: velocidade proporcional à inclinação é mais confortável que velocidade binária.
- H7: perda de face pode interromper o movimento sem atraso perceptível.

## Dados observáveis

Durante desenvolvimento, a POC deve tornar visíveis:

- pitch bruto e filtrado;
- yaw e roll para diagnóstico;
- confiança/presença da face;
- baseline de calibração;
- limites de entrada e saída da zona neutra;
- estado atual: `UP`, `DOWN` ou `NEUTRAL`;
- intensidade normalizada;
- inferências por segundo;
- latência aproximada de inferência;
- quantidade de mudanças de estado;
- perda e recuperação da face.

Nenhum desses dados deve exigir persistência.

## Registro do ambiente

Para cada rodada, anotar:

| Campo | Valor |
|---|---|
| Data | |
| Pessoa testadora | |
| Sistema operacional | |
| Versão do Chrome | |
| CPU/dispositivo | |
| Câmera | |
| Resolução solicitada/obtida | |
| Iluminação | clara / média / baixa |
| Distância aproximada | |
| Posição da câmera | abaixo / olhos / acima |
| Uso de óculos | sim / não |
| Parâmetros da versão | |

## Procedimento inicial

1. Abrir a POC local sem outras aplicações usando a câmera.
2. Conceder acesso somente ao vídeo.
3. Verificar que nenhum áudio foi solicitado.
4. Permanecer em postura confortável e calibrar.
5. Confirmar que a calibração rejeita amostras instáveis ou sem face.
6. Executar cada cenário abaixo.
7. Registrar métricas agregadas e observações.
8. Encerrar a sessão e confirmar que a câmera foi liberada.

## Cenários obrigatórios

### S1 — Neutro silencioso

- Duração: 2 minutos.
- Ação: olhar naturalmente para a tela sem comandar scroll.
- Observar: ruído do pitch, mudanças indevidas de estado e deriva.

### S2 — Canto sem violão

- Duração: 5 minutos.
- Ação: cantar mantendo leitura normal da tela, sem gestos intencionais.
- Observar: impacto de boca, mandíbula e expressões faciais.

### S3 — Violão sem canto

- Duração: 5 minutos.
- Ação: tocar e alternar o olhar entre instrumento e tela.
- Observar: movimentos causados por postura e inspeção do braço do instrumento.

### S4 — Canto e violão

- Duração: 5 minutos.
- Ação: simular o caso profissional real sem comandos intencionais.
- Observar: ativações involuntárias e conforto da zona neutra.

### S5 — Comandos intencionais

- Repetições: pelo menos 20 para cima e 20 para baixo.
- Ação: partir do neutro, comandar, manter por alguns segundos e retornar.
- Observar: sucesso, direção incorreta, latência, overshoot e esforço.

### S6 — Variação de intensidade

- Repetições: 10 sequências.
- Ação: alternar inclinações pequenas e maiores.
- Observar: controle da velocidade e previsibilidade.

### S7 — Perda de face

- Repetições: 10.
- Ação: sair do enquadramento durante scroll e retornar.
- Observar: tempo de parada e ausência de retomada inesperada.

### S8 — Recalibração

- Repetições: pelo menos 5 posições diferentes.
- Ação: alterar cadeira, distância ou ângulo da câmera e recalibrar.
- Observar: tempo, rejeições e nova zona neutra.

### S9 — Condições adversas

- Variações: iluminação média/baixa, óculos quando aplicável e câmera fora da altura dos olhos.
- Observar: confiança, FPS, falsos positivos e mensagens de falha.

### S10 — Sessão contínua

- Duração: 20 minutos.
- Ação: uso misto representativo, incluindo períodos neutros e comandos.
- Observar: deriva, aquecimento, uso de recursos e perda da câmera.

## Métricas

| Métrica | Como medir |
|---|---|
| Taxa de acerto | comandos reconhecidos corretamente / comandos tentados |
| Falso positivo | início de scroll sem intenção declarada |
| Direção incorreta | comando reconhecido no sentido oposto |
| Latência de início | gesto intencional até mudança para `UP`/`DOWN` |
| Latência de parada | retorno ao neutro ou perda de face até `NEUTRAL` |
| Oscilação | alternâncias rápidas e não intencionais de estado |
| FPS de inferência | inferências concluídas por segundo |
| Latência de inferência | duração de cada chamada ao modelo, com p50 e p95 |
| Deriva | deslocamento do sinal neutro durante uma sessão |
| Conforto | avaliação subjetiva de 1 a 5 após cada cenário |

## Critérios provisórios de sucesso

- calibração em até 5 segundos;
- pelo menos 90% dos comandos intencionais na direção correta;
- pelo menos 15 inferências por segundo no equipamento de referência;
- resposta ao gesto em até aproximadamente 200 ms;
- parada em até 250 ms após neutro ou perda da face;
- no máximo um falso positivo em cinco minutos no cenário S4;
- conforto de pelo menos 4 em 5;
- conclusão do cenário S10 sem falha irrecuperável;
- liberação da câmera após desativação;
- nenhuma requisição de rede do pipeline durante a sessão.

Falhar em um critério não encerra automaticamente o projeto. A falha deve indicar qual hipótese ou parâmetro precisa ser revisto.

## Modelo de resultado

### Rodada YYYY-MM-DD-N

- Versão/commit:
- Ambiente:
- Parâmetros:
- Cenários executados:
- Métricas principais:
- Observações:
- Problemas encontrados:
- Hipóteses confirmadas/refutadas:
- Ajustes propostos:
- Decisão de continuidade:

## Gatilhos de revisão técnica

- Comparar outra abordagem de pose se o pitch não permanecer estável durante canto.
- Avaliar Web Worker se a inferência bloquear a UI ou não atingir a meta de latência.
- Reduzir resolução/FPS se CPU ou temperatura comprometerem uma sessão real.
- Avaliar correção lenta do baseline somente se houver deriva reproduzível.
- Avaliar containers de scroll internos somente após o scroll principal estar validado.

## Validações anteriores à primeira rodada

### Validação técnica 2026-09-07-1

- Versão/commit: `e727120` na branch `codex/fase-1-poc-web`.
- Escopo: núcleo puro, build e inspeção visual da POC sem conceder acesso à câmera.
- Verificações executadas: `pnpm check`; 8 testes aprovados para extração de pose, calibração e interpretação; build de produção aprovado.
- Privacidade verificada por inspeção: `getUserMedia` é chamado somente após ação explícita, com `audio: false`; tracks são interrompidas ao parar, em erro e ao desmontar a interface; URLs do modelo e do WASM são locais.
- Inspeção de interface: estado inicial com câmera desligada, calibração indisponível, intenção neutra, métricas vazias e área longa de leitura; nenhum erro de console observado.
- Limite desta validação: câmera, acurácia dos ângulos, FPS, latência, calibração real, canto e violão não foram testados. Esta validação não conta como uma rodada do protocolo e não confirma H1–H7.
- Próxima ação: executar a primeira rodada física, começando pelo registro do ambiente e pelos cenários S1, S2, S3, S4 e S5.

### Encerramento da Fase 1 — 2026-09-20

- Escopo: decisão de continuidade informada pelo responsável do projeto.
- Decisão: considerar a Fase 1 encerrada e autorizar a implementação da Fase 2.
- Evidência disponível: a confirmação do responsável; nenhuma métrica agregada ou observação da rodada física foi fornecida para inclusão neste protocolo.
- Limite: este registro não confirma H1–H7 nem substitui os resultados experimentais. Nenhum valor de acerto, latência, falso positivo, conforto ou desempenho foi inferido.

## Validações da Fase 2

### Validação técnica 2026-09-20-1

- Escopo: estabilização do interpretador, adaptador de scroll baseado em tempo, build e inspeção visual sem conceder acesso à câmera.
- Verificações automatizadas: `pnpm check`; 15 testes aprovados para extração de pose, calibração, suavização temporal, dwell, histerese, intensidade, parada segura e deslocamento proporcional ao tempo; build de produção aprovado.
- Inspeção de interface: estados iniciais, controles de ativação, sensibilidade e velocidade, limites de entrada/saída e layout em larguras desktop e móvel; nenhum erro de console observado.
- Privacidade verificada por inspeção: não houve mudança no fluxo local de câmera, nenhuma captura de áudio foi adicionada e o scroll recebe somente `ScrollIntent`, sem imagens.
- Limite desta validação: câmera, comportamento corporal, latências de início/parada, falsos positivos, conforto, deriva e sessão contínua não foram testados.
- Próxima ação: executar S1–S10, com ênfase na sessão contínua de 15 a 20 minutos, e registrar métricas agregadas antes de encerrar a Fase 2.

### Validação técnica 2026-09-20-2

- Problema observado: ao iniciar um gesto depois de ativar o scroll, a sessão podia ser interrompida e liberar a câmera. O console anexado também mostrava um 404 de `favicon.ico` e mensagens do MediaPipe/XNNPACK/WebGL.
- Causa do encerramento: o adaptador armazenava `requestAnimationFrame` e `cancelAnimationFrame` sem preservar o receptor `window`. O navegador podia lançar `Illegal invocation` no primeiro gesto; a exceção atravessava `onFrame` e o pipeline a tratava como falha de processamento, interrompendo as tracks por segurança.
- Correção: as APIs de animação agora são chamadas através de `window`; uma barreira no callback da aplicação pausa somente o scroll caso o adaptador falhe, mantendo a câmera ativa; um favicon embutido remove o 404.
- Verificações automatizadas: `pnpm check`; 16 testes aprovados, incluindo regressão que exige o receptor nativo correto para solicitar e cancelar quadros; build de produção aprovado.
- Inspeção de interface: carregamento local sem erros ou avisos da aplicação antes de ativar a câmera.
- Mensagens não causais do anexo: seleção automática de XNNPACK, inicialização WebGL, desativação da checagem de erros OpenGL e desativação de feedback tensors são diagnósticos internos do MediaPipe; o próprio log confirma que o grafo iniciou com sucesso.
- Limite desta validação: a câmera real não foi ativada nesta correção e a sessão contínua ainda precisa ser repetida no equipamento de referência.

### Encerramento das Fases 1 e 2 — 2026-09-20

- Decisão: o responsável do projeto confirmou que as duas primeiras fases estão aprovadas para o escopo do MVP.
- Consequência: a POC e a estabilização do scroll estão aceitas; o repositório pode consolidar essas fases na branch principal.
- Evidência disponível: confirmação explícita do responsável, além das validações automatizadas já registradas.
- Limite: métricas agregadas da sessão física contínua não foram fornecidas para inclusão neste protocolo; este registro não inventa resultados quantitativos.
- Próxima ação: aguardar autorização explícita para iniciar a Fase 3.

## Validações da Fase 3

### Validação técnica 2026-09-20-1

- Versão/commit: `8437992` na branch `codex/fase-3-extensao-chrome`.
- Escopo: estrutura WXT + Vue em Manifest V3, ciclo de vida offscreen, mensageria, persistência de preferências, build e inspeção visual do onboarding sem câmera.
- Verificações automatizadas: `pnpm check`; 22 testes aprovados, incluindo criação única sob concorrência, reutilização e fechamento do documento offscreen; verificação TypeScript e build WXT aprovados.
- Manifest inspecionado: `activeTab`, `scripting`, `storage` e `offscreen`; Chrome 116 mínimo; nenhuma permissão permanente de host; CSP permite WASM local e mantém scripts restritos ao pacote.
- Privacidade verificada por inspeção: câmera solicitada com `audio: false`; modelo, JavaScript e WASM do MediaPipe permanecem locais; mensagens entre contextos contêm estado, configurações, pose interpretada ou intenção, nunca frames; somente sensibilidade e velocidade são gravadas em `chrome.storage.local`.
- Interface inspecionada: onboarding em viewport estreito, com correção da rolagem horizontal observada na primeira inspeção; câmera não ativada e nenhuma permissão concedida durante a validação.
- Limite desta validação: não houve instalação da extensão, concessão de câmera nem teste físico. Não confirma o controle de uma página real, a continuidade após fechar o popup ou a liberação efetiva da câmera ao parar.
- Próxima ação: carregar a build no Chrome, autorizar somente vídeo e confirmar o critério de aceite da Fase 3 antes do merge na `main`.

### Validação técnica 2026-09-20-2

- Versão/commit: `fa8f239` na branch `codex/fase-3-extensao-chrome`.
- Ambiente observado: extensão unpacked em Chrome, página de cifra do Cifra Club e câmera autorizada.
- Problema observado: a sessão permanecia indefinidamente em `Calibrando` e a barra de progresso não avançava.
- Causa: o pipeline herdado da POC solicitava inferências por `requestAnimationFrame`. No documento offscreen oculto, a atualização visual não é uma fonte confiável de frames e nenhum callback chegava ao calibrador.
- Correção: a extensão passou a consumir `VideoFrame` diretamente da faixa da câmera com `MediaStreamTrackProcessor`, mantendo no máximo um frame em espera e fechando cada frame após a inferência. O pipeline não depende mais de pintura ou visibilidade do documento.
- Verificações automatizadas: `pnpm check`; 24 testes aprovados, incluindo consumo de frame sem `requestAnimationFrame`, descarte do frame, interrupção das tracks em erro, verificação TypeScript e build WXT.
- Limite desta validação: a correção ainda precisa ser recarregada no Chrome e repetida pelo responsável para confirmar calibração, scroll e encerramento real da câmera.

### Encerramento da Fase 3 — 2026-09-21

- Decisão: o responsável do projeto aprovou explicitamente a Fase 3 após a validação manual e consolidou as alterações na `main`.
- Evidência disponível: confirmação explícita do responsável; a `main` e a referência remota estavam alinhadas na revisão que contém a implementação e a correção do pipeline offscreen.
- Limite: não foram fornecidas métricas agregadas nem observações detalhadas da rodada manual posterior à correção. Este registro não presume resultados de calibração, scroll ou encerramento da câmera além da aprovação declarada.
- Próxima ação: a Fase 4 está autorizada.

## Validações da Fase 4

### Validação técnica 2026-09-21-1

- Escopo: tratamento seguro de falhas de câmera, ciclo de vida de aba e service worker, instrumentação local de desempenho e auditoria estática de privacidade.
- Verificações automatizadas: `pnpm check`; 39 testes aprovados, verificação TypeScript e build WXT aprovados.
- Falhas cobertas: permissão negada/revogada, câmera ausente, ocupada, incompatível ou desconectada; fim inesperado do leitor de frames; página protegida ou não responsiva; fechamento, recarga, navegação, troca de aba/janela; e recuperação após reinício do service worker somente quando aba, documento offscreen e content script continuam válidos.
- Encerramento de mídia: os testes confirmam cancelamento do leitor, remoção do observador de desconexão e chamada de `stop()` em todas as tracks do stream nos caminhos de parada, falha de inferência e desconexão.
- Auditoria do pacote: o manifest gerado declara somente `activeTab`, `scripting`, `storage` e `offscreen`, sem `host_permissions`. A CSP restringe `connect-src` a `'self'`. O código da aplicação não contém cliente de rede ou telemetria; os mecanismos `fetch`/XHR presentes no runtime empacotado do MediaPipe carregam os caminhos locais de WASM e modelo fornecidos pela extensão.
- Instrumentação: o popup mostra FPS, latência p50/p95, percentual do tempo da janela consumido pela inferência, heap JavaScript quando exposto pelo Chrome, resolução e FPS configurado da câmera. Os dados permanecem somente em memória.
- Limite desta validação: não houve câmera real, revogação de permissão no Chrome, suspensão forçada do service worker nem medição pelo gerenciador de tarefas. Carga da inferência não equivale ao uso total de CPU do processo. Esta validação não marca CPU, memória ou compatibilidade entre hardwares como medidas.
- Próxima ação: executar a matriz manual abaixo em pelo menos duas configurações e anexar somente métricas agregadas.

### Validação funcional 2026-09-21-2

- Versão/commit: branch `codex/fase-4-robustez`, incluindo a correção do popup validada antes da consolidação.
- Ambiente: macOS e Google Chrome; versão exata do Chrome, CPU e modelo da câmera não foram coletados.
- Pacote: build de produção `.output/chrome-mv3`, carregada como extensão descompactada; não houve dependência do servidor WXT.
- Página protegida: tentativa de ativação em `chrome://extensions` produziu estado `Interrompido` e a mensagem esperada, sem iniciar a câmera. A duplicação visual da mensagem encontrada na primeira inspeção foi corrigida e revalidada.
- Página comum: sessão iniciada no Cifra Club, calibração concluída e perda da face tratada com pausa e intenção neutra.
- Métricas observadas em uma amostra curta: 30,0 inferências/s; latência p50 de 16,0 ms; latência p95 de 18,4 ms; carga relativa da inferência de 49%; heap JavaScript de 9,6 MB; câmera configurada em 640×480 a 30 FPS.
- Encerramento: o comando `Parar` retornou ao estado desligado com confirmação de liberação; em nova ativação, trocar de aba encerrou a sessão automaticamente com mensagem específica.
- Privacidade observada: a interface não exibiu frames, não solicitou áudio e continuou declarando processamento local. Esta rodada não inspecionou tráfego no painel Network.
- Limites: a amostra não representa uma sessão contínua, não mede CPU total pelo gerenciador de tarefas e não substitui teste em segundo hardware. Permissão revogada, câmera ocupada/desconectada e suspensão forçada do service worker permanecem cobertas por implementação/testes automatizados, não por esta rodada física.
- Decisão: o responsável do projeto solicitou validar a Fase 4, consolidá-la na `main` e publicá-la. A fase é aceita para continuidade com a dívida explícita de CPU total e segundo hardware; nenhum resultado ausente foi inferido.
- Próxima ação: iniciar a Fase 5 somente em task própria, preservando os acompanhamentos abaixo como validação complementar.

### Acompanhamentos pós-aceite da Fase 4

Para cada hardware, executar uma sessão ativa e registrar:

1. CPU média e pico e memória média e pico pelo gerenciador de tarefas do Chrome durante cinco minutos em neutro e cinco minutos com comandos.
2. FPS, latência p50/p95 e carga relativa mostrados no popup ao final de cada intervalo.
3. Revogação da permissão durante a sessão; confirmar scroll neutro, mensagem acionável e indicador físico da câmera apagado.
4. Câmera ocupada antes de ativar e desconectada durante a sessão; confirmar encerramento seguro nos dois casos.
5. Recarga, navegação, troca/fechamento de aba e troca de janela; confirmar que nenhuma página continua rolando e que a câmera é liberada.
6. Reinício do service worker em `chrome://extensions`; confirmar retomada somente na mesma aba ainda válida ou encerramento seguro.
7. Tentativa de ativação em `chrome://extensions` e Chrome Web Store; confirmar mensagem de página protegida.
8. Painel Network do documento offscreen durante a sessão; confirmar somente recursos `chrome-extension://` e nenhuma origem remota.

Registrar cada configuração usando o modelo de resultado deste protocolo. Não marcar CPU total ou segundo hardware como verificados antes de obter os valores reais.
