import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ProductAllergyManager = () => {
  const [products, setProducts] = useState([])
  const [allergyItems, setAllergyItems] = useState([])
  const [productAllergies, setProductAllergies] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    barcode: ''
  })

  // データ取得
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 商品データ取得
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (productsError) throw productsError

      // アレルギー品目データ取得
      const { data: allergyData, error: allergyError } = await supabase
        .from('allergy_items')
        .select('*')
        .order('name')

      if (allergyError) throw allergyError

      // 商品アレルギー情報取得
      const { data: productAllergyData, error: productAllergyError } = await supabase
        .from('product_allergies')
        .select(`
          *,
          allergy_items (name, icon, category)
        `)

      if (productAllergyError) throw productAllergyError

      setProducts(productsData || [])
      setAllergyItems(allergyData || [])

      // 商品アレルギー情報を商品IDごとにグループ化
      const groupedAllergies = {}
      productAllergyData?.forEach(pa => {
        if (!groupedAllergies[pa.product_id]) {
          groupedAllergies[pa.product_id] = []
        }
        groupedAllergies[pa.product_id].push(pa)
      })
      setProductAllergies(groupedAllergies)

    } catch (error) {
      console.error('データ取得エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 商品追加
  const addProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()

      if (error) throw error

      setMessage('✅ 商品を追加しました')
      setNewProduct({ name: '', brand: '', category: '', description: '', barcode: '' })
      setShowAddProduct(false)
      fetchData()
    } catch (error) {
      console.error('商品追加エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  // 商品アレルギー情報追加
  const addProductAllergy = async (productId, allergyItemId, presenceType, amountLevel, notes) => {
    try {
      const { error } = await supabase
        .from('product_allergies')
        .insert([{
          product_id: productId,
          allergy_item_id: allergyItemId,
          presence_type: presenceType,
          amount_level: amountLevel,
          notes: notes
        }])

      if (error) throw error

      setMessage('✅ アレルギー情報を追加しました')
      fetchData()
    } catch (error) {
      console.error('アレルギー情報追加エラー:', error)
      setMessage(`❌ エラー: ${error.message}`)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getPresenceTypeLabel = (type) => {
    const labels = {
      'direct': '直接含有',
      'trace': '香料程度',
      'heated': '加熱済み',
      'processed': '加工済み'
    }
    return labels[type] || type
  }

  const getAmountLevelLabel = (level) => {
    const labels = {
      'high': '多量',
      'medium': '中量',
      'low': '少量',
      'trace': '微量',
      'unknown': '不明'
    }
    return labels[level] || level
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">商品アレルギー情報管理</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {showAddProduct ? 'キャンセル' : '商品を追加'}
        </button>
      </div>

      {/* 商品追加フォーム */}
      {showAddProduct && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">新しい商品を追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="商品名"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="ブランド名"
              value={newProduct.brand}
              onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="カテゴリ"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="バーコード"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
              className="p-2 border rounded"
            />
          </div>
          <textarea
            placeholder="商品説明"
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            className="w-full p-2 border rounded mt-4 h-20"
          />
          <button
            onClick={addProduct}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            商品を追加
          </button>
        </div>
      )}

      {/* 商品一覧 */}
      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.brand} - {product.category}</p>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                )}
              </div>
              <ProductAllergyForm 
                product={product}
                allergyItems={allergyItems}
                onAdd={addProductAllergy}
              />
            </div>

            {/* アレルギー情報表示 */}
            {productAllergies[product.id] && productAllergies[product.id].length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">アレルギー情報:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {productAllergies[product.id].map((pa) => (
                    <div key={pa.id} className={`p-2 rounded text-sm ${
                      pa.allergy_items.category === 'mandatory' 
                        ? 'bg-red-100 border border-red-200' 
                        : 'bg-yellow-100 border border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span>{pa.allergy_items.icon}</span>
                        <span className="font-medium">{pa.allergy_items.name}</span>
                      </div>
                      <div className="text-xs mt-1">
                        <span className="font-medium">{getPresenceTypeLabel(pa.presence_type)}</span>
                        {pa.amount_level !== 'unknown' && (
                          <span className="ml-2">({getAmountLevelLabel(pa.amount_level)})</span>
                        )}
                      </div>
                      {pa.notes && (
                        <div className="text-xs text-gray-600 mt-1">{pa.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          商品が登録されていません。まず商品を追加してください。
        </div>
      )}
    </div>
  )
}

// 商品アレルギー情報追加フォーム
const ProductAllergyForm = ({ product, allergyItems, onAdd }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    allergy_item_id: '',
    presence_type: 'direct',
    amount_level: 'unknown',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(product.id, formData.allergy_item_id, formData.presence_type, formData.amount_level, formData.notes)
    setFormData({ allergy_item_id: '', presence_type: 'direct', amount_level: 'unknown', notes: '' })
    setShowForm(false)
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
      >
        {showForm ? 'キャンセル' : 'アレルギー情報追加'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2 p-3 border rounded bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
              value={formData.allergy_item_id}
              onChange={(e) => setFormData({...formData, allergy_item_id: e.target.value})}
              className="p-1 border rounded text-sm"
              required
            >
              <option value="">アレルギー品目を選択</option>
              {allergyItems.map(item => (
                <option key={item.id} value={item.item_id}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>

            <select
              value={formData.presence_type}
              onChange={(e) => setFormData({...formData, presence_type: e.target.value})}
              className="p-1 border rounded text-sm"
            >
              <option value="direct">直接含有</option>
              <option value="trace">香料程度</option>
              <option value="heated">加熱済み</option>
              <option value="processed">加工済み</option>
            </select>

            <select
              value={formData.amount_level}
              onChange={(e) => setFormData({...formData, amount_level: e.target.value})}
              className="p-1 border rounded text-sm"
            >
              <option value="unknown">不明</option>
              <option value="high">多量</option>
              <option value="medium">中量</option>
              <option value="low">少量</option>
              <option value="trace">微量</option>
            </select>

            <input
              type="text"
              placeholder="詳細情報"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="p-1 border rounded text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
          >
            追加
          </button>
        </form>
      )}
    </div>
  )
}

export default ProductAllergyManager
