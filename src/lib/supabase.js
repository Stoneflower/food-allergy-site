import { createClient } from '@supabase/supabase-js'

// Netlifyの環境変数から取得（VITE_プレフィックス付き）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_KEY

// 環境変数の確認（開発時のみ）
if (import.meta.env.DEV && (!supabaseUrl || !supabaseKey)) {
  console.warn('Supabaseの環境変数が設定されていません。')
  console.warn('Netlifyの環境設定で以下を設定してください:')
  console.warn('- VITE_SUPABASE_URL または REACT_APP_SUPABASE_URL')
  console.warn('- VITE_SUPABASE_ANON_KEY または REACT_APP_SUPABASE_KEY')
}

// Supabaseクライアントの作成（エラーハンドリング付き）
let supabase = null

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized successfully')
  } else {
    console.warn('Supabase environment variables not set')
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
}

export { supabase }

// 接続テスト用の関数
export const testConnection = async () => {
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabaseクライアントが初期化されていません。環境変数を確認してください。' 
    }
  }

  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // テーブルが存在しないエラーは無視
      throw error
    }
    console.log('Supabase接続成功:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Supabase接続エラー:', error)
    return { success: false, error: error.message }
  }
}
