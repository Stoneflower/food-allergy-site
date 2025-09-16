import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SimpleProductDisplay = ({ userId }) => {
  const [products, setProducts] = useState([])
  const [safetyResults, setSafetyResults] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 商品データと安全性判定結果の取得
  const fetchProducts = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // 商品データ取得
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_allergies (
            *,
            allergy_items (name, icon, category)
          )
        `)
        .order('name')

      if (productsError) throw productsError

      // 安全性判定結果取得
      const { data: safetyData, error: safetyError } = await supabase
        .from('product_safety_results')
        .select('*')
        .eq('user_id', userId)

      if (safetyError) throw safetyError

      setProducts(productsData || [])

      // 安全性結果をオブジェクトに変換
      const safetyObj = {}
      safetyData?.forEach(result => {
        safetyObj[result.product_id] = result
      })
      setSafetyResults(safetyObj)

    } catch (error) {
      console.error('商品データ取得エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 安全性判定の実行
  const checkProductSafety = async (product) => {
    if (!userId) return

    try {
      // ユーザーのアレルギー設定を取得
      const { data: userAllergies, error: allergyError } = await supabase
        .from('user_allergy_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_allergic', true)

      if (allergyError) throw allergyError

      let isSafe = true
      let warningLevel = 'none'
      let reasons = []

      // 各アレルギー品目について安全性をチェック
      for (const userAllergy of userAllergies) {
        const productAllergy = product.product_allergies?.find(
          pa => pa.allergy_item_id === userAllergy.allergy_item_id
        )

        if (productAllergy) {
          // アレルギー品目が含まれている場合
          if (productAllergy.presence_type === 'direct') {
            // 直接含有の場合は危険
            isSafe = false
            warningLevel = 'danger'
            reasons.push(`${productAllergy.allergy_items.name}が直接含有されています`)
          } else if (productAllergy.presence_type === 'trace') {
            // 香料程度の場合
            if (!userAllergy.small_amount_ok) {
              isSafe = false
              warningLevel = 'warning'
              reasons.push(`${productAllergy.allergy_items.name}が香料程度（成分末尾の香料を含む）で含まれています`)
            } else {
              warningLevel = warningLevel === 'none' ? 'caution' : warningLevel
              reasons.push(`${productAllergy.allergy_items.name}が香料程度（成分末尾の香料を含む）で含まれています（少量なら問題なし）`)
            }
          } else if (productAllergy.presence_type === 'heated' || productAllergy.presence_type === 'processed') {
            // 加熱済みの場合
            // 加工品は原則加熱済みとして扱う
            const treatedAsHeated = true
            if (!userAllergy.heated_ok) {
              isSafe = false
              warningLevel = 'warning'
              reasons.push(`${productAllergy.allergy_items.name}が${productAllergy.presence_type === 'processed' ? '加工品（加熱済み相当）' : '加熱済み'}で含まれています`)
            } else {
              warningLevel = warningLevel === 'none' ? 'caution' : warningLevel
              reasons.push(`${productAllergy.allergy_items.name}が${productAllergy.presence_type === 'processed' ? '加工品（加熱済み相当）' : '加熱済み'}で含まれています（加熱に問題なければ可）`)
            }
          }
        }
      }

      // 安全性判定結果を保存
      const { error: saveError } = await supabase
        .from('product_safety_results')
        .upsert({
          user_id: userId,
          product_id: product.id,
          is_safe: isSafe,
          warning_level: warningLevel,
          reason: reasons.join('; ')
        }, { onConflict: 'user_id,product_id' })

      if (saveError) throw saveError

      // ローカル状態を更新
      setSafetyResults(prev => ({
        ...prev,
        [product.id]: {
          is_safe: isSafe,
          warning_level: warningLevel,
          reason: reasons.join('; ')
        }
      }))

    } catch (error) {
      console.error('安全性判定エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [userId])

  const getSafetyDisplay = (productId) => {
    const result = safetyResults[productId]
    if (!result) return { text: '未確認', color: 'bg-gray-100 text-gray-800' }

    if (result.is_safe) {
      return { text: '✅ 安全', color: 'bg-green-100 text-green-800' }
    } else {
      const colors = {
        'caution': 'bg-yellow-100 text-yellow-800',
        'warning': 'bg-orange-100 text-orange-800',
        'danger': 'bg-red-100 text-red-800'
      }
      return { 
        text: '⚠️ 注意', 
        color: colors[result.warning_level] || 'bg-red-100 text-red-800' 
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">商品一覧</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">商品データを読み込み中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const safety = getSafetyDisplay(product.id)
            return (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${safety.color}`}>
                    {safety.text}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                {product.description && (
                  <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                )}

                {/* アレルギー情報（簡潔表示） */}
                {product.product_allergies && product.product_allergies.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">アレルギー情報:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.product_allergies.map((pa) => (
                        <span key={pa.id} className={`text-xs px-2 py-1 rounded ${
                          pa.allergy_items.category === 'mandatory' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pa.allergy_items.icon} {pa.allergy_items.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => checkProductSafety(product)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded"
                >
                  安全性を確認
                </button>

                {/* 安全性判定の詳細 */}
                {safetyResults[product.id] && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium">判定理由:</p>
                    <p className="text-gray-600">{safetyResults[product.id].reason}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {products.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          商品が登録されていません。
        </div>
      )}
    </div>
  )
}

export default SimpleProductDisplay
