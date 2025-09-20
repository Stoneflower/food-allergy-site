# Supabase Edge Functions - 非同期PDF処理システム

## 🎯 概要

Tesseract + OpenCV + Supabase Edge Functionsを使用した、大規模PDF対応の非同期アレルギー情報抽出システムです。

## ✨ 主な機能

- **非同期処理**: ページ単位で並列処理、60秒制限を回避
- **高精度OCR**: OpenCV + Tesseractで表構造を正確に認識
- **リアルタイム進捗**: 処理状況をリアルタイムで表示
- **データ永続化**: 処理結果をSupabase DBに保存
- **大規模PDF対応**: 20ページ以上のPDFも安定処理

## 🏗️ アーキテクチャ

```
ブラウザ
 ├─ PDFアップロード
 ├─ 非同期処理開始
 ├─ リアルタイム進捗表示
 └─ CSVダウンロード

Supabase Edge Functions
 ├─ pdf-processor-advanced (メイン処理)
 ├─ job-status (進捗確認)
 └─ csv-generator (CSV生成)

Supabase Database
 ├─ pdf_jobs (ジョブ管理)
 ├─ pdf_pages (ページ処理結果)
 └─ allergy_extractions (アレルギー情報)
```

## 📁 ファイル構成

```
supabase/
├── migrations/
│   └── 20250120000001_create_pdf_processing_tables.sql
├── functions/
│   ├── pdf-processor-advanced/
│   │   ├── index.js
│   │   └── package.json
│   ├── job-status/
│   │   ├── index.js
│   │   └── package.json
│   ├── csv-generator/
│   │   ├── index.js
│   │   └── package.json
│   ├── deploy.sh
│   └── README.md
├── config.toml
└── README.md
```

## 🚀 デプロイ手順

### 1. 前提条件

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトを初期化
supabase init

# Supabaseにログイン
supabase login
```

### 2. データベース設定

```bash
# マイグレーション実行
supabase db push

# ローカル開発環境起動（オプション）
supabase start
```

### 3. Edge Functions デプロイ

```bash
# 個別デプロイ
supabase functions deploy pdf-processor-advanced
supabase functions deploy job-status
supabase functions deploy csv-generator

# または一括デプロイ
./supabase/functions/deploy.sh
```

### 4. 環境変数設定

Supabase Dashboardで以下の環境変数を設定：

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 データベーススキーマ

### pdf_jobs テーブル
| カラム | 型 | 説明 |
|--------|----|----|
| id | UUID | ジョブID |
| user_id | UUID | ユーザーID |
| file_name | TEXT | ファイル名 |
| file_size | BIGINT | ファイルサイズ |
| total_pages | INTEGER | 総ページ数 |
| completed_pages | INTEGER | 完了ページ数 |
| status | TEXT | ステータス |
| created_at | TIMESTAMP | 作成日時 |

### pdf_pages テーブル
| カラム | 型 | 説明 |
|--------|----|----|
| id | UUID | ページID |
| job_id | UUID | ジョブID |
| page_number | INTEGER | ページ番号 |
| json_data | JSONB | 処理結果データ |
| status | TEXT | ステータス |
| processing_time_ms | INTEGER | 処理時間 |

### allergy_extractions テーブル
| カラム | 型 | 説明 |
|--------|----|----|
| id | UUID | 抽出ID |
| job_id | UUID | ジョブID |
| menu_name | TEXT | メニュー名 |
| allergies | JSONB | アレルギー情報 |
| confidence_score | FLOAT | OCR信頼度 |

## 🔧 API エンドポイント

### 1. PDF処理開始
```
POST /functions/v1/pdf-processor-advanced
Content-Type: multipart/form-data

Parameters:
- pdf: PDFファイル
- max_pages: 最大ページ数（デフォルト: 20）
- user_id: ユーザーID（オプション）

Response:
{
  "job_id": "uuid",
  "total_pages": 20,
  "status": "processing"
}
```

### 2. 進捗確認
```
GET /functions/v1/job-status/{job_id}

Response:
{
  "job_id": "uuid",
  "status": "processing",
  "total_pages": 20,
  "completed_pages": 15,
  "progress": 75.0,
  "extracted_items": 150
}
```

### 3. CSVダウンロード
```
GET /functions/v1/csv-generator/{job_id}

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="allergy_data.csv"
```

## 🎨 フロントエンド

`supabase-async-frontend.html` を使用：

- ドラッグ&ドロップ対応
- リアルタイム進捗表示
- 非同期処理対応
- CSVダウンロード

## ⚡ パフォーマンス

### 処理能力
- **ページ数**: 最大50ページ（推奨: 20ページ）
- **実行時間**: 60秒制限内
- **並列処理**: ページ単位で非同期実行
- **メモリ使用量**: 128MB制限内

### 最適化ポイント
- DPI設定: 200（精度と速度のバランス）
- セル検出: OpenCVによる高精度検出
- OCR設定: Tesseract高精度モード
- 非同期処理: ページ単位での並列実行

## 🔍 アレルギー28品目

1. 卵 2. 乳 3. 小麦 4. えび 5. かに 6. そば 7. 落花生 8. クルミ 9. アーモンド 10. あわび
11. いか 12. いくら 13. オレンジ 14. カシューナッツ 15. キウイフルーツ 16. 牛肉 17. ごま 18. さけ 19. さば 20. 大豆
21. 鶏肉 22. バナナ 23. 豚肉 24. もも 25. やまいも 26. りんご 27. ゼラチン 28. マカダミアナッツ

## 🛠️ 開発・デバッグ

### ローカル開発

```bash
# ローカル環境起動
supabase start

# Edge Functions ローカル実行
supabase functions serve pdf-processor-advanced
supabase functions serve job-status
supabase functions serve csv-generator
```

### ログ確認

```bash
# デプロイされた関数のログ
supabase functions logs pdf-processor-advanced
supabase functions logs job-status
supabase functions logs csv-generator
```

### エラーハンドリング

- **400**: リクエストエラー（PDFファイル未指定など）
- **404**: ジョブが見つからない
- **500**: サーバーエラー（処理中にエラーが発生）

## 📈 スケーラビリティ

### 無料枠での運用
- **Edge Functions**: 500,000回/月
- **Database**: 500MB
- **Storage**: 1GB

### 大規模運用時の考慮点
- ページ単位での非同期処理
- データベースインデックス最適化
- ストレージ使用量の監視
- エラーハンドリングの強化

## 🔮 今後の拡張予定

- [ ] OpenCV.jsを使用したブラウザ側処理
- [ ] リアルタイム通知システム
- [ ] バッチ処理機能
- [ ] 多言語対応の拡張
- [ ] カスタムアレルギー項目の追加
- [ ] 処理結果の可視化

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. Supabase CLIのバージョン
2. 環境変数の設定
3. データベースマイグレーションの実行
4. Edge Functionsのログ

## 📄 ライセンス

MIT License
