import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const UserRegistration = ({ onRegistrationComplete }) => {
  const [step, setStep] = useState(1) // 1: 基本情報, 2: アレルギー選択, 3: 家族追加
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthYear: new Date().getFullYear() - 30, // デフォルト30歳
    isPrimaryUser: true
  })
  const [allergyItems, setAllergyItems] = useState([])
  const [selectedAllergies, setSelectedAllergies] = useState({})
  const [familyMembers, setFamilyMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  useEffect(() => {
    fetchAllergyItems()
  }, [])

  // 基本情報の保存
  const saveBasicInfo = async () => {
    if (!formData.name.trim()) {
      setMessage('名前を入力してください')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          birth_year: formData.birthYear,
          is_primary_user: formData.isPrimaryUser
        }])
        .select()

      if (error) throw error

      // 作成されたユーザーIDを保存
      setFormData(prev => ({ ...prev, id: data[0].id }))
      setStep(2)
      setMessage('')
    } catch (error) {
      console.error('ユーザー作成エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // アレルギー設定の保存
  const saveAllergySettings = async () => {
    setIsLoading(true)
    try {
      const allergySettings = Object.entries(selectedAllergies)
        .filter(([_, setting]) => setting.isAllergic)
        .map(([allergyItemId, setting]) => ({
          user_id: formData.id,
          allergy_item_id: allergyItemId,
          is_allergic: true,
          small_amount_ok: setting.smallAmountOk,
          heated_ok: setting.heatedOk,
          severity_level: setting.severityLevel,
          notes: setting.notes
        }))

      if (allergySettings.length > 0) {
        const { error } = await supabase
          .from('user_allergy_settings')
          .insert(allergySettings)

        if (error) throw error
      }

      setStep(3)
      setMessage('')
    } catch (error) {
      console.error('アレルギー設定保存エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 家族メンバー追加
  const addFamilyMember = () => {
    setFamilyMembers(prev => [...prev, {
      id: Date.now(),
      name: '',
      birthYear: new Date().getFullYear() - 10, // デフォルト10歳
      allergies: {}
    }])
  }

  // 家族メンバーのアレルギー設定保存
  const saveFamilyMembers = async () => {
    setIsLoading(true)
    try {
      for (const member of familyMembers) {
        if (!member.name.trim()) continue

        // 家族メンバーを作成
        const { data: memberData, error: memberError } = await supabase
          .from('family_members')
          .insert([{
            name: member.name,
            birth_year: member.birthYear,
            is_primary_user: false,
            parent_user_id: formData.id
          }])
          .select()

        if (memberError) throw memberError

        // 家族メンバーのアレルギー設定を保存
        const memberAllergySettings = Object.entries(member.allergies)
          .filter(([_, setting]) => setting.isAllergic)
          .map(([allergyItemId, setting]) => ({
            user_id: memberData[0].id,
            allergy_item_id: allergyItemId,
            is_allergic: true,
            small_amount_ok: setting.smallAmountOk,
            heated_ok: setting.heatedOk,
            severity_level: setting.severityLevel,
            notes: setting.notes
          }))

        if (memberAllergySettings.length > 0) {
          const { error: allergyError } = await supabase
            .from('user_allergy_settings')
            .insert(memberAllergySettings)

          if (allergyError) throw allergyError
        }
      }

      setMessage('✅ 登録が完了しました！')
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete(formData.id)
        }
      }, 2000)
    } catch (error) {
      console.error('家族メンバー保存エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAllergySetting = (allergyItemId, field, value) => {
    setSelectedAllergies(prev => ({
      ...prev,
      [allergyItemId]: {
        ...prev[allergyItemId],
        [field]: value
      }
    }))
  }

  const updateFamilyMemberAllergy = (memberId, allergyItemId, field, value) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === memberId 
        ? {
            ...member,
            allergies: {
              ...member.allergies,
              [allergyItemId]: {
                ...member.allergies[allergyItemId],
                [field]: value
              }
            }
          }
        : member
    ))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">会員登録</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* ステップ1: 基本情報 */}
      {step === 1 && (
        <div>
          <h3 className="text-xl font-bold mb-4">基本情報</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">お名前 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border rounded-lg"
                placeholder="山田太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">メールアドレス</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 border rounded-lg"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">生年</label>
              <select
                value={formData.birthYear}
                onChange={(e) => setFormData({...formData, birthYear: parseInt(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              >
                {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={saveBasicInfo}
            disabled={isLoading}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg"
          >
            {isLoading ? '保存中...' : '次へ'}
          </button>
        </div>
      )}

      {/* ステップ2: アレルギー選択 */}
      {step === 2 && (
        <div>
          <h3 className="text-xl font-bold mb-4">アレルギー設定</h3>
          <p className="text-sm text-gray-600 mb-6">
            アレルギーがある品目を選択し、少量摂取や加熱での安全性を設定してください。
          </p>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {allergyItems.map((item) => (
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
                      checked={selectedAllergies[item.item_id]?.isAllergic || false}
                      onChange={(e) => updateAllergySetting(item.item_id, 'isAllergic', e.target.checked)}
                      className="mr-2"
                    />
                    アレルギーあり
                  </label>
                </div>

                {selectedAllergies[item.item_id]?.isAllergic && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">少量なら食べられる</label>
                      <select
                        value={selectedAllergies[item.item_id]?.smallAmountOk ? 'true' : 'false'}
                        onChange={(e) => updateAllergySetting(item.item_id, 'smallAmountOk', e.target.value === 'true')}
                        className="w-full p-2 border rounded"
                      >
                        <option value="false">食べられない</option>
                        <option value="true">食べられる</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">加熱してあれば食べられる</label>
                      <select
                        value={selectedAllergies[item.item_id]?.heatedOk ? 'true' : 'false'}
                        onChange={(e) => updateAllergySetting(item.item_id, 'heatedOk', e.target.value === 'true')}
                        className="w-full p-2 border rounded"
                      >
                        <option value="false">食べられない</option>
                        <option value="true">食べられる</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">重症度</label>
                      <select
                        value={selectedAllergies[item.item_id]?.severityLevel || 'medium'}
                        onChange={(e) => updateAllergySetting(item.item_id, 'severityLevel', e.target.value)}
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
            ))}
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg"
            >
              戻る
            </button>
            <button
              onClick={saveAllergySettings}
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isLoading ? '保存中...' : '次へ'}
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: 家族追加 */}
      {step === 3 && (
        <div>
          <h3 className="text-xl font-bold mb-4">家族メンバーの追加（任意）</h3>
          <p className="text-sm text-gray-600 mb-6">
            お子様など、他の家族のアレルギー情報も登録できます。
          </p>

          <div className="space-y-6">
            {familyMembers.map((member) => (
              <div key={member.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">家族メンバー</h4>
                  <button
                    onClick={() => setFamilyMembers(prev => prev.filter(m => m.id !== member.id))}
                    className="text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="名前"
                    value={member.name}
                    onChange={(e) => setFamilyMembers(prev => prev.map(m => 
                      m.id === member.id ? {...m, name: e.target.value} : m
                    ))}
                    className="p-2 border rounded"
                  />
                  <select
                    value={member.birthYear}
                    onChange={(e) => setFamilyMembers(prev => prev.map(m => 
                      m.id === member.id ? {...m, birthYear: parseInt(e.target.value)} : m
                    ))}
                    className="p-2 border rounded"
                  >
                    {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                </div>

                {/* 家族メンバーのアレルギー設定 */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allergyItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <span>{item.icon}</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={member.allergies[item.item_id]?.isAllergic || false}
                          onChange={(e) => updateFamilyMemberAllergy(member.id, item.item_id, 'isAllergic', e.target.checked)}
                          className="mr-2"
                        />
                        アレルギーあり
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addFamilyMember}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg"
            >
              家族メンバーを追加
            </button>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg"
            >
              戻る
            </button>
            <button
              onClick={saveFamilyMembers}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isLoading ? '登録中...' : '登録完了'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRegistration
