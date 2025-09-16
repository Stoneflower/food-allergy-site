import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const UserAllergySettings = () => {
  const [allergyItems, setAllergyItems] = useState([])
  const [userSettings, setUserSettings] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId] = useState('user_' + Date.now()) // 簡易的なユーザーID

  // アレルギー品目データの取得
  const fetchAllergyItems = async () => {
    try {
      const { data, error } = await supabase
        .from('allergy_items')
        .select('*')
        .order('category', { ascending: false })
        .order('name')

      if (error) throw error
      setAllergyItems(data || [])
    } catch (error) {
      console.error('アレルギー品目取得エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  // ユーザー設定の取得
  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_allergy_settings')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      // 設定をオブジェクトに変換
      const settingsObj = {}
      data?.forEach(setting => {
        settingsObj[setting.allergy_item_id] = setting
      })
      setUserSettings(settingsObj)
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error)
    }
  }

  // 設定の保存
  const saveSetting = async (allergyItemId, setting) => {
    try {
      const { error } = await supabase
        .from('user_allergy_settings')
        .upsert({
          user_id: userId,
          allergy_item_id: allergyItemId,
          ...setting
        }, { onConflict: 'user_id,allergy_item_id' })

      if (error) throw error

      // ローカル状態を更新
      setUserSettings(prev => ({
        ...prev,
        [allergyItemId]: {
          ...prev[allergyItemId],
          ...setting
        }
      }))

      setMessage('✅ 設定を保存しました')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('設定保存エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  // 初期データ読み込み
  useEffect(() => {
    fetchAllergyItems()
    fetchUserSettings()
  }, [])

  const getSetting = (allergyItemId) => {
    return userSettings[allergyItemId] || {
      is_allergic: true,
      small_amount_ok: false,
      heated_ok: false,
      notes: ''
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">個人アレルギー設定</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        <p>各アレルギー品目について、あなたの状況に合わせて設定してください。</p>
        <p>「少量なら食べられる」「加熱してあれば食べられる」を選択できます。</p>
      </div>

      <div className="space-y-4">
        {allergyItems.map((item) => {
          const setting = getSetting(item.item_id)
          return (
            <div key={item.id} className={`p-4 border rounded-lg ${
              item.category === 'mandatory' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                      item.category === 'mandatory' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {item.category === 'mandatory' ? '法定8品目' : '推奨20品目'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* アレルギー有無 */}
                <div>
                  <label className="block text-sm font-medium mb-2">アレルギー</label>
                  <select
                    value={setting.is_allergic ? 'true' : 'false'}
                    onChange={(e) => saveSetting(item.item_id, { 
                      is_allergic: e.target.value === 'true',
                      small_amount_ok: e.target.value === 'false' ? false : setting.small_amount_ok,
                      heated_ok: e.target.value === 'false' ? false : setting.heated_ok
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="true">アレルギーあり</option>
                    <option value="false">アレルギーなし</option>
                  </select>
                </div>

                {/* 少量摂取 */}
                <div>
                  <label className="block text-sm font-medium mb-2">少量なら食べられる</label>
                  <select
                    value={setting.small_amount_ok ? 'true' : 'false'}
                    onChange={(e) => saveSetting(item.item_id, { 
                      small_amount_ok: e.target.value === 'true' 
                    })}
                    disabled={!setting.is_allergic}
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                  >
                    <option value="false">食べられない</option>
                    <option value="true">食べられる</option>
                  </select>
                </div>

                {/* 加熱済み */}
                <div>
                  <label className="block text-sm font-medium mb-2">加熱してあれば食べられる</label>
                  <select
                    value={setting.heated_ok ? 'true' : 'false'}
                    onChange={(e) => saveSetting(item.item_id, { 
                      heated_ok: e.target.value === 'true' 
                    })}
                    disabled={!setting.is_allergic}
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                  >
                    <option value="false">食べられない</option>
                    <option value="true">食べられる</option>
                  </select>
                </div>
              </div>

              {/* メモ */}
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">メモ</label>
                <textarea
                  value={setting.notes || ''}
                  onChange={(e) => saveSetting(item.item_id, { 
                    notes: e.target.value 
                  })}
                  placeholder="例：加熱温度は180度以上必要、香料程度なら問題なし など"
                  className="w-full p-2 border rounded h-16"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">設定の説明</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>アレルギーあり</strong>: その品目にアレルギーがある場合</li>
          <li>• <strong>少量なら食べられる</strong>: 香料程度の少量なら問題ない場合</li>
          <li>• <strong>加熱してあれば食べられる</strong>: 加熱処理済みなら問題ない場合</li>
          <li>• <strong>メモ</strong>: 具体的な条件や注意事項を記録</li>
        </ul>
      </div>
    </div>
  )
}

export default UserAllergySettings
