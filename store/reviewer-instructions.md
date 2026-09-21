# Instruções para revisão da Chrome Web Store

Não há conta, credenciais ou backend.

## Fluxo principal

1. Instale a extensão e abra a página de configuração inicial.
2. Clique em **Autorizar câmera**. Somente vídeo é solicitado; a faixa usada para verificar a permissão é interrompida imediatamente.
3. Abra uma página longa `https`, como um artigo público.
4. Abra o popup e clique em **Ativar nesta aba**.
5. Mantenha postura confortável durante a calibração.
6. Confirme o selo `ON` no ícone e feche o popup.
7. Incline a cabeça verticalmente para rolar; retorne à postura neutra para parar.
8. Abra o popup e use **Parar agora**, ou teste o comando `stop-session` configurado nos atalhos do Chrome.
9. Confirme que o selo desaparece e que a câmera é liberada.

## Estados de segurança

- Ao perder a face, a extensão envia intenção neutra e muda para `PAUS`; a retomada exige ação explícita.
- Trocar de aba ou janela, recarregar, navegar ou fechar a aba encerra a sessão.
- Páginas internas como `chrome://extensions` são recusadas sem iniciar a câmera.

## Privacidade

Todo processamento acontece no documento offscreen local. Frames não atravessam a mensageria, não são gravados e não são enviados. Não há áudio, chamadas remotas, telemetria ou código remoto.

