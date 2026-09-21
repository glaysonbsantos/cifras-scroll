# Publicação na Chrome Web Store

## Pré-requisitos

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

O WXT gera um ZIP em `.output`. Confirme que o arquivo tem `manifest.json` na raiz, versão `1.0.0`, ícones 16/32/48/128, modelo e WASM locais.

Antes do upload, extraia o ZIP em uma pasta temporária, carregue-a em `chrome://extensions` e repita o fluxo crítico de `docs/FINAL_CHECKLIST.md`, incluindo as duas formas de parada e a liberação da câmera.

## URL pública de privacidade

Depois de enviar esta branch para a `main` pública, confirme sem autenticação:

`https://github.com/glaysonbsantos/cifras-scroll/blob/main/PRIVACY.md`

Não envie para revisão enquanto essa URL não estiver acessível.

## Criar o item

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

Incremente `version` em `package.json`, execute `pnpm release`, teste o novo ZIP e envie-o como atualização. Mudanças em código, manifest, permissões, privacidade ou pacote exigem nova revisão.

