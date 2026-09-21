# Cifras Scroll

Projeto experimental para validar **scroll hands-free no navegador por movimentos da cabeça**.

O primeiro contexto de uso são páginas de cifras durante apresentações de voz e violão, mas o núcleo do produto não será específico para músicos ou para um site determinado.

## Estado atual

As Fases 1, 2, 3 e 4 estão concluídas, aprovadas e consolidadas na `main`. A implementação da Fase 5 está na branch `codex/fase-5-mvp-instalavel`; a rodada final com outra pessoa, câmera e páginas reais permanece pendente antes da aprovação. Medição de CPU total e repetição em um segundo hardware continuam como acompanhamentos documentados da Fase 4.

A extensão usa Manifest V3 e WXT. O popup ativa uma sessão vinculada à aba atual; câmera, inferência e calibração permanecem em um documento offscreen; o service worker roteia somente intenções compactas; e o content script aplica o scroll. Sensibilidade e velocidade são as únicas preferências persistidas. Falhas de câmera e mudanças da aba encerram a sessão com segurança, e uma sessão só é recuperada após reinício do service worker quando o mesmo alvo ainda é válido.

## Executar a extensão em desenvolvimento

Pré-requisitos: Node.js 20.19 ou superior e pnpm.

```bash
pnpm install
pnpm dev
```

O WXT gera a extensão de desenvolvimento em `.output/chrome-mv3-dev`. Carregue esse diretório temporariamente em `chrome://extensions`, com o modo do desenvolvedor ativo. Na primeira instalação, a tela de onboarding solicita somente vídeo e libera imediatamente a câmera usada para verificar a permissão.

Abra uma página `http` ou `https`, clique no ícone da extensão e use **Ativar nesta aba**. A calibração começa automaticamente; o popup pode ser fechado quando o estado ficar ativo. O selo `ON` no ícone mostra que a sessão está em uso. **Parar agora** ou `Alt+Shift+X` (`Command+Shift+X` no macOS) encerra a sessão e libera a câmera.

Durante a sessão, o popup mostra métricas locais de FPS, latência, carga relativa da inferência, memória JavaScript quando disponível e configuração da câmera. Os valores não são persistidos nem enviados.

Para executar todas as verificações automatizadas e gerar o pacote de produção em `.output/chrome-mv3`:

```bash
pnpm check
```

O pacote, os arquivos WASM e o modelo do MediaPipe usados em runtime ficam no projeto e são servidos pela própria extensão; a inferência não depende de CDN ou backend.

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
- [Instalação descompactada](docs/INSTALLATION.md)
- [Checklist final](docs/FINAL_CHECKLIST.md)
- [Limitações conhecidas](docs/KNOWN_LIMITATIONS.md)
- [Instruções para agentes](AGENTS.md)

## Forma de trabalho

O desenvolvimento será conduzido uma fase por vez. Cada etapa deve cumprir seus critérios de aceite e registrar os resultados relevantes antes do início da seguinte.
