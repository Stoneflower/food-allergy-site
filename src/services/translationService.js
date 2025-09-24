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

  // 翻訳を取得（手動→自動の順でフォールバック）
  async getTranslation(key, targetLanguage, sourceLanguage = 'ja') {
    const cacheKey = `${key}_${targetLanguage}`;
    
    // 1. 手動翻訳をチェック
    if (this.manualTranslations.has(cacheKey)) {
      const manual = this.manualTranslations.get(cacheKey);
      console.log(`📝 Using manual translation for ${key} in ${targetLanguage}`);
      return manual.translation;
    }

    // 2. キャッシュをチェック
    if (this.cache.has(cacheKey)) {
      console.log(`💾 Using cached translation for ${key} in ${targetLanguage}`);
      return this.cache.get(cacheKey);
    }

    // 3. 自動翻訳を実行
    try {
      const translation = await this.autoTranslate(key, targetLanguage, sourceLanguage);
      this.cache.set(cacheKey, translation);
      console.log(`🤖 Using auto translation for ${key} in ${targetLanguage}`);
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
      'en': 'EN',
      'zh': 'ZH',
      'ko': 'KO',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'ar': 'AR',
      'he': 'HE'
    };
    return langMap[langCode] || 'EN';
  }

  // 一括翻訳
  async translateBatch(keys, targetLanguage, sourceLanguage = 'ja') {
    const translations = {};
    
    for (const key of keys) {
      try {
        translations[key] = await this.getTranslation(key, targetLanguage, sourceLanguage);
      } catch (error) {
        console.error(`Failed to translate ${key}:`, error);
        translations[key] = key; // フォールバック
      }
    }
    
    return translations;
  }

  // 翻訳統計を取得
  getTranslationStats() {
    const stats = {
      manual: this.manualTranslations.size,
      cached: this.cache.size,
      total: this.manualTranslations.size + this.cache.size,
      usage: {
        current: this.usageCount,
        limit: this.monthlyLimit,
        remaining: this.monthlyLimit - this.usageCount,
        percentage: Math.round((this.usageCount / this.monthlyLimit) * 100)
      }
    };
    return stats;
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
