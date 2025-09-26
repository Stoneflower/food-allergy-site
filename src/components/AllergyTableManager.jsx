import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AllergyTableManager = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [allergyItems, setAllergyItems] = useState([])
  const [showItems, setShowItems] = useState(false)

  // テーブル作成
  const createAllergyTable = async () => {
    setIsCreating(true)
    setMessage('')
    
    try {
      // SQLファイルの内容を読み込み
      const response = await fetch('/src/database/allergy-schema.sql')
      const sqlContent = await response.text()
      
      // SQLを実行（実際にはSupabaseのSQL Editorで実行する必要があります）
      setMessage('SQLスクリプトを準備しました。SupabaseのSQL Editorで実行してください。')
      
      // 代わりに、JavaScriptでテーブルを作成
      await createTableWithData()
      
    } catch (error) {
      console.error('テーブル作成エラー:', error)
      setMessage(`エラー: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // JavaScriptでテーブルとデータを作成
  const createTableWithData = async () => {
    try {
      // テーブル作成
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS allergy_items (
            id SERIAL PRIMARY KEY,
            item_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            name_en VARCHAR(100),
            category VARCHAR(20) NOT NULL,
            icon VARCHAR(10),
            description TEXT,
            small_amount_safe BOOLEAN DEFAULT false,
            heated_safe BOOLEAN DEFAULT false,
            severity_level VARCHAR(20) DEFAULT 'medium',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })

      if (createError) {
        console.log('テーブル作成エラー（既に存在する可能性）:', createError.message)
      }

      // データ挿入
      const allergyData = [
        // 法定8品目
        { item_id: 'egg', name: '卵', name_en: 'Egg', category: 'mandatory', icon: '🥚', description: '鶏卵、うずら卵など', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'milk', name: '乳', name_en: 'Milk', category: 'mandatory', icon: '🥛', description: '牛乳、乳製品など', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'wheat', name: '小麦', name_en: 'Wheat', category: 'mandatory', icon: '🌾', description: '小麦粉、パン、麺類など', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'buckwheat', name: 'そば', name_en: 'Buckwheat', category: 'mandatory', icon: '🍜', description: 'そば粉、そば麺など', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'peanut', name: '落花生', name_en: 'Peanut', category: 'mandatory', icon: '🥜', description: 'ピーナッツ、ピーナッツバターなど', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'shrimp', name: 'えび', name_en: 'Shrimp', category: 'mandatory', icon: '🦐', description: 'エビ、クルマエビ、ブラックタイガーなど', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'crab', name: 'かに', name_en: 'Crab', category: 'mandatory', icon: '🦀', description: 'カニ、ズワイガニ、タラバガニなど', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        { item_id: 'walnut', name: 'くるみ', name_en: 'Walnut', category: 'mandatory', icon: '🌰', description: 'クルミ、ウォルナッツなど', small_amount_safe: false, heated_safe: false, severity_level: 'high' },
        
        // 推奨20品目
        { item_id: 'almond', name: 'アーモンド', name_en: 'Almond', category: 'recommended', icon: '🌰', description: 'アーモンド、アーモンドミルクなど', small_amount_safe: true, heated_safe: false, severity_level: 'medium' },
        { item_id: 'abalone', name: 'あわび', name_en: 'Abalone', category: 'recommended', icon: '🐚', description: 'アワビ、フルーツ貝など', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'squid', name: 'いか', name_en: 'Squid', category: 'recommended', icon: '🦑', description: 'イカ、スルメイカ、ヤリイカなど', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'salmon_roe', name: 'いくら', name_en: 'Salmon Roe', category: 'recommended', icon: '🍣', description: 'イクラ、サケの卵など', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'orange', name: 'オレンジ', name_en: 'Orange', category: 'recommended', icon: '🍊', description: 'オレンジ、オレンジジュースなど', small_amount_safe: true, heated_safe: true, severity_level: 'low' },
        { item_id: 'cashew', name: 'カシューナッツ', name_en: 'Cashew', category: 'recommended', icon: '🌰', description: 'カシューナッツ、カシューバターなど', small_amount_safe: true, heated_safe: false, severity_level: 'medium' },
        { item_id: 'kiwi', name: 'キウイフルーツ', name_en: 'Kiwi', category: 'recommended', icon: '🥝', description: 'キウイフルーツ、キウイジュースなど', small_amount_safe: true, heated_safe: true, severity_level: 'low' },
        { item_id: 'beef', name: '牛肉', name_en: 'Beef', category: 'recommended', icon: '🥩', description: '牛肉、ビーフジャーキーなど', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'walnut_other', name: 'くるみ', name_en: 'Walnut (Other)', category: 'recommended', icon: '🌰', description: 'クルミ以外のナッツ類', small_amount_safe: true, heated_safe: false, severity_level: 'medium' },
        { item_id: 'gelatin', name: 'ゼラチン', name_en: 'Gelatin', category: 'recommended', icon: '🍮', description: 'ゼラチン、コラーゲンなど', small_amount_safe: false, heated_safe: true, severity_level: 'low' },
        { item_id: 'salmon', name: 'さけ', name_en: 'Salmon', category: 'recommended', icon: '🐟', description: 'サケ、サーモンなど', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'mackerel', name: 'さば', name_en: 'Mackerel', category: 'recommended', icon: '🐟', description: 'サバ、サバの味噌煮など', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'soybean', name: '大豆', name_en: 'Soybean', category: 'recommended', icon: '🫘', description: '大豆、豆腐、味噌、醤油など', small_amount_safe: true, heated_safe: true, severity_level: 'medium' },
        { item_id: 'chicken', name: '鶏肉', name_en: 'Chicken', category: 'recommended', icon: '🍗', description: '鶏肉、チキンなど', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'banana', name: 'バナナ', name_en: 'Banana', category: 'recommended', icon: '🍌', description: 'バナナ、バナナジュースなど', small_amount_safe: true, heated_safe: true, severity_level: 'low' },
        { item_id: 'pork', name: '豚肉', name_en: 'Pork', category: 'recommended', icon: '🥓', description: '豚肉、ハム、ベーコンなど', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'matsutake', name: 'まつたけ', name_en: 'Matsutake', category: 'recommended', icon: '🍄', description: 'マツタケ、松茸など', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'peach', name: 'もも', name_en: 'Peach', category: 'recommended', icon: '🍑', description: 'モモ、桃ジュースなど', small_amount_safe: true, heated_safe: true, severity_level: 'low' },
        { item_id: 'yam', name: 'やまいも', name_en: 'Yam', category: 'recommended', icon: '🍠', description: 'ヤマイモ、長芋、自然薯など', small_amount_safe: false, heated_safe: false, severity_level: 'medium' },
        { item_id: 'apple', name: 'りんご', name_en: 'Apple', category: 'recommended', icon: '🍎', description: 'リンゴ、リンゴジュースなど', small_amount_safe: true, heated_safe: true, severity_level: 'low' }
      ]

      // データを挿入
      const { data, error } = await supabase
        .from('allergy_items')
        .upsert(allergyData, { onConflict: 'item_id' })

      if (error) {
        throw error
      }

      setMessage('✅ アレルギー28品目のテーブルとデータが正常に作成されました！')
      
    } catch (error) {
      console.error('データ作成エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  // データ取得
  const fetchAllergyItems = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('allergy_items')
        .select('*')
        .order('category', { ascending: false })
        .order('name')

      if (error) throw error
      
      setAllergyItems(data || [])
      setShowItems(true)
    } catch (error) {
      console.error('データ取得エラー:', error)
      setMessage(`❌ データ取得エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">アレルギー28品目テーブル管理</h2>
      
      <div className="space-y-4 mb-6">
        <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">
          運用ルール: 成分表示の末尾に「香料」と記載がある場合は「香料程度（微量）」として登録してください。加工品は原則「加熱済み」として登録してください。
        </div>
        <button
          onClick={createAllergyTable}
          disabled={isCreating}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mr-4"
        >
          {isCreating ? '作成中...' : 'テーブル作成'}
        </button>
        
        <button
          onClick={fetchAllergyItems}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? '読み込み中...' : 'データ表示'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {showItems && allergyItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">アイコン</th>
                <th className="border border-gray-300 px-4 py-2">品目名</th>
                <th className="border border-gray-300 px-4 py-2">カテゴリ</th>
                <th className="border border-gray-300 px-4 py-2">少量安全</th>
                <th className="border border-gray-300 px-4 py-2">加熱安全</th>
                <th className="border border-gray-300 px-4 py-2">危険度</th>
                <th className="border border-gray-300 px-4 py-2">説明</th>
              </tr>
            </thead>
            <tbody>
              {allergyItems.map((item) => (
                <tr key={item.id} className={item.category === 'mandatory' ? 'bg-red-50' : 'bg-yellow-50'}>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.icon}</td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{item.name}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.category === 'mandatory' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {item.category === 'mandatory' ? '法定8品目' : '推奨20品目'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.small_amount_safe ? '✅' : '❌'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.heated_safe ? '✅' : '❌'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.severity_level === 'high' 
                        ? 'bg-red-200 text-red-800'
                        : item.severity_level === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {item.severity_level === 'high' ? '高' : item.severity_level === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showItems && allergyItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          データが見つかりません。まず「テーブル作成」ボタンをクリックしてください。
        </div>
      )}
    </div>
  )
}

export default AllergyTableManager
