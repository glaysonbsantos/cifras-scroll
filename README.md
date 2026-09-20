# Cifras Scroll

Projeto experimental para validar **scroll hands-free no navegador por movimentos da cabeça**.

O primeiro contexto de uso são páginas de cifras durante apresentações de voz e violão, mas o núcleo do produto não será específico para músicos ou para um site determinado.

## Estado atual

As Fases 1 e 2 estão concluídas e aprovadas. A POC web aplica suavização temporal, dead zone com histerese, dwell, intensidade proporcional e scroll baseado em tempo sobre a captura e calibração locais da Fase 1.

O scroll exige calibração e ativação explícita, pode ser pausado pelo botão fixo ou pela tecla `Esc` e é interrompido ao perder a face. Sensibilidade e velocidade podem ser ajustadas durante a sessão. A Fase 3 ainda depende de autorização explícita.

## Executar a POC

Pré-requisitos: Node.js 20.19 ou superior e pnpm.

```bash
pnpm install
pnpm dev
```

Abra o endereço local informado no terminal, clique em **Iniciar câmera**, calibre a posição neutra e então use **Ativar scroll**. A permissão solicita somente vídeo. Para executar todas as verificações automatizadas:

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
