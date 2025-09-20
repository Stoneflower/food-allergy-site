# Supabase Edge Functions - PDF → CSV 変換

## 概要

PDFファイルからアレルギー情報を抽出し、CSV形式で出力するSupabase Edge Functionsです。

## 機能

- **PDF → 画像変換**: pdf2picを使用
- **表のセル検出**: Sharpを使用した画像処理
- **OCR処理**: Tesseract.jsで日本語・英語対応
- **アレルギー情報解析**: 28品目のアレルギー情報を自動抽出
- **CSV出力**: 構造化されたCSVファイル生成
- **複数ページ対応**: 20ページ以上の大規模PDFにも対応

## ファイル構成

```
supabase/functions/
├── pdf-csv-converter/          # 単一ページ処理版
│   ├── index.js
│   └── package.json
├── pdf-csv-converter-multi/    # 複数ページ処理版
│   ├── index.js
│   └── package.json
└── README.md
```

## 使用方法

### 1. 単一ページ処理版

```bash
# Edge Functionをデプロイ
supabase functions deploy pdf-csv-converter

# ローカルでテスト
supabase functions serve pdf-csv-converter
```

### 2. 複数ページ処理版（推奨）

```bash
# Edge Functionをデプロイ
supabase functions deploy pdf-csv-converter-multi

# ローカルでテスト
supabase functions serve pdf-csv-converter-multi
```

### 3. フロントエンドからの呼び出し

```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('max_pages', '20');

const response = await fetch('/functions/v1/pdf-csv-converter-multi', {
  method: 'POST',
  body: formData
});

const csvBlob = await response.blob();
```

## パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `pdf` | File | ✅ | PDFファイル |
| `store_name` | string | ❌ | 店舗名（デフォルト: "PDF Import"） |
| `store_region` | string | ❌ | 出店地域 |
| `source_url` | string | ❌ | 情報元URL |
| `store_url` | string | ❌ | 店舗情報URL |
| `max_pages` | number | ❌ | 最大ページ数（デフォルト: 20） |

## 制限事項

- **実行時間**: 60秒（Supabase Edge Functions制限）
- **メモリ**: 128MB
- **ファイルサイズ**: 50MB以下
- **ページ数**: 最大50ページ（推奨: 20ページ以下）

## アレルギー28品目

1. 卵
2. 乳
3. 小麦
4. えび
5. かに
6. そば
7. 落花生
8. クルミ
9. アーモンド
10. あわび
11. いか
12. いくら
13. オレンジ
14. カシューナッツ
15. キウイフルーツ
16. 牛肉
17. ごま
18. さけ
19. さば
20. 大豆
21. 鶏肉
22. バナナ
23. 豚肉
24. もも
25. やまいも
26. りんご
27. ゼラチン
28. マカダミアナッツ

## エラーハンドリング

- **400**: リクエストエラー（PDFファイル未指定など）
- **500**: サーバーエラー（処理中にエラーが発生）

## 開発・デバッグ

### ローカル開発

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトを初期化
supabase init

# ローカルでEdge Functionsを起動
supabase functions serve

# 特定の関数のみ起動
supabase functions serve pdf-csv-converter-multi
```

### ログ確認

```bash
# デプロイされた関数のログを確認
supabase functions logs pdf-csv-converter-multi
```

## パフォーマンス最適化

- **DPI設定**: 150（高速化のため）
- **セル検出**: グリッド状分割（8列×15行）
- **OCR制限**: 最大40セル/ページ
- **メモリ管理**: 一時ファイルの自動削除

## 今後の拡張予定

- [ ] OpenCV.jsを使用した高精度な表検出
- [ ] 非同期ジョブ処理（大規模PDF対応）
- [ ] リアルタイム進捗表示
- [ ] 複数言語対応の拡張
- [ ] カスタムアレルギー項目の追加
