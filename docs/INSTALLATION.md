# Instalação e primeiros passos

O Cifras Scroll está disponível para Google Chrome 116 ou superior no computador. Você precisa de uma câmera e deve permitir seu uso pelo Chrome no sistema operacional.

## Instalação pela Chrome Web Store

1. Abra a [página oficial do Cifras Scroll](https://chromewebstore.google.com/detail/cifras-scroll/onkimagjeggfnamedjbodeihfedkmdba).
2. Clique em **Usar no Chrome** (ou **Adicionar ao Chrome**, conforme o idioma) e confirme a instalação.
3. No menu de extensões do Chrome, fixe o Cifras Scroll na barra para acompanhar o estado da sessão.
4. Na tela de configuração inicial, clique em **Autorizar câmera**. A verificação solicita somente vídeo e libera a câmera imediatamente.
5. Feche a configuração inicial e siga a primeira utilização abaixo em uma página comum; a própria Chrome Web Store não permite controle de scroll por extensões.

Não é necessário clonar o repositório, instalar Node.js ou ativar o modo do desenvolvedor para usar a versão da loja.

## Primeira utilização

1. Abra uma página comum cujo endereço comece com `http` ou `https`.
2. Abra o popup e clique em **Ativar nesta aba**.
3. Durante a calibração, olhe para a tela em uma posição confortável por alguns segundos.
4. Incline a cabeça verticalmente para controlar o scroll e retorne à posição neutra para parar o movimento.
5. Ajuste **Sensibilidade** e **Velocidade** no popup. Se mudar de postura ou posição da câmera, use **Recalibrar**.
6. O popup pode ser fechado. Confirme o selo no ícone: `ON` indica sessão em uso e `PAUS` indica scroll pausado com a câmera ainda ligada.
7. Para encerrar, use **Parar agora** no popup ou o atalho sugerido `Alt+Shift+X` (`Command+Shift+X` no macOS). Consulte ou altere o atalho efetivo em `chrome://extensions/shortcuts`.

Ao encerrar, o selo deve desaparecer e o indicador da câmera deve apagar. Se isso não ocorrer, desative a extensão em `chrome://extensions` e [relate o problema](../SUPPORT.md) antes de uma nova tentativa.

Trocar de aba ou de janela do Chrome, recarregar, navegar ou fechar a aba encerra a sessão. Ative novamente na página desejada para continuar.

## Instalação local para desenvolvimento

Esta alternativa é destinada a quem quer executar ou modificar o código. Pré-requisitos: Node.js 22.12+ na linha 22 ou Node.js 24 e pnpm. Execute na raiz do repositório, na branch `main` ou na branch de trabalho desejada:

```bash
pnpm install --frozen-lockfile
pnpm check
```

O pacote pronto para instalar será criado em `.output/chrome-mv3`.

### Carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `.output/chrome-mv3`, não a pasta raiz do repositório.
5. Fixe o Cifras Scroll na barra do Chrome para manter o estado da sessão visível.
6. Na tela de configuração inicial, clique em **Autorizar câmera**. A verificação solicita somente vídeo e libera a câmera imediatamente.

Ao atualizar o código, execute `pnpm check` novamente e clique em **Recarregar** no cartão da extensão em `chrome://extensions`.

## Problemas comuns

- **Câmera bloqueada:** abra a ajuda no popup e as configurações de câmera do Chrome; libere o Cifras Scroll e tente novamente.
- **Câmera ocupada:** feche aplicativos de reunião, gravação ou outras abas que estejam usando a câmera.
- **Página não permitida:** páginas `chrome://`, a Chrome Web Store, o visualizador interno de PDF e outras páginas protegidas não aceitam o controle. Use uma página `http` ou `https`.
- **Atalho não funciona:** outro programa pode estar usando a combinação. Defina outra em `chrome://extensions/shortcuts`.
- **Face perdida:** a sessão pausa o scroll, mas mantém a câmera ligada. Volte ao enquadramento e use **Retomar**, ou use a parada de emergência.
- **Página não rola:** confirme que há conteúdo abaixo ou acima e que a rolagem é a principal da página. Containers internos e leitores personalizados podem não ser compatíveis.
- **Movimento involuntário ou desconfortável:** use **Recalibrar** em postura natural, reduza a sensibilidade ou a velocidade e confira iluminação e enquadramento.

Consulte também as [limitações conhecidas](KNOWN_LIMITATIONS.md) e a [checklist final](FINAL_CHECKLIST.md).
