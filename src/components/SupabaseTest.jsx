import React, { useState, useEffect } from 'react'
import { supabase, testConnection } from '../lib/supabase'

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [customUrl, setCustomUrl] = useState('')
  const [customKey, setCustomKey] = useState('')
  const [useCustomCredentials, setUseCustomCredentials] = useState(false)

  // コンポーネントの初期化確認
  useEffect(() => {
    console.log('SupabaseTest component loaded')
    try {
      console.log('Supabase client:', supabase)
    } catch (err) {
      console.error('Supabase initialization error:', err)
      setError(err.message)
    }
  }, [])

  const handleTestConnection = async () => {
    setIsLoading(true)
    setConnectionStatus(null)
    
    try {
      let result
      if (useCustomCredentials && customUrl && customKey) {
        // カスタム認証情報でテスト
        const { createClient } = await import('@supabase/supabase-js')
        const customSupabase = createClient(customUrl, customKey)
        
        try {
          // より詳細な接続テスト
          console.log('Testing connection with URL:', customUrl)
          console.log('Testing connection with Key:', customKey.substring(0, 20) + '...')
          
          // まず、SupabaseのAPIエンドポイントが応答するかテスト
          try {
            const response = await fetch(`${customUrl}/rest/v1/`, {
              headers: {
                'apikey': customKey,
                'Authorization': `Bearer ${customKey}`
              }
            })
            
            if (response.ok) {
              console.log('Supabase API endpoint is responding')
            } else {
              console.log('Supabase API response status:', response.status)
            }
          } catch (fetchError) {
            console.log('Direct API test failed, trying table query:', fetchError.message)
          }
          
          // テーブルクエリテスト
          const { data, error } = await customSupabase.from('_test').select('*').limit(1)
          
          if (error) {
            console.error('Supabase error:', error)
            // 404エラーやテーブルが存在しないエラーは接続成功とみなす
            if (error.code === 'PGRST116' || 
                error.code === 'PGRST205' ||
                error.message.includes('404') || 
                error.message.includes('relation "_test" does not exist') ||
                error.message.includes('Could not find the table') ||
                error.message.includes('Failed to load resource: the server responded with a status of 404')) {
              result = { success: true, data: null, message: '✅ 接続成功！Supabaseとの接続は正常です（テストテーブルは存在しませんが、これは正常です）' }
            } else {
              throw error
            }
          } else {
            result = { success: true, data, message: '✅ 接続成功！カスタム認証情報での接続が正常に確立されました' }
          }
        } catch (error) {
          console.error('Connection test failed:', error)
          let errorMessage = error.message
          
          // エラーメッセージの詳細化
          if (error.message.includes('Invalid API key')) {
            errorMessage = 'APIキーが無効です。正しいanon keyを確認してください。'
          } else if (error.message.includes('Invalid URL')) {
            errorMessage = 'URLが無効です。正しいSupabaseプロジェクトURLを確認してください。'
          } else if (error.message.includes('Network')) {
            errorMessage = 'ネットワークエラーです。インターネット接続を確認してください。'
          } else if (error.message.includes('CORS')) {
            errorMessage = 'CORSエラーです。Supabaseプロジェクトの設定を確認してください。'
          }
          
          result = { success: false, error: errorMessage, details: error.message }
        }
      } else {
        // 通常の環境変数でテスト
        result = await testConnection()
      }
      
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({ 
        success: false, 
        error: error.message 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // エラーが発生した場合の表示
  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-red-50 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-red-800">エラーが発生しました</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          ページを再読み込み
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase接続テスト</h2>
      
      {/* カスタム認証情報の入力 */}
      <div className="mb-4">
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={useCustomCredentials}
            onChange={(e) => setUseCustomCredentials(e.target.checked)}
            className="mr-2"
          />
          カスタム認証情報を使用
        </label>
        
        {useCustomCredentials && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Supabase URL"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Supabase Anon Key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>
      
      <button
        onClick={handleTestConnection}
        disabled={isLoading || (useCustomCredentials && (!customUrl || !customKey))}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {isLoading ? 'テスト中...' : '接続テスト'}
      </button>

      {connectionStatus && (
        <div className={`p-4 rounded ${
          connectionStatus.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-bold mb-2">
            {connectionStatus.success ? '✅ 接続成功' : '❌ 接続失敗'}
          </h3>
          {connectionStatus.success ? (
            <div>
              <p>{connectionStatus.message || 'Supabaseとの接続が正常に確立されました。'}</p>
              {connectionStatus.data && (
                <p className="text-sm mt-2">データ: {JSON.stringify(connectionStatus.data)}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2">接続に失敗しました:</p>
              <p className="text-sm">{connectionStatus.error}</p>
              {connectionStatus.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">詳細なエラー情報</summary>
                  <p className="text-xs mt-1 bg-gray-100 p-2 rounded">{connectionStatus.details}</p>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Netlify環境設定:</strong></p>
        <p>Netlifyのダッシュボードで以下の環境変数を設定してください:</p>
        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
{`VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

または

REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_KEY=your_supabase_anon_key`}
        </pre>
        <p className="mt-2 text-xs">
          <strong>現在の環境変数:</strong><br/>
          URL: {import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '未設定'}<br/>
          Key: {import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_KEY ? '設定済み' : '未設定'}
        </p>
        
        <details className="mt-4">
          <summary className="cursor-pointer font-bold">よくある問題と解決方法</summary>
          <div className="mt-2 text-xs space-y-2">
            <div>
              <strong>1. URLの形式:</strong><br/>
              ✅ 正しい: https://your-project-id.supabase.co<br/>
              ❌ 間違い: https://supabase.com/dashboard/project/your-project-id
            </div>
            <div>
              <strong>2. APIキー:</strong><br/>
              ✅ anon/public keyを使用（eyJ...で始まる）<br/>
              ❌ service_role keyは使用しない
            </div>
            <div>
              <strong>3. プロジェクトの状態:</strong><br/>
              Supabaseプロジェクトが一時停止していないか確認
            </div>
            <div>
              <strong>4. ネットワーク:</strong><br/>
              ファイアウォールやプロキシの設定を確認
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default SupabaseTest
