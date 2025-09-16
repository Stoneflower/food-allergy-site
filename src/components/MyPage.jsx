import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MyPage = ({ userId }) => {
  const [user, setUser] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [allergyItems, setAllergyItems] = useState([])
  const [userAllergies, setUserAllergies] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'allergies', 'family'

  // データ取得
  const fetchData = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // ユーザー情報取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // 家族メンバー取得
      const { data: familyData, error: familyError } = await supabase
        .from('users')
        .select('*')
        .eq('parent_user_id', userId)

      if (familyError) throw familyError

      // アレルギー品目取得
      const { data: allergyData, error: allergyError } = await supabase
        .from('allergy_items')
        .select('*')
        .order('name')

      if (allergyError) throw allergyError

      // ユーザーのアレルギー設定取得
      const { data: userAllergyData, error: userAllergyError } = await supabase
        .from('user_allergy_settings')
        .select('*')
        .eq('user_id', userId)

      if (userAllergyError) throw userAllergyError

      setUser(userData)
      setFamilyMembers(familyData || [])
      setAllergyItems(allergyData || [])

      // アレルギー設定をオブジェクトに変換
      const allergyObj = {}
      userAllergyData?.forEach(setting => {
        allergyObj[setting.allergy_item_id] = setting
      })
      setUserAllergies(allergyObj)

    } catch (error) {
      console.error('データ取得エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userId])

  // アレルギー設定の更新
  const updateAllergySetting = async (allergyItemId, updates) => {
    try {
      const existingSetting = userAllergies[allergyItemId]
      
      if (existingSetting) {
        // 既存の設定を更新
        const { error } = await supabase
          .from('user_allergy_settings')
          .update(updates)
          .eq('id', existingSetting.id)

        if (error) throw error
      } else {
        // 新しい設定を作成
        const { error } = await supabase
          .from('user_allergy_settings')
          .insert([{
            user_id: userId,
            allergy_item_id: allergyItemId,
            ...updates
          }])

        if (error) throw error
      }

      // ローカル状態を更新
      setUserAllergies(prev => ({
        ...prev,
        [allergyItemId]: {
          ...prev[allergyItemId],
          ...updates
        }
      }))

      setMessage('✅ 設定を更新しました')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('設定更新エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  // 家族メンバー追加
  const addFamilyMember = async (memberData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: memberData.name,
          birth_year: memberData.birthYear,
          is_primary_user: false,
          parent_user_id: userId
        }])
        .select()

      if (error) throw error

      setFamilyMembers(prev => [...prev, data[0]])
      setMessage('✅ 家族メンバーを追加しました')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('家族メンバー追加エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  const getSetting = (allergyItemId) => {
    return userAllergies[allergyItemId] || {
      is_allergic: false,
      small_amount_ok: false,
      heated_ok: false,
      severity_level: 'medium',
      notes: ''
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <p className="text-gray-500">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">マイページ</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          プロフィール
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'allergies' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          アレルギー設定
        </button>
        <button
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'family' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          家族管理
        </button>
      </div>

      {/* プロフィールタブ */}
      {activeTab === 'profile' && (
        <div>
          <h3 className="text-xl font-bold mb-4">プロフィール情報</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">お名前</label>
              <p className="p-3 bg-gray-100 rounded-lg">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">メールアドレス</label>
              <p className="p-3 bg-gray-100 rounded-lg">{user.email || '未設定'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">年齢</label>
              <p className="p-3 bg-gray-100 rounded-lg">
                {user.birth_year ? new Date().getFullYear() - user.birth_year : '未設定'}歳
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">登録日</label>
              <p className="p-3 bg-gray-100 rounded-lg">
                {new Date(user.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* アレルギー設定タブ */}
      {activeTab === 'allergies' && (
        <div>
          <h3 className="text-xl font-bold mb-4">アレルギー設定</h3>
          <p className="text-sm text-gray-600 mb-6">
            アレルギーの改善や変化があった場合は、こちらで設定を更新できます。
          </p>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
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
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.is_allergic}
                        onChange={(e) => updateAllergySetting(item.item_id, { 
                          is_allergic: e.target.checked,
                          small_amount_ok: e.target.checked ? setting.small_amount_ok : false,
                          heated_ok: e.target.checked ? setting.heated_ok : false
                        })}
                        className="mr-2"
                      />
                      アレルギーあり
                    </label>
                  </div>

                  {setting.is_allergic && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">少量なら食べられる</label>
                        <select
                          value={setting.small_amount_ok ? 'true' : 'false'}
                          onChange={(e) => updateAllergySetting(item.item_id, { 
                            small_amount_ok: e.target.value === 'true' 
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="false">食べられない</option>
                          <option value="true">食べられる</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">加熱してあれば食べられる</label>
                        <select
                          value={setting.heated_ok ? 'true' : 'false'}
                          onChange={(e) => updateAllergySetting(item.item_id, { 
                            heated_ok: e.target.value === 'true' 
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="false">食べられない</option>
                          <option value="true">食べられる</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">重症度</label>
                        <select
                          value={setting.severity_level}
                          onChange={(e) => updateAllergySetting(item.item_id, { 
                            severity_level: e.target.value 
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="low">軽度</option>
                          <option value="medium">中度</option>
                          <option value="high">重度</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 家族管理タブ */}
      {activeTab === 'family' && (
        <div>
          <h3 className="text-xl font-bold mb-4">家族管理</h3>
          <p className="text-sm text-gray-600 mb-6">
            家族のアレルギー情報を管理できます。
          </p>

          <div className="space-y-4">
            {familyMembers.map((member) => (
              <div key={member.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{member.name}</h4>
                    <p className="text-sm text-gray-600">
                      {member.birth_year ? new Date().getFullYear() - member.birth_year : '年齢不明'}歳
                    </p>
                  </div>
                  <button className="text-blue-500 hover:text-blue-700">
                    アレルギー設定を編集
                  </button>
                </div>
              </div>
            ))}

            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg">
              家族メンバーを追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPage
