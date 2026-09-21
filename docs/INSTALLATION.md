# Instalação da extensão descompactada

Estas instruções instalam o pacote local do Cifras Scroll no Google Chrome 116 ou superior. A extensão ainda não é distribuída pela Chrome Web Store.

## Gerar o pacote

Pré-requisitos: Node.js 20.19 ou superior e pnpm.

```bash
pnpm install
pnpm check
```

O pacote pronto para instalar será criado em `.output/chrome-mv3`.

## Carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `.output/chrome-mv3`, não a pasta raiz do repositório.
5. Fixe o Cifras Scroll na barra do Chrome para manter o estado da sessão visível.
6. Na tela de configuração inicial, clique em **Autorizar câmera**. A verificação solicita somente vídeo e libera a câmera imediatamente.

Ao atualizar o código, execute `pnpm check` novamente e clique em **Recarregar** no cartão da extensão em `chrome://extensions`.

## Primeira utilização

1. Abra uma página comum cujo endereço comece com `http` ou `https`.
2. Abra o popup e clique em **Ativar nesta aba**.
3. Durante a calibração, olhe para a tela em uma posição confortável por alguns segundos.
4. Incline a cabeça verticalmente para controlar o scroll e retorne à posição neutra para parar.
5. Confirme o selo no ícone da extensão: `ON` indica sessão em uso e `PAUS` indica scroll pausado com a câmera ainda ligada.
6. Para encerrar, use **Parar agora** no popup ou o atalho `Alt+Shift+X` (`Command+Shift+X` no macOS). O Chrome permite consultar ou alterar esse atalho em `chrome://extensions/shortcuts`.

Ao encerrar, o selo deve desaparecer e o indicador físico da câmera deve apagar. Se isso não ocorrer, desative a extensão em `chrome://extensions` e registre o ambiente e o ocorrido antes de uma nova tentativa.

## Problemas comuns

- **Câmera bloqueada:** abra a ajuda no popup e as configurações de câmera do Chrome; libere o Cifras Scroll e tente novamente.
- **Câmera ocupada:** feche aplicativos de reunião, gravação ou outras abas que estejam usando a câmera.
- **Página não permitida:** páginas `chrome://`, a Chrome Web Store, o visualizador interno de PDF e outras páginas protegidas não aceitam o controle. Use uma página `http` ou `https`.
- **Atalho não funciona:** outro programa pode estar usando a combinação. Defina outra em `chrome://extensions/shortcuts`.
- **Face perdida:** a sessão pausa o scroll, mas mantém a câmera ligada. Volte ao enquadramento e use **Retomar**, ou use a parada de emergência.

Consulte também as [limitações conhecidas](KNOWN_LIMITATIONS.md) e a [checklist final](FINAL_CHECKLIST.md).

