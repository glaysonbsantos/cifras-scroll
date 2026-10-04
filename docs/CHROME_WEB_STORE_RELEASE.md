# Publicação na Chrome Web Store

Última atualização: 2026-10-04.

## Estado da distribuição

A versão `1.0.0` está publicada na [página oficial do Cifras Scroll](https://chromewebstore.google.com/detail/cifras-scroll/onkimagjeggfnamedjbodeihfedkmdba). A listagem foi consultada em 2026-10-04 e informa atualização em 2026-09-22; essa data não é tratada como a data exata de aprovação. O responsável confirmou a publicação e o uso bem-sucedido com dois amigos, registrado em [TEST_PROTOCOL.md](TEST_PROTOCOL.md#acompanhamento-após-publicação).

O processo da primeira submissão abaixo é mantido como referência. Para uma versão já publicada, use o item existente no Developer Dashboard e siga **Atualizações futuras**; não crie outro item nem reenvie a mesma versão.

## Pré-requisitos de distribuição

- para gerar o pacote: Node.js 22.12+ na linha 22 ou Node.js 24 e pnpm;
- conta de desenvolvedor cadastrada, taxa paga e e-mail verificado;
- verificação em duas etapas ativa na conta Google;
- Fase 5 aprovada e consolidada;
- política de privacidade publicamente acessível;
- versão do pacote maior que qualquer versão já enviada.

## Gerar o pacote

```bash
pnpm install --frozen-lockfile
pnpm release
```

O WXT gera `.output/cifras-scroll-<versão>-chrome.zip`. Confirme que o arquivo tem `manifest.json` na raiz, versão igual à de `package.json`, ícones 16/32/48/128, modelo e WASM locais. A primeira versão foi `1.0.0`; uma atualização deve ter uma versão maior.

Antes do upload, extraia o ZIP em uma pasta temporária, carregue-a em `chrome://extensions` e repita o fluxo crítico de `docs/FINAL_CHECKLIST.md`, incluindo as duas formas de parada e a liberação da câmera.

## URL pública de privacidade

O endereço oficial da política é público na `main`. Confirme seu acesso sem autenticação antes de cada submissão:

[Política de privacidade](https://github.com/glaysonbsantos/cifras-scroll/blob/main/PRIVACY.md)

Não envie para revisão enquanto essa URL não estiver acessível.

## Primeira submissão — referência histórica

1. No Developer Dashboard, escolha **Novo item**.
2. Envie o ZIP gerado; não envie a pasta nem o ZIP do código-fonte.
3. Preencha a listagem usando `store/listing-pt-BR.md`.
4. Envie os arquivos de `store/assets` nos campos correspondentes.
5. Preencha práticas de privacidade usando `store/privacy-form.md`.
6. Cole `store/reviewer-instructions.md` nas instruções de teste, adaptando ao limite do campo se necessário.
7. Declare ausência de compras e escolha distribuição gratuita, pública e nas regiões desejadas.

## Revisão e lançamento

Envie como item público com publicação adiada. Após aprovação:

1. confira a página e os avisos de permissão;
2. instale a versão assinada pela loja em um perfil limpo;
3. repita ativação, calibração, indicador e parada;
4. publique manualmente dentro do prazo mostrado pelo painel.

## Atualizações futuras

Incremente `version` em `package.json`, execute `pnpm release`, teste o novo ZIP e envie-o como atualização do item existente. Mudanças em código, manifest, permissões, privacidade ou pacote exigem nova revisão. Atualizar somente a documentação do GitHub não altera a versão instalada da extensão.

## Preparação do GitHub para divulgação

Verificação pública de 2026-10-04: o repositório e a `main` estão acessíveis, e as issues estão habilitadas. Há estes acompanhamentos:

- Publicar a revisão de documentação na `main` após autorização para push.
- Em **Settings → General → Default branch**, definir `main` como branch padrão. A configuração atual aponta para `codex/fase-1-poc-web`, mostrando a POC ao abrir o link do projeto.
- No **About** do repositório, preencher descrição, usar a URL da loja como Website e adicionar tópicos. Sugestão de descrição: “Extensão Chrome para rolar páginas com movimentos da cabeça, com processamento local e sem gravação.”
- Definir a licença do código próprio e revisar licenças e avisos dos componentes de terceiros redistribuídos. Repositório público não define, por si só, condições de reutilização do código; veja a [orientação do GitHub sobre licenças](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

Esses ajustes de configuração não foram executados nesta revisão. Não dependem de uma nova versão da extensão na loja; alterações em arquivos empacotados devem seguir o fluxo de atualização acima.
