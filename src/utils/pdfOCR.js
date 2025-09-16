import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// PDF.jsのワーカーパスを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export class PDFOCRProcessor {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker('jpn+eng', 1, {
        logger: m => console.log('OCR Progress:', m)
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('OCR初期化エラー:', error);
      throw new Error('OCR機能の初期化に失敗しました');
    }
  }

  async processPDFFromURL(pdfUrl, options = {}) {
    try {
      // Netlify Functions 経由で取得（CORS回避）
      const proxied = `/.netlify/functions/fetch-pdf?url=${encodeURIComponent(pdfUrl)}`;
      const response = await fetch(proxied);
      if (!response.ok) {
        throw new Error(`PDF読み込みエラー: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await this.processPDFFromBuffer(arrayBuffer, options);
    } catch (error) {
      console.error('PDF URL処理エラー:', error);
      throw error;
    }
  }

  async processPDFFromBuffer(arrayBuffer, options = {}) {
    const {
      maxPages = 10,
      targetPages = null,
      scale = 2.0,
      onProgress = null,
      preferEngine = 'auto' // 'auto' | 'paddle' | 'tesseract'
    } = options;

    try {
      await this.initialize();

      // PDFドキュメントを読み込み
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = Math.min(pdf.numPages, maxPages);
      const results = [];

      const pagesToProcess = targetPages || Array.from({ length: numPages }, (_, i) => i + 1);

      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageNum = pagesToProcess[i];

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: pagesToProcess.length,
            page: pageNum,
            status: 'processing'
          });
        }

        try {
          // 1) 文字PDF判定: pdf.jsのテキスト抽出で十分ならOCRをスキップ
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const textFromPdf = (textContent.items || []).map(i => i.str).join('\n');
          const normalized = textFromPdf.replace(/\s+/g, '');
          const isTextual = normalized.length >= 80; // 閾値は適宜調整

          let finalText = '';
          let usedEngine = 'text';
          let confidence = 95;

          if (isTextual) {
            finalText = textFromPdf;
          } else {
            // 2) OCR必要: まずPaddleOCR(WASM)を試行（将来の拡張用フック）
            const canvas = await this.renderPageToCanvas(pdf, pageNum, scale);
            const tryPaddle = preferEngine !== 'tesseract' && typeof window !== 'undefined' && window.__paddleOcrRecognize;
            if (tryPaddle) {
              try {
                const paddleRes = await window.__paddleOcrRecognize(canvas);
                if (paddleRes && paddleRes.text) {
                  finalText = paddleRes.text;
                  usedEngine = 'paddle';
                  confidence = Math.round((paddleRes.confidence || 0.85) * 100);
                }
              } catch (_) {
                // フォールバックしてTesseractへ
              }
            }
            if (!finalText) {
              const ocrResult = await this.worker.recognize(canvas);
              finalText = ocrResult.data.text;
              usedEngine = 'tesseract';
              confidence = ocrResult.data.confidence || 0;
            }
          }

          // アレルギー情報を解析
          const allergyInfo = this.extractAllergyInfo(finalText, pageNum);

          results.push({
            page: pageNum,
            text: finalText,
            engine: usedEngine,
            allergyInfo,
            confidence
          });
        } catch (pageError) {
          console.error(`ページ ${pageNum} の処理エラー:`, pageError);
          results.push({
            page: pageNum,
            error: pageError.message,
            allergyInfo: null
          });
        }
      }

      // 全ページの結果を統合
      const consolidatedInfo = this.consolidateAllergyInfo(results);

      return {
        success: true,
        pages: results,
        consolidatedInfo,
        totalPages: pdf.numPages,
        processedPages: pagesToProcess.length
      };
    } catch (error) {
      console.error('PDF処理エラー:', error);
      throw error;
    }
  }

  async renderPageToCanvas(pdf, pageNum, scale = 2.0) {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // ブラウザのCanvas APIを使用（WebContainer対応）
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      return canvas;
    } catch (error) {
      console.error('Canvas rendering error:', error);
      throw new Error('PDF ページのレンダリングに失敗しました');
    }
  }

  extractAllergyInfo(text, pageNum) {
    // 正しい28品目のアレルギー成分パターン
    const allergyPatterns = {
      // 法定8品目（特定原材料）
      egg: /卵|たまご|タマゴ|egg|Egg/gi,
      milk: /乳|牛乳|ミルク|milk|dairy/gi,
      wheat: /小麦|こむぎ|コムギ|wheat|gluten/gi,
      buckwheat: /そば|ソバ|蕎麦|buckwheat/gi,
      peanut: /落花生|らっかせい|ピーナッツ|peanut/gi,
      shrimp: /えび|エビ|海老|shrimp|prawn/gi,
      crab: /かに|カニ|蟹|crab/gi,
      walnut: /くるみ|クルミ|胡桃|walnut/gi,

      // 推奨20品目（特定原材料に準ずるもの）
      almond: /アーモンド|almond/gi,
      abalone: /あわび|アワビ|鮑|abalone/gi,
      squid: /いか|イカ|烏賊|squid/gi,
      salmon_roe: /いくら|イクラ|salmon roe/gi,
      orange: /オレンジ|orange/gi,
      cashew: /カシューナッツ|cashew/gi,
      kiwi: /キウイ|kiwi/gi,
      beef: /牛肉|ぎゅうにく|beef/gi,
      gelatin: /ゼラチン|gelatin/gi,
      sesame: /ごま|ゴマ|胡麻|sesame/gi,
      salmon: /さけ|サケ|鮭|salmon/gi,
      mackerel: /さば|サバ|鯖|mackerel/gi,
      soy: /大豆|だいず|ダイズ|soy|soybean/gi,
      chicken: /鶏肉|とりにく|チキン|chicken/gi,
      banana: /バナナ|banana/gi,
      pork: /豚肉|ぶたにく|ポーク|pork/gi,
      matsutake: /まつたけ|マツタケ|松茸|matsutake/gi,
      peach: /もも|モモ|桃|peach/gi,
      yam: /やまいも|ヤマイモ|山芋|yam/gi,
      apple: /りんご|リンゴ|林檎|apple/gi
    };

    const foundAllergies = [];
    const allergyDetails = [];

    // テキストからアレルギー成分を検出
    for (const [allergyId, pattern] of Object.entries(allergyPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        foundAllergies.push(allergyId);

        // 周辺テキストも抽出（文脈情報）
        const lines = text.split('\n');
        const relevantLines = lines.filter(line => pattern.test(line));

        allergyDetails.push({
          allergyId,
          matches: [...new Set(matches)], // 重複除去
          context: relevantLines,
          page: pageNum
        });
      }
    }

    // メニュー項目の検出
    const menuItems = this.extractMenuItems(text);
    // メニューごとのアレルギー推定（近接行と記号で推定）
    const menuAllergies = this.extractMenuAllergies(text);

    // 注意事項の検出
    const warnings = this.extractWarnings(text);

    return {
      foundAllergies: [...new Set(foundAllergies)],
      allergyDetails,
      menuItems,
      menuAllergies,
      warnings,
      rawText: text
    };
  }

  extractMenuItems(text) {
    const menuPatterns = [
      /.*寿司.*/gi,
      /.*刺身.*/gi,
      /.*ロール.*/gi,
      /.*うどん.*/gi,
      /.*そば.*/gi,
      /.*ラーメン.*/gi,
      /.*サラダ.*/gi,
      /.*デザート.*/gi,
      /.*ドリンク.*/gi
    ];

    const items = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.length > 2 && cleanLine.length < 50) {
        menuPatterns.forEach(pattern => {
          if (pattern.test(cleanLine)) {
            items.push(cleanLine);
          }
        });
      }
    });

    return [...new Set(items)];
  }

  // 近接行と記号（●, △, ※, －）からメニューごとのアレルギーを推定
  extractMenuAllergies(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const menus = [];
    const jpNames = {
      egg:'卵', milk:'乳', wheat:'小麦', buckwheat:'そば', peanut:'落花生', shrimp:'えび', crab:'かに', walnut:'くるみ',
      almond:'アーモンド', abalone:'あわび', squid:'いか', salmon_roe:'いくら', orange:'オレンジ', cashew:'カシューナッツ', kiwi:'キウイ', beef:'牛肉', gelatin:'ゼラチン', sesame:'ごま', salmon:'さけ', mackerel:'さば', soy:'大豆', chicken:'鶏肉', banana:'バナナ', pork:'豚肉', matsutake:'まつたけ', peach:'もも', yam:'やまいも', apple:'りんご'
    };
    const symbolRegex = {
      direct: /[●◉○]/, // ○も一部で含有表記に使われる場合があるため暫定
      trace: /[△※]/,
      none: /[－-]/
    };
    const isLikelyMenuName = (line) => {
      if (line.length < 2 || line.length > 30) return false;
      if (/^(アレルギー|注意|ご注意|注|原材料|成分|特定原材料|栄養|本日の|価格|税込)/.test(line)) return false;
      if (/^[A-Za-z0-9\s\-_.()]+$/.test(line)) return false; // 英数字のみは除外
      return /[\u3040-\u30ff\u4e00-\u9faf]/.test(line); // かな漢字を含む
    };

    let current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isLikelyMenuName(line)) {
        current = { name: line, allergies: {} };
        menus.push(current);
        continue;
      }
      if (current) {
        // 直近数行に記号と品目名の組合せがあれば拾う
        Object.entries(jpNames).forEach(([id, jp]) => {
          if (line.includes(jp)) {
            if (symbolRegex.trace.test(line)) {
              current.allergies[id] = current.allergies[id] || 'trace';
            }
            if (symbolRegex.direct.test(line)) {
              current.allergies[id] = 'direct';
            }
            if (symbolRegex.none.test(line)) {
              current.allergies[id] = current.allergies[id] || 'none';
            }
          }
        });
        // メニューのまとまりをゆるく区切る
        if (/^[-=＊*\u25FC]+$/u.test(line) || line.length === 0) {
          current = null;
        }
      }
    }
    // 後処理: 何も拾えていないメニューは除外
    return menus.filter(m => Object.keys(m.allergies).length > 0);
  }

  extractWarnings(text) {
    const warningPatterns = [
      /注意|ご注意|注|WARNING|CAUTION/gi,
      /アレルギー.*注意/gi,
      /製造.*同じ.*設備/gi,
      /コンタミネーション/gi,
      /cross.contamination/gi
    ];

    const warnings = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      warningPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          warnings.push(line.trim());
        }
      });
    });

    return [...new Set(warnings)];
  }

  consolidateAllergyInfo(results) {
    const allAllergies = new Set();
    const allMenuItems = new Set();
    const allWarnings = new Set();
    const allergyDetails = {};
    const menuAllergyMap = new Map(); // name -> {name, allergies: {id: presence}}

    results.forEach(result => {
      if (result.allergyInfo) {
        // アレルギー成分を統合
        result.allergyInfo.foundAllergies.forEach(allergy => {
          allAllergies.add(allergy);
        });

        // メニュー項目を統合
        result.allergyInfo.menuItems.forEach(item => {
          allMenuItems.add(item);
        });

        // 注意事項を統合
        result.allergyInfo.warnings.forEach(warning => {
          allWarnings.add(warning);
        });

        // 詳細情報を統合
        result.allergyInfo.allergyDetails.forEach(detail => {
          if (!allergyDetails[detail.allergyId]) {
            allergyDetails[detail.allergyId] = {
              matches: new Set(),
              contexts: [],
              pages: []
            };
          }

          detail.matches.forEach(match => {
            allergyDetails[detail.allergyId].matches.add(match);
          });
          allergyDetails[detail.allergyId].contexts.push(...detail.context);
          allergyDetails[detail.allergyId].pages.push(detail.page);
        });
        // メニューごとのアレルギーを統合
        (result.allergyInfo.menuAllergies || []).forEach(m => {
          const key = m.name;
          const existing = menuAllergyMap.get(key) || { name: key, allergies: {} };
          Object.entries(m.allergies).forEach(([id, presence]) => {
            const prev = existing.allergies[id];
            const rank = { direct: 3, heated: 2, trace: 1, none: 0 };
            if (!prev || rank[presence] > rank[prev]) existing.allergies[id] = presence;
          });
          menuAllergyMap.set(key, existing);
        });
      }
    });

    // Set を Array に変換
    Object.keys(allergyDetails).forEach(allergyId => {
      allergyDetails[allergyId].matches = Array.from(allergyDetails[allergyId].matches);
      allergyDetails[allergyId].contexts = [...new Set(allergyDetails[allergyId].contexts)];
      allergyDetails[allergyId].pages = [...new Set(allergyDetails[allergyId].pages)];
    });

    return {
      foundAllergies: Array.from(allAllergies),
      menuItems: Array.from(allMenuItems),
      warnings: Array.from(allWarnings),
      allergyDetails,
      menuAllergies: Array.from(menuAllergyMap.values()),
      confidence: this.calculateOverallConfidence(results)
    };
  }

  calculateOverallConfidence(results) {
    const validResults = results.filter(r => r.confidence && !r.error);
    if (validResults.length === 0) return 0;

    const totalConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0);
    return Math.round(totalConfidence / validResults.length);
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// シングルトンインスタンス
export const pdfOCRProcessor = new PDFOCRProcessor();