# Assets locais do MediaPipe

Estes arquivos são servidos pela própria POC. Não substitua os caminhos do runtime por CDN.

## Origem

- `wasm/`: copiado de `@mediapipe/tasks-vision` 1.0.1, pacote Apache-2.0.
- `models/face_landmarker.task`: modelo oficial Face Landmarker float16, versão 1, obtido em <https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task>.

## Integridade

| Arquivo | SHA-256 |
|---|---|
| `models/face_landmarker.task` | `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff` |
| `wasm/vision_wasm_internal.js` | `e170ee67dd4e16c1a6fcd8840a206687e5a59b22c20e4a902bc445b095454d73` |
| `wasm/vision_wasm_internal.wasm` | `8da277a733926eacd0474b8704b36742d6ec3231c57a860c5b889dff8f1df886` |
| `wasm/vision_wasm_nosimd_internal.js` | `e81d715a3d42cc3373602eb2f7aff795d164934db680e32496b65dab537f9658` |
| `wasm/vision_wasm_nosimd_internal.wasm` | `a28483cd42e74e855bf5ebdb6b40d9b66a5b49e35e95020bc97669e6822a3192` |

Ao atualizar o pacote ou o modelo, copie novamente os assets, recalcule todos os hashes, execute `pnpm check` e registre a mudança em `docs/DECISIONS.md`.
