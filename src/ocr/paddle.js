// PaddleOCR(WASM) 初期化用の薄いラッパー
// 実運用では public/ocr/paddle/ 以下にモデル/wasmを配置し、ここで読み込みます。

let initialized = false;
let ocrInstance = null;

export async function initPaddleOCR(options = {}) {
  const baseUrl = typeof options === 'string' ? options : (options.baseUrl || '/ocr/paddle/');
  const modelUrl = (typeof options === 'object' && options.modelUrl) ? options.modelUrl : `${baseUrl}ch_PP-OCRv3/`;
  if (initialized) return true;
  try {
    // 実際のPaddleOCR(WASM)ブリッジを読み込む
    // 期待ファイル構成（public配下）
    // /ocr/paddle/
    //   ├─ paddleocr.js      -> window.PaddleOCR を提供
    //   ├─ paddleocr.wasm    -> JSから内部でロード
    //   └─ ch_PP-OCRv3/*     -> モデル一式

    await loadScript(`${baseUrl}paddleocr.js`).catch(() => null);

    if (typeof window !== 'undefined' && window.PaddleOCR && typeof window.PaddleOCR.init === 'function') {
      ocrInstance = await window.PaddleOCR.init({
        modelUrl,
        wasmPath: `${baseUrl}paddleocr.wasm`
      });

      // グローバルコール（pdfOCR.js から利用）
      window.__paddleOcrRecognize = async (canvas) => {
        if (!ocrInstance || typeof ocrInstance.recognize !== 'function') return null;
        // 画像データを渡す（実装に応じてImageData/XRAY指定に変更）
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const res = await ocrInstance.recognize(imageData);
        // 正規化
        const text = Array.isArray(res?.lines) ? res.lines.map(l => l.text).join('\n') : (res?.text || '');
        const confidence = Array.isArray(res?.lines) && res.lines.length
          ? (res.lines.reduce((s, l) => s + (l.score || 0), 0) / res.lines.length)
          : (res?.score || 0.85);
        return { text, confidence };
      };
    } else {
      // 未配置でも動作継続（Tesseractへフォールバック）
      if (typeof window !== 'undefined' && !window.__paddleOcrRecognize) {
        window.__paddleOcrRecognize = async () => null;
      }
    }

    // 暫定: 実体が未配置の場合でもアプリが落ちないようにダミー関数を提供
    if (typeof window !== 'undefined' && !window.__paddleOcrRecognize) {
      window.__paddleOcrRecognize = async () => null;
    }
    initialized = true;
    return true;
  } catch (e) {
    console.warn('[PaddleOCR] 初期化に失敗しました:', e);
    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}


