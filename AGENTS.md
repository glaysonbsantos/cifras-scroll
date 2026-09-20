# AGENTS.md

## Contexto do projeto

Este repositório valida scroll hands-free no navegador por movimentos da cabeça. O caso inicial é o uso de cifras por músicos, mas a lógica central não deve depender de sites de cifras.

Antes de trabalhar, leia:

1. `docs/MVP_PLAN.md`;
2. `docs/TEST_PROTOCOL.md` quando a tarefa envolver comportamento, câmera ou validação;
3. `docs/DECISIONS.md` quando a tarefa envolver arquitetura, dependências ou permissões.

## Estado atual

- Fase atual: Fases 1 e 2 concluídas e aprovadas; aguardar autorização explícita para iniciar a Fase 3.
- Gerenciador de pacotes oficial: `pnpm`.
- Comandos oficiais: `pnpm dev`, `pnpm test`, `pnpm build` e `pnpm check`.
- Antes de encerrar mudanças de código, execute `pnpm check`.

## Regras de execução

- Trabalhe apenas na fase ou task solicitada pelo usuário.
- Não avance automaticamente para a fase seguinte.
- Faça mudanças pequenas e verificáveis.
- Atualize o status em `docs/MVP_PLAN.md` ao concluir uma task.
- Registre em `docs/DECISIONS.md` decisões técnicas que alterem arquitetura, dependências, privacidade, permissões ou escopo.
- Registre resultados de experimentos no `docs/TEST_PROTOCOL.md` ou em documento de resultados indicado por ele.
- Não adicione dependências sem que façam parte da task aprovada.
- Quando comandos oficiais forem criados, execute os checks relevantes antes de encerrar a task e atualize este arquivo.

## Regras de documentação

- Trate `docs/MVP_PLAN.md` como fonte de verdade para fase, progresso e próxima task.
- Marque um item como concluído somente quando houver implementação e evidência verificável; não trate preparação como resultado experimental.
- Mantenha `docs/DECISIONS.md` como registro append-only: decisões substituídas recebem uma nova entrada e referência à anterior.
- Registre em `docs/TEST_PROTOCOL.md` somente métricas agregadas e observações reais, distinguindo validação automatizada de rodada com pessoa e câmera.
- Atualize `README.md` quando mudarem o estado do projeto, os pré-requisitos ou os comandos públicos.
- Atualize este arquivo quando mudarem comandos oficiais ou regras permanentes de trabalho.

## Regras de Git

- Use uma branch por fase ou task, com o prefixo `codex/`, salvo orientação explícita diferente.
- Faça commits pequenos e focados; use mensagens no formato Conventional Commits, como `docs:`, `feat:`, `fix:` e `test:`.
- Não misture alterações não relacionadas nem descarte mudanças preexistentes do usuário.
- Antes de um commit, revise `git status` e o diff e execute os checks oficiais aplicáveis.
- Nunca versione `node_modules`, `dist`, segredos, arquivos `.env`, logs, frames ou qualquer dado derivado identificável da câmera.
- Não faça `push`, force-push, rebase, amend ou reescrita de histórico sem solicitação explícita do usuário.
- Após aprovação explícita de uma fase, consolide sua branch na `main`, que é a branch principal do projeto.

## Invariantes de privacidade

- Todo processamento de câmera deve acontecer localmente.
- Nunca enviar, gravar, persistir ou incluir frames/imagens da câmera em logs ou fixtures.
- Nunca solicitar ou capturar áudio.
- Não implementar reconhecimento ou identificação de pessoas.
- Não adicionar telemetria ou chamadas de rede sem decisão explícita e documentada.
- Bibliotecas, WASM e modelos necessários à execução da extensão devem ser empacotados localmente.

## Limites de arquitetura

- Separar interpretação de gestos das APIs específicas da extensão.
- Representar a saída de visão como dados compactos de pose/confiança, não como imagens.
- Manter o service worker como coordenador; não colocar captura ou inferência nele.
- Manter popup e interfaces desacoplados do ciclo de vida da câmera.
- Preferir permissões temporárias e específicas a permissões amplas de host.
- Evitar abstrações para plataformas ou funcionalidades fora do MVP.
