# Política de Privacidade — Cifras Scroll

**Vigência:** 21 de setembro de 2026

O Cifras Scroll controla o scroll da aba escolhida por meio de movimentos da cabeça. A extensão foi projetada para funcionar localmente, sem backend, contas, anúncios ou telemetria.

## Dados processados

Durante uma sessão ativa, a extensão acessa o vídeo da câmera para estimar pose e presença da face. Também mantém temporariamente o identificador e o título da aba controlada, o estado da sessão e métricas agregadas de funcionamento.

- nenhum áudio é solicitado ou capturado;
- frames, imagens e vídeo não são gravados, persistidos, enviados ou compartilhados;
- a extensão não realiza reconhecimento ou identificação de pessoas;
- pose, confiança, estado e métricas permanecem apenas na memória durante a sessão;
- somente sensibilidade e velocidade máxima são persistidas em `chrome.storage.local` no dispositivo.

## Finalidade e base do processamento

O vídeo é processado exclusivamente para estimar movimentos da cabeça e produzir intenções de scroll na aba que a pessoa ativou explicitamente. O título e o identificador da aba são usados somente para mostrar e limitar o alvo da sessão.

## Compartilhamento e transmissão

O Cifras Scroll não transmite dados pessoais ou de uso a servidores do desenvolvedor ou de terceiros. O código, os arquivos WebAssembly e o modelo de visão computacional necessários à inferência são distribuídos dentro da extensão.

Não há venda, compartilhamento para publicidade, criação de perfil, análise comportamental ou uso dos dados para finalidade de crédito.

## Retenção e controle

Frames são descartados imediatamente após cada inferência. Dados derivados e métricas em memória são descartados ao encerrar a sessão ou a extensão. A calibração não é persistida.

Sensibilidade e velocidade permanecem no armazenamento local do Chrome até serem alteradas, até os dados da extensão serem apagados ou até a extensão ser removida.

A câmera é iniciada somente após ação explícita. A pessoa pode interromper o processamento a qualquer momento usando **Parar agora**, o atalho configurado no Chrome ou removendo/desativando a extensão.

## Permissões do navegador

- `activeTab`: limitar o controle à aba escolhida após ação explícita;
- `scripting`: instalar o controlador de scroll somente nessa aba;
- `storage`: salvar sensibilidade e velocidade no dispositivo;
- `offscreen`: manter câmera e inferência local enquanto o popup estiver fechado.

A extensão não solicita permissões permanentes de host.

## Alterações

Mudanças materiais nesta política serão publicadas neste documento e refletidas na página da Chrome Web Store antes de uma versão que altere o tratamento de dados ser disponibilizada.

## Contato

Dúvidas de privacidade e suporte podem ser abertas no [repositório oficial do Cifras Scroll](https://github.com/glaysonbsantos/cifras-scroll/issues). Não inclua imagens da câmera nem informações sensíveis no relato.

---

# Privacy Policy — Cifras Scroll

**Effective date:** September 21, 2026

Cifras Scroll controls scrolling in a selected browser tab through head movements. It is designed to run locally without a backend, accounts, advertising, or telemetry.

## Data processed

During an active session, the extension accesses camera video to estimate head pose and face presence. It also temporarily holds the controlled tab identifier and title, session state, and aggregate runtime metrics.

- no audio is requested or captured;
- frames, images, and video are not recorded, persisted, transmitted, or shared;
- the extension does not recognize or identify people;
- pose, confidence, state, and metrics remain in memory only for the session;
- only sensitivity and maximum speed are persisted in `chrome.storage.local` on the device.

## Purpose

Video is processed solely to estimate head movement and produce scroll intentions for the tab explicitly selected by the user. The tab title and identifier are used only to display and constrain the session target.

## Sharing and transmission

Cifras Scroll does not transmit personal or usage data to developer or third-party servers. The code, WebAssembly files, and computer-vision model required for inference are bundled with the extension.

There is no sale, advertising sharing, profiling, behavioral analytics, or use of data for credit-related purposes.

## Retention and control

Frames are discarded immediately after each inference. In-memory derived data and metrics are discarded when the session or extension ends. Calibration is not persisted.

Sensitivity and speed remain in local Chrome storage until changed, until extension data is cleared, or until the extension is removed.

The camera starts only after explicit user action. Processing can be stopped at any time through **Stop now**, the configured Chrome shortcut, or by disabling or removing the extension.

## Browser permissions

- `activeTab`: restrict control to the tab selected after explicit user action;
- `scripting`: install the scroll controller only in that tab;
- `storage`: save sensitivity and speed on the device;
- `offscreen`: keep local camera processing running while the popup is closed.

The extension does not request persistent host permissions.

## Changes

Material changes will be published in this document and reflected in the Chrome Web Store listing before a version with changed data practices is released.

## Contact

Privacy and support questions can be filed in the [official Cifras Scroll repository](https://github.com/glaysonbsantos/cifras-scroll/issues). Do not include camera images or sensitive information in reports.

