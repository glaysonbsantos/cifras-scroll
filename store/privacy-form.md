# Formulário de privacidade da Chrome Web Store

Use este arquivo como roteiro. Leia o texto exato apresentado pelo painel no momento da submissão e mantenha as respostas consistentes com `PRIVACY.md`.

## Propósito único

Permitir que a pessoa controle o scroll da aba escolhida por movimentos da cabeça processados localmente pela câmera.

## Justificativas de permissões

### `activeTab`

Concede acesso temporário somente à aba escolhida quando a pessoa clica no ícone e ativa o controle. Evita acesso permanente a sites.

### `scripting`

Injeta o controlador de scroll na aba escolhida após ação explícita. Nenhum script é injetado globalmente ou antes da ativação.

### `storage`

Salva localmente apenas as preferências de sensibilidade e velocidade máxima. Câmera, frames, calibração, aba, métricas e estado da sessão não são persistidos.

### `offscreen`

Mantém o documento local responsável por câmera e inferência enquanto o popup está fechado. O service worker não recebe frames.

## Código remoto

Não utiliza código remoto. JavaScript, WebAssembly e modelo do MediaPipe são empacotados com a extensão. A CSP restringe conexões das páginas da extensão à própria origem.

## Tratamento de dados

- A câmera e movimentos da cabeça são acessados somente durante uma sessão iniciada explicitamente.
- O vídeo é processado localmente e cada frame é descartado depois da inferência.
- Não há captura de áudio.
- O título e o identificador da aba são mantidos temporariamente para identificar e limitar o alvo da sessão.
- Não há transmissão, venda, compartilhamento, telemetria, publicidade ou criação de perfil.
- Sensibilidade e velocidade são as únicas informações persistidas, exclusivamente no dispositivo.

Se o painel perguntar sobre dados **coletados ou transmitidos para fora do dispositivo**, a extensão não realiza essa coleta ou transmissão. Se perguntar sobre dados **acessados ou processados**, declare câmera/movimento e informação efêmera da aba, esclarecendo que o processamento é local e necessário ao propósito único.

## Certificações

As declarações devem confirmar que os dados:

- são usados somente para a funcionalidade descrita;
- não são vendidos ou transferidos para publicidade;
- não são usados para crédito;
- não são transmitidos a terceiros;
- obedecem à política de uso limitado da Chrome Web Store.

