import React, { useRef, useState } from 'react';

const PDFUpload = ({ onExtract, onExtractItems }) => {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });

  const handleFile = async (e) => {
    try {
      setError('');
      setLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const buf = await readFileAsArrayBuffer(file);
      // 動的import（軽量化）
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      const loadingTask = pdfjsLib.getDocument({ data: buf });
      const pdf = await loadingTask.promise;
      let text = '';
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const items = content.items.map(it => {
          // ビューポート×テキスト行列を合成して座標を取得
          const m = pdfjsLib.Util.transform(viewport.transform, it.transform);
          const x = m[4];
          const y = m[5];
          return {
            str: it.str,
            x,
            y,
            width: it.width,
            height: it.height,
            fontName: it.fontName
          };
        });
        pages.push({ pageIndex: i, items });
        const pageText = content.items.map(it => it.str).join('\n');
        text += `\n\n---- page ${i} ----\n${pageText}`;
      }
      onExtract && onExtract(text);
      onExtractItems && onExtractItems({ pages });
    } catch (err) {
      console.error(err);
      setError('PDFのテキスト抽出に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border">
      <h3 className="font-semibold mb-2">PDFアップロード</h3>
      <input type="file" accept="application/pdf" ref={fileRef} onChange={handleFile} />
      {loading && <p className="text-sm text-gray-500 mt-2">解析中...</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default PDFUpload;
