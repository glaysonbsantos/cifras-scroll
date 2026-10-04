# Como contribuir

Relatos de problemas, dúvidas sobre uso e sugestões são bem-vindos nas [issues do projeto](https://github.com/glaysonbsantos/cifras-scroll/issues). Confira o [guia de suporte](SUPPORT.md) e procure uma issue existente antes de abrir outra.

## Propostas de código

O código próprio ainda não possui licença definida. Antes de enviar uma contribuição de código, alinhe a proposta e as condições de contribuição com o responsável em uma issue. Não presuma que a licença das dependências se aplica ao projeto inteiro.

Leia o [plano do MVP](docs/MVP_PLAN.md), as [decisões](docs/DECISIONS.md) e as [regras de trabalho](AGENTS.md). Mudanças devem ser pequenas e focadas. Novas dependências, permissões, chamadas de rede ou ampliação de escopo precisam de decisão explícita e documentada.

## Preparação e verificação

Use Node.js 22.12+ na linha 22 ou Node.js 24 e pnpm. As instruções de desenvolvimento estão no [README](README.md#desenvolvimento). Instale com `pnpm install --frozen-lockfile` e execute `pnpm check` antes de propor uma alteração. Para mudanças no pacote de distribuição, execute também `pnpm release`.

Descreva o problema, a mudança e as verificações realizadas. Informe separadamente se houve teste manual com pessoa e câmera; testes automatizados não demonstram conforto, compatibilidade de hardware ou funcionamento real da câmera.

## Privacidade e limites

- Todo processamento de câmera deve continuar local, sem áudio, identificação de pessoas ou telemetria.
- Não inclua frames, imagens, vídeos, amostras de pose ou dados pessoais em commits, fixtures ou issues.
- Modelo, WASM e bibliotecas de runtime devem permanecer empacotados localmente.
- Não versione `.env`, segredos, logs, `node_modules`, `.output` ou builds.
- Mantenha a interpretação dos gestos separada das APIs da extensão e o service worker como coordenador.

Se a mudança afetar comportamento ou câmera, siga o [protocolo de testes](docs/TEST_PROTOCOL.md) e registre somente observações reais e métricas agregadas. Atualize a documentação de uso quando necessário.
