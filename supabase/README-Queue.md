# Supabase Queue - 非同期PDF処理システム

## 🎯 概要

Queue + 並列処理構成で、Render無料枠とSupabase Edge Functionsの制限を完全に回避するPDF処理システムです。

## ✨ 主な機能

- **Queue処理**: ページ単位でQueueに登録、並列処理で高速化
- **並列実行**: 3-5ページ同時処理で無料枠制限内で最適化
- **詳細進捗**: Queue状況、処理時間、エラー詳細を表示
- **エラー回復**: 失敗したページのみ再実行可能
- **大規模PDF対応**: 20ページ以上のPDFも安定処理

## 🏗️ アーキテクチャ

```
ブラウザ
 ├─ PDFアップロード
 ├─ ジョブ開始 → Queue登録
 ├─ ページ処理実行 → 並列処理
 ├─ リアルタイム進捗表示
 └─ CSVダウンロード

Supabase Edge Functions
 ├─ start-job (ジョブ開始・Queue登録)
 ├─ process-pages (並列ページ処理)
 ├─ job-status (進捗確認)
 └─ csv-generator (CSV生成)

Supabase Database
 ├─ pdf_jobs (ジョブ管理)
 ├─ pdf_page_queue (ページQueue)
 ├─ pdf_pages (ページ処理結果)
 └─ allergy_extractions (アレルギー情報)
```

## 📁 ファイル構成

```
supabase/
├── migrations/
│   ├── 20250120000001_create_pdf_processing_tables.sql
│   └── 20250120000002_create_page_queue_table.sql
├── functions/
│   ├── start-job/
│   │   ├── index.js
│   │   └── package.json
│   ├── process-pages/
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
├── README.md
└── README-Queue.md
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
supabase functions deploy start-job
supabase functions deploy process-pages
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

### pdf_page_queue テーブル（新規）
| カラム | 型 | 説明 |
|--------|----|----|
| id | UUID | Queue ID |
| job_id | UUID | ジョブID |
| page_number | INTEGER | ページ番号 |
| pdf_page_path | TEXT | ページ画像パス |
| status | TEXT | ステータス |
| processing_started_at | TIMESTAMP | 処理開始時刻 |
| processing_completed_at | TIMESTAMP | 処理完了時刻 |

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

### 1. ジョブ開始・Queue登録
```
POST /functions/v1/start-job
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

### 2. ページ処理実行
```
POST /functions/v1/process-pages
Headers:
- x-parallel-count: 並列処理数（デフォルト: 3）

Response:
{
  "message": "Pages processed",
  "processed_count": 3,
  "successful_count": 3,
  "failed_count": 0,
  "total_processing_time_ms": 15000
}
```

### 3. 進捗確認
```
GET /functions/v1/job-status/{job_id}

Response:
{
  "job_id": "uuid",
  "status": "processing",
  "total_pages": 20,
  "completed_pages": 15,
  "progress": 75.0,
  "extracted_items": 150,
  "queue_stats": {
    "total": 20,
    "pending": 5,
    "processing": 0,
    "completed": 15,
    "error": 0
  }
}
```

### 4. CSVダウンロード
```
GET /functions/v1/csv-generator/{job_id}

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="allergy_data.csv"
```

## 🎨 フロントエンド

`supabase-queue-frontend.html` を使用：

- ドラッグ&ドロップ対応
- ジョブ開始・Queue登録
- ページ処理実行（並列数調整可能）
- リアルタイム進捗表示（Queue統計含む）
- CSVダウンロード

## ⚡ パフォーマンス

### 無料枠制限対応
| 制限 | 対策 |
|------|------|
| **Render**: 512MB RAM, 60秒制限 | ページ単位Queue処理 |
| **Supabase Edge Functions**: 60秒制限 | 3-5ページ並列処理 |
| **ファイルサイズ**: 10MB制限 | アップロード時チェック |
| **ページ数**: 最大50ページ | 設定可能な上限 |

### 並列処理数の目安
| 処理内容 | 推奨並列数 | 理由 |
|----------|------------|------|
| Tesseract OCR + OpenCV | 3-5ページ | CPU負荷が高い |
| PDF→画像変換 | 5ページ以内 | メモリ使用量 |
| CSV結合 | 1回だけ | 最終処理 |

### 処理フロー
```
1. PDFアップロード → ジョブ作成
2. PDF→画像変換 → Queue登録
3. ページ処理実行 → 3-5ページ並列処理
4. OpenCVで表セル検出
5. TesseractでOCR実行
6. アレルギー情報解析
7. 結果をDBに保存
8. Queue進捗更新
9. 全ページ完了後にCSV生成
10. ダウンロードリンク提供
```

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
supabase functions serve start-job
supabase functions serve process-pages
supabase functions serve job-status
supabase functions serve csv-generator
```

### ログ確認

```bash
# デプロイされた関数のログ
supabase functions logs start-job
supabase functions logs process-pages
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
- ページ単位でのQueue処理
- 並列処理数の調整
- データベースインデックス最適化
- エラーページの再実行機能

## 🔮 今後の拡張予定

- [ ] 自動スケーリング（負荷に応じた並列数調整）
- [ ] バッチ処理機能（複数PDF同時処理）
- [ ] リアルタイム通知システム
- [ ] 処理結果の可視化
- [ ] カスタムアレルギー項目の追加

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. Supabase CLIのバージョン
2. 環境変数の設定
3. データベースマイグレーションの実行
4. Edge Functionsのログ
5. Queue処理の状況

## 📄 ライセンス

MIT License
