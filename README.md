# Cifras Scroll

Projeto experimental para validar **scroll hands-free no navegador por movimentos da cabeça**.

O primeiro contexto de uso são páginas de cifras durante apresentações de voz e violão, mas o núcleo do produto não será específico para músicos ou para um site determinado.

## Estado atual

O projeto está na Fase 1. A POC web instrumentada já possui captura explícita de vídeo, inferência local com MediaPipe Face Landmarker, calibração neutra, interpretação de `UP`, `DOWN` e `NEUTRAL`, métricas em memória e uma área longa de leitura.

O scroll automático permanece desativado nesta fase. O próximo marco é executar e registrar a primeira rodada física do protocolo antes de iniciar a estabilização do controle.

## Executar a POC

Pré-requisitos: Node.js 20.19 ou superior e pnpm.

```bash
pnpm install
pnpm dev
```

Abra o endereço local informado no terminal e clique em **Iniciar câmera**. A permissão solicita somente vídeo. Para executar todas as verificações automatizadas:

```bash
pnpm check
```

O pacote, os arquivos WASM e o modelo do MediaPipe usados em runtime ficam no projeto e são servidos pela própria POC; a inferência não depende de CDN ou backend.

## Princípios do MVP

- processamento integralmente local;
- nenhum frame enviado ou armazenado;
- nenhuma captura de áudio;
- nenhuma identificação de pessoas;
- permissões mínimas e solicitadas no contexto da funcionalidade;
- controle fácil de interromper;
- arquitetura reutilizável sem abstrações antecipadas.

## Documentação

- [Plano do MVP](docs/MVP_PLAN.md)
- [Protocolo de testes](docs/TEST_PROTOCOL.md)
- [Registro de decisões](docs/DECISIONS.md)
- [Instruções para agentes](AGENTS.md)

## Forma de trabalho

O desenvolvimento será conduzido uma fase por vez. Cada etapa deve cumprir seus critérios de aceite e registrar os resultados relevantes antes do início da seguinte.
