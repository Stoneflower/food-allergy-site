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
      // PDFファイルを読み込み
      const response = await fetch(pdfUrl);
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
      onProgress = null
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
          // ページを画像に変換（WebContainer対応）
          const canvas = await this.renderPageToCanvas(pdf, pageNum, scale);

          // OCRでテキストを抽出
          const ocrResult = await this.worker.recognize(canvas);

          // アレルギー情報を解析
          const allergyInfo = this.extractAllergyInfo(ocrResult.data.text, pageNum);

          results.push({
            page: pageNum,
            text: ocrResult.data.text,
            allergyInfo,
            confidence: ocrResult.data.confidence || 0
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

    // 注意事項の検出
    const warnings = this.extractWarnings(text);

    return {
      foundAllergies: [...new Set(foundAllergies)],
      allergyDetails,
      menuItems,
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