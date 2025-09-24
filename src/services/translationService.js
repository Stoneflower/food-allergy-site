// DeepL API Free プラン対応の自動翻訳サービス
class TranslationService {
  constructor() {
    this.apiKey = process.env.REACT_APP_DEEPL_API_KEY;
    this.baseUrl = '/api/translate'; // バックエンド経由でDeepL APIを呼び出し
    this.cache = new Map(); // 翻訳結果のキャッシュ
    this.manualTranslations = new Map(); // 手動翻訳の優先度管理
    
    // DeepL API Free プランの制限
    this.monthlyLimit = 500000; // 月50万文字
    this.usageCount = 0; // 使用文字数カウンター

    // ページ別キャッシュ戦略の設定
    this.pageCacheStrategies = {
      'home': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
      'login': { duration: 30 * 24 * 60 * 60 * 1000, description: '低頻度修正（成分表）: 30日キャッシュ' },
      'upload': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
      'search-results': { duration: 0, description: '即時に変更をかけたい: キャッシュなし' },
      'contact': { duration: 30 * 24 * 60 * 60 * 1000, description: '低頻度修正（成分表）: 30日キャッシュ' },
      'about': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
      'default': { duration: 7 * 24 * 60 * 60 * 1000, description: 'デフォルト: 7日キャッシュ' }
    };
  }

  // 翻訳の優先度を設定
  setManualTranslation(key, translation, language) {
    const cacheKey = `${key}_${language}`;
    this.manualTranslations.set(cacheKey, {
      translation,
      priority: 'manual',
      timestamp: Date.now()
    });
  }

  // 手動翻訳を削除（自動翻訳に戻す）
  removeManualTranslation(key, language) {
    const cacheKey = `${key}_${language}`;
    this.manualTranslations.delete(cacheKey);
    this.cache.delete(cacheKey); // キャッシュもクリア
  }

  // ページ別キャッシュ戦略を取得
  getPageCacheStrategy(pageName) {
    return this.pageCacheStrategies[pageName] || this.pageCacheStrategies['default'];
  }

  // キャッシュが有効かどうかをチェック
  isCacheValid(cacheKey, pageName) {
    const strategy = this.getPageCacheStrategy(pageName);
    
    // キャッシュなしの場合は常に無効
    if (strategy.duration === 0) {
      return false;
    }

    const cachedData = this.cache.get(cacheKey);
    if (!cachedData || typeof cachedData !== 'object') {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - cachedData.timestamp;
    return cacheAge < strategy.duration;
  }

  // 翻訳を取得（手動→自動の順でフォールバック、ページ別キャッシュ戦略適用）
  async getTranslation(key, targetLanguage, sourceLanguage = 'ja', pageName = 'default') {
    const cacheKey = `${key}_${targetLanguage}`;
    
    // 1. 手動翻訳をチェック
    if (this.manualTranslations.has(cacheKey)) {
      const manual = this.manualTranslations.get(cacheKey);
      console.log(`📝 Using manual translation for ${key} in ${targetLanguage}`);
      return manual.translation;
    }

    // 2. ページ別キャッシュ戦略を適用してキャッシュをチェック
    if (this.cache.has(cacheKey) && this.isCacheValid(cacheKey, pageName)) {
      const cachedData = this.cache.get(cacheKey);
      console.log(`💾 Using cached translation for ${key} in ${targetLanguage} (page: ${pageName})`);
      return cachedData.translation;
    }

    // 3. 自動翻訳を実行
    try {
      const translation = await this.autoTranslate(key, targetLanguage, sourceLanguage);
      
      // ページ別キャッシュ戦略に基づいてキャッシュに保存
      const strategy = this.getPageCacheStrategy(pageName);
      if (strategy.duration > 0) {
        this.cache.set(cacheKey, {
          translation,
          timestamp: Date.now(),
          pageName,
          strategy: strategy.description
        });
        console.log(`🤖 Using auto translation for ${key} in ${targetLanguage} (cached for ${strategy.description})`);
      } else {
        console.log(`🤖 Using auto translation for ${key} in ${targetLanguage} (no cache - ${strategy.description})`);
      }
      
      return translation;
    } catch (error) {
      console.error(`❌ Translation failed for ${key}:`, error);
      // フォールバック: 元のテキストを返す
      return key;
    }
  }

  // DeepL API呼び出し（バックエンド経由）
  async autoTranslate(text, targetLanguage, sourceLanguage = 'JA') {
    if (!this.apiKey) {
      console.warn('⚠️ DeepL API key not found');
      return text; // APIキーがない場合は元のテキストを返す
    }

    // 月間使用量をチェック
    if (this.usageCount + text.length > this.monthlyLimit) {
      console.warn('⚠️ DeepL API monthly limit exceeded');
      return text; // 制限を超えた場合は元のテキストを返す
    }

    // DeepL API用の言語コード変換
    const deeplSourceLang = this.convertToDeeplLangCode(sourceLanguage);
    const deeplTargetLang = this.convertToDeeplLangCode(targetLanguage);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_lang: deeplSourceLang,
        target_lang: deeplTargetLang
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepL API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // 使用文字数をカウント
    this.usageCount += text.length;
    
    return data.translations[0].text;
  }

  // 言語コードをDeepL API用に変換
  convertToDeeplLangCode(langCode) {
    const langMap = {
      'ja': 'JA',
      'en': 'EN'
    };
    return langMap[langCode] || 'EN';
  }

  // 一括翻訳（ページ別キャッシュ戦略対応）
  async translateBatch(keys, targetLanguage, sourceLanguage = 'ja', pageName = 'default') {
    const translations = {};
    
    for (const key of keys) {
      try {
        translations[key] = await this.getTranslation(key, targetLanguage, sourceLanguage, pageName);
      } catch (error) {
        console.error(`Failed to translate ${key}:`, error);
        translations[key] = key; // フォールバック
      }
    }
    
    return translations;
  }

  // 翻訳統計を取得（ページ別キャッシュ情報含む）
  getTranslationStats() {
    const pageStats = {};
    const now = Date.now();
    
    // ページ別キャッシュ統計を計算
    for (const [cacheKey, cachedData] of this.cache.entries()) {
      if (typeof cachedData === 'object' && cachedData.pageName) {
        const pageName = cachedData.pageName;
        if (!pageStats[pageName]) {
          pageStats[pageName] = {
            count: 0,
            valid: 0,
            expired: 0,
            strategy: this.getPageCacheStrategy(pageName).description
          };
        }
        
        pageStats[pageName].count++;
        
        if (this.isCacheValid(cacheKey, pageName)) {
          pageStats[pageName].valid++;
        } else {
          pageStats[pageName].expired++;
        }
      }
    }

    const stats = {
      manual: this.manualTranslations.size,
      cached: this.cache.size,
      total: this.manualTranslations.size + this.cache.size,
      pageStats,
      usage: {
        current: this.usageCount,
        limit: this.monthlyLimit,
        remaining: this.monthlyLimit - this.usageCount,
        percentage: Math.round((this.usageCount / this.monthlyLimit) * 100)
      }
    };
    return stats;
  }

  // ページ別キャッシュをクリア
  clearPageCache(pageName) {
    let clearedCount = 0;
    for (const [cacheKey, cachedData] of this.cache.entries()) {
      if (typeof cachedData === 'object' && cachedData.pageName === pageName) {
        this.cache.delete(cacheKey);
        clearedCount++;
      }
    }
    console.log(`🗑️ Cleared ${clearedCount} cached translations for page: ${pageName}`);
    return clearedCount;
  }

  // 期限切れキャッシュをクリア
  clearExpiredCache() {
    let clearedCount = 0;
    const now = Date.now();
    
    for (const [cacheKey, cachedData] of this.cache.entries()) {
      if (typeof cachedData === 'object' && cachedData.pageName) {
        const strategy = this.getPageCacheStrategy(cachedData.pageName);
        if (strategy.duration > 0) {
          const cacheAge = now - cachedData.timestamp;
          if (cacheAge >= strategy.duration) {
            this.cache.delete(cacheKey);
            clearedCount++;
          }
        }
      }
    }
    
    console.log(`🗑️ Cleared ${clearedCount} expired cached translations`);
    return clearedCount;
  }

  // 使用量をリセット（月次リセット用）
  resetUsageCount() {
    this.usageCount = 0;
    console.log('📅 DeepL API usage count reset');
  }

  // キャッシュをクリア
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Translation cache cleared');
  }

  // 手動翻訳一覧を取得
  getManualTranslations() {
    return Array.from(this.manualTranslations.entries()).map(([key, data]) => ({
      key,
      ...data
    }));
  }
}

// シングルトンインスタンス
export const translationService = new TranslationService();
export default translationService;
