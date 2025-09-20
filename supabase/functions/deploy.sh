#!/bin/bash

# Supabase Edge Functions デプロイスクリプト

echo "🚀 Supabase Edge Functions デプロイ開始..."

# 1. データベースマイグレーション実行
echo "📊 データベースマイグレーション実行中..."
supabase db push

# 2. Edge Functions デプロイ
echo "⚡ Edge Functions デプロイ中..."

# ジョブ開始
echo "  - start-job デプロイ中..."
supabase functions deploy start-job

# ページ処理（Queue対応）
echo "  - process-pages デプロイ中..."
supabase functions deploy process-pages

# ジョブステータス確認
echo "  - job-status デプロイ中..."
supabase functions deploy job-status

# CSV生成
echo "  - csv-generator デプロイ中..."
supabase functions deploy csv-generator

# 3. 環境変数確認
echo "🔧 環境変数確認..."
echo "SUPABASE_URL: ${SUPABASE_URL:-未設定}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:-未設定}"

# 4. デプロイ完了
echo "✅ デプロイ完了！"
echo ""
echo "📋 利用可能なエンドポイント:"
echo "  - POST /functions/v1/start-job (ジョブ開始・Queue登録)"
echo "  - POST /functions/v1/process-pages (ページ処理実行)"
echo "  - GET  /functions/v1/job-status/{job_id} (進捗確認)"
echo "  - GET  /functions/v1/csv-generator/{job_id} (CSVダウンロード)"
echo ""
echo "🌐 フロントエンド: supabase-queue-frontend.html"
echo ""
echo "📖 使用方法:"
echo "  1. フロントエンドでPDFをアップロード"
echo "  2. ジョブ開始でQueueに登録"
echo "  3. ページ処理実行で並列処理開始"
echo "  4. 進捗をリアルタイムで確認"
echo "  5. 完了後にCSVをダウンロード"
