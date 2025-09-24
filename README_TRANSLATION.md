# DeepL API Free プラン対応 自動翻訳システム

## 🚀 **機能概要**

DeepL API Free プランを使用した手動翻訳と自動翻訳の併用システムです。

### **翻訳優先度**
1. **手動翻訳** (最優先)
2. **キャッシュされた自動翻訳** (2番目)
3. **DeepL API自動翻訳** (最後)

### **DeepL API Free プランの特徴**
- ✅ **月50万文字まで無料**
- ✅ **自動課金なし** (制限超過時は翻訳停止)
- ✅ **高精度翻訳** (食品・成分表に適している)
- ✅ **アレルギー関連用語に強い**
- ✅ **日本語⇔英語の高品質翻訳**

## 📋 **設定方法**

### 1. **DeepL API キーの設定**
```bash
# .env ファイルを作成
REACT_APP_DEEPL_API_KEY=your_deepl_api_key_here
```

### 2. **API キーの取得**
1. [DeepL API](https://www.deepl.com/ja/pro-api) にアクセス
2. 無料アカウントを作成
3. API キーを取得
4. `.env` ファイルに設定

## 🔧 **使用方法**

### **基本的な使用**
```jsx
import { useAutoTranslation } from '../hooks/useAutoTranslation';

const MyComponent = () => {
  const { t, addManualTranslation } = useAutoTranslation();
  
  // 翻訳を取得（手動→自動のフォールバック）
  const title = await t('home.hero.title');
  
  // 手動翻訳を追加
  addManualTranslation('home.hero.title', 'カスタムタイトル');
  
  return <h1>{title}</h1>;
};
```

### **ページ別キャッシュ戦略の使用**
```jsx
import { useAutoTranslation } from '../hooks/useAutoTranslation';

const HomePage = () => {
  const { t } = useAutoTranslation();
  
  // ページ別キャッシュ戦略を適用
  const title = await t('home.hero.title', { pageName: 'home' });
  // Homeページの翻訳は7日間キャッシュされます
  
  return <h1>{title}</h1>;
};

const SearchResultsPage = () => {
  const { t } = useAutoTranslation();
  
  // 検索結果ページはキャッシュなし（即座に変更を反映）
  const title = await t('search.results.title', { pageName: 'search-results' });
  
  return <h1>{title}</h1>;
};
```

### **一括翻訳（ページ別キャッシュ戦略対応）**
```jsx
const { translateBatch } = useAutoTranslation();

const keys = ['home.hero.title', 'home.hero.description', 'header.menu.upload'];
const translations = await translateBatch(keys, 'home'); // ページ名を指定
```

### **翻訳管理画面**
```jsx
import TranslationManager from '../components/TranslationManager';

// 管理画面に追加
<TranslationManager />
```

## 📅 **ページ別キャッシュ戦略**

### **設定されたキャッシュ戦略**
```javascript
const pageCacheStrategies = {
  'home': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
  'login': { duration: 30 * 24 * 60 * 60 * 1000, description: '低頻度修正（成分表）: 30日キャッシュ' },
  'upload': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
  'search-results': { duration: 0, description: '即時に変更をかけたい: キャッシュなし' },
  'contact': { duration: 30 * 24 * 60 * 60 * 1000, description: '低頻度修正（成分表）: 30日キャッシュ' },
  'about': { duration: 7 * 24 * 60 * 60 * 1000, description: '中頻度修正（商品名）: 7日キャッシュ' },
  'default': { duration: 7 * 24 * 60 * 60 * 1000, description: 'デフォルト: 7日キャッシュ' }
};
```

### **キャッシュ戦略の特徴**
- **🏠 Homeページ**: 7日キャッシュ（商品名など中頻度修正）
- **🔐 Loginページ**: 30日キャッシュ（低頻度修正）
- **📤 Uploadページ**: 7日キャッシュ（商品名など中頻度修正）
- **🔍 SearchResultsページ**: キャッシュなし（即座に変更を反映）
- **📞 Contactページ**: 30日キャッシュ（低頻度修正）
- **ℹ️ Aboutページ**: 7日キャッシュ（商品名など中頻度修正）

### **ページ別キャッシュ管理**
```javascript
const { clearPageCache, clearExpiredCache } = useAutoTranslation();

// 特定ページのキャッシュをクリア
clearPageCache('home');

// 期限切れキャッシュを一括クリア
clearExpiredCache();
```

### **キャッシュ統計の確認**
```javascript
const { translationStats } = useAutoTranslation();
console.log(translationStats.pageStats);
// {
//   'home': { count: 15, valid: 12, expired: 3, strategy: '中頻度修正（商品名）: 7日キャッシュ' },
//   'search-results': { count: 8, valid: 0, expired: 8, strategy: '即時に変更をかけたい: キャッシュなし' }
// }
```

## 🎯 **翻訳の優先度システム**

### **1. 手動翻訳が最優先**
```javascript
// 手動翻訳を追加
translationService.setManualTranslation('home.hero.title', 'カスタムタイトル', 'en');

// この翻訳は常に優先される
const result = await t('home.hero.title'); // "カスタムタイトル"
```

### **2. 自動翻訳はフォールバック**
```javascript
// 手動翻訳がない場合のみ自動翻訳が使用される
const result = await t('home.hero.title'); // Google翻訳の結果
```

### **3. キャッシュシステム**
- 一度翻訳された内容はキャッシュされる
- 手動翻訳を削除すると自動翻訳に戻る
- キャッシュクリアで強制的に再翻訳

## 🛠️ **管理機能**

### **翻訳統計**
```javascript
const { translationStats } = useAutoTranslation();
console.log(translationStats);
// { manual: 5, cached: 10, total: 15 }
```

### **手動翻訳一覧**
```javascript
const { getManualTranslations } = useAutoTranslation();
const manualTranslations = getManualTranslations();
```

### **キャッシュクリア**
```javascript
const { clearCache } = useAutoTranslation();
clearCache(); // 全キャッシュをクリア
```

## 🔄 **ワークフロー**

### **1. 初期設定**
1. Google Translate API キーを設定
2. 基本的な手動翻訳辞書を作成
3. 自動翻訳で不足分を補完

### **2. 運用中**
1. ユーザーが翻訳を確認
2. 不適切な翻訳を手動で修正
3. 手動翻訳が優先される

### **3. メンテナンス**
1. 翻訳管理画面で手動翻訳を編集
2. 不要な手動翻訳を削除
3. キャッシュをクリアして最新の自動翻訳を取得

## 💡 **ベストプラクティス**

### **手動翻訳を追加すべき場合**
- ブランド名や固有名詞
- 文化的に適切でない翻訳
- ユーザーフィードバックで指摘された翻訳

### **自動翻訳に任せる場合**
- 一時的なコンテンツ
- 頻繁に変更されるテキスト
- 基本的なUI要素

## 📊 **使用量監視機能**

### **使用量統計**
```javascript
const { usageStats } = useUsageMonitor();
console.log(usageStats);
// {
//   current: 125000,     // 現在の使用文字数
//   limit: 500000,       // 月間制限
//   remaining: 375000,   // 残り文字数
//   percentage: 25       // 使用率(%)
// }
```

### **使用量警告**
- 🟢 **0-60%**: 正常使用
- 🟡 **60-80%**: 注意レベル
- 🔴 **80-100%**: 警告レベル
- ⛔ **100%+**: 制限超過

### **使用量予測**
```javascript
const { getUsageProjection } = useUsageMonitor();
const projection = getUsageProjection();
// {
//   dailyAverage: 4166,        // 日平均使用量
//   projectedMonthly: 125000,  // 月間予測使用量
//   projectedRemaining: 104166, // 残り期間予測
//   willExceedLimit: false     // 制限超過予測
// }
```

## 🚨 **注意事項**

- **月間制限**: DeepL API Free は月50万文字まで
- **自動課金なし**: 制限超過時は翻訳停止のみ
- **翻訳品質**: 高精度だが、重要な部分は手動で確認推奨
- **パフォーマンス**: バックエンド経由で若干の遅延が発生

## 📊 **監視とメンテナンス**

### **翻訳品質の監視**
1. ユーザーフィードバックの収集
2. 翻訳統計の定期確認
3. 手動翻訳の見直し

### **使用量管理**
1. 月間使用量の監視（50万文字制限）
2. 使用量予測と警告システム
3. 手動翻訳の効果的な活用
4. キャッシュの効果的な活用
5. 不要な翻訳リクエストの削減

## 🎯 **アレルギー情報サービスでの活用**

### **翻訳対象**
- **UI文言**: ヘッダー、フッター、ボタンなどの固定テキスト
- **商品情報**: 商品名、成分表、注意書き
- **検索結果**: レストラン名、商品説明、アレルギー情報

### **翻訳品質の特徴**
- **食品専門用語**: 成分名、アレルゲン名に強い
- **自然な表現**: 注意書きや警告文の翻訳が自然
- **日英翻訳特化**: 日本語と英語間の高精度翻訳

### **運用方針**
1. **重要な安全情報**: 手動翻訳で確実性を担保
2. **一般的なUI**: 自動翻訳で効率化
3. **ユーザーフィードバック**: 不適切な翻訳を手動で修正
