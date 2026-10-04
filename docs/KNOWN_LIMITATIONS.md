# Limitações conhecidas

Última atualização: 2026-10-04.

- O MVP suporta somente Google Chrome 116 ou superior no computador. A versão `1.0.0` está publicada na [Chrome Web Store](https://chromewebstore.google.com/detail/cifras-scroll/onkimagjeggfnamedjbodeihfedkmdba).
- O controle só pode ser ativado em páginas `http` ou `https`. Páginas internas do Chrome, Chrome Web Store e visualizadores internos não são suportados.
- Cada sessão controla uma única aba. Trocar de aba ou de janela do Chrome, navegar, recarregar ou fechar a aba encerra a sessão e libera a câmera por segurança. Não use minimizar o navegador ou alternar para outro aplicativo como forma de parada; use **Parar agora** ou o atalho.
- O adaptador atua no scroll principal da página. Containers internos, leitores virtuais, iframes e páginas que substituem o comportamento de scroll podem não responder.
- Calibração e detecção dependem de rosto visível, iluminação suficiente, câmera estável e capacidade do hardware. Perder a face pausa o scroll e exige retomada explícita.
- `PAUS` significa que o scroll está neutro, mas a câmera continua ligada. Apenas **Parar agora**, o atalho de emergência ou um encerramento seguro da sessão libera a câmera.
- O atalho sugerido pode conflitar com o sistema ou outra extensão. Ele pode ser alterado ou removido em `chrome://extensions/shortcuts`; o botão no popup continua disponível.
- A extensão persiste somente sensibilidade e velocidade. Calibração, aba, métricas e estado da sessão não sobrevivem como preferências permanentes.
- Não há suporte específico para sites de cifras, seleção automática de container, comandos personalizados, outros navegadores ou dispositivos móveis.
- A carga relativa da inferência não equivale à CPU total. A medição de CPU do processo e a validação em um segundo hardware continuam como acompanhamentos da Fase 4.
- A Fase 5 foi aprovada em uma rodada manual, sem bugs relatados. Em 2026-10-04, o responsável informou uso bem-sucedido com dois amigos; não foram fornecidos equipamentos, páginas, duração ou métricas. Esse relato não equivale a uma matriz formal de compatibilidade nem comprova a instalação do ZIP em perfil limpo.
