# Componentes de terceiros

A [licença MIT do Cifras Scroll](LICENSE) aplica-se ao código próprio do projeto. Bibliotecas, modelos e outros arquivos de terceiros mantêm as condições de seus autores.

## Dependências de execução

| Componente | Versão no lockfile | Licença declarada | Referência |
|---|---|---|---|
| MediaPipe Tasks Vision | 1.0.1 | Apache-2.0 | [Projeto MediaPipe e licença](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE) |
| Vue | 3.5.42 | MIT | [Projeto Vue e licença](https://github.com/vuejs/core/blob/main/LICENSE) |

As licenças declaradas foram conferidas nos pacotes instalados desta revisão. A autoria declarada na licença do Vue é “Copyright (c) 2018-present, Yuxi (Evan) You”.

## Modelo e WASM

O runtime WASM foi copiado do pacote MediaPipe Tasks Vision. O modelo Face Landmarker float16, versão 1, foi obtido da distribuição oficial do Google. Origem e hashes estão em [public/mediapipe/README.md](public/mediapipe/README.md).

A licença do pacote JavaScript não é usada neste documento como prova das condições do arquivo de modelo. Preserve os avisos aplicáveis e confira os termos da distribuição oficial ao redistribuir ou atualizar esses assets.

## Distribuição

Este documento identifica as dependências diretas de execução; não é uma auditoria completa das dependências transitivas, componentes internos do WASM ou ferramentas de desenvolvimento. A revisão dos textos de licença e avisos que devem acompanhar o pacote redistribuído permanece no [plano do projeto](docs/MVP_PLAN.md). Consulte também o [texto oficial da Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).
