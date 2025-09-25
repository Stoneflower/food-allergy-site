import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'
import MultiImageUploader from './MultiImageUploader'
import { buildImageUrl } from '../utils/cloudflareImages'

const ProductAllergyManager = () => {
  const [products, setProducts] = useState([])
  const [allergyItems, setAllergyItems] = useState([])
  const [productAllergies, setProductAllergies] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showMultiUploader, setShowMultiUploader] = useState(false)
  
  // Cloudflare Images の設定（実際の運用時は環境変数から取得）
  const CF_ACCOUNT_HASH = process.env.REACT_APP_CF_ACCOUNT_HASH || 'your-account-hash'
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    barcode: '',
    image_id: null
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
      setNewProduct({ name: '', brand: '', category: '', description: '', barcode: '', image_id: null })
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
      // 加工品は原則「加熱済み相当」として扱うため、保存前に正規化
      let normalizedPresence = presenceType
      if (presenceType === 'processed') {
        normalizedPresence = 'heated'
        notes = (notes || '') + (notes ? ' ' : '') + '[processed_as_heated] 加工品は加熱済み相当として扱いました'
      }
      const { error } = await supabase
        .from('product_allergies')
        .insert([{
          product_id: productId,
          allergy_item_id: allergyItemId,
          presence_type: normalizedPresence,
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
      <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-900 text-sm">
        運用ルール: 成分表示の末尾に「香料」と記載がある場合は「香料程度（微量）」として登録してください。
      </div>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {showAddProduct ? 'キャンセル' : '商品を追加'}
        </button>
        <button
          onClick={() => setShowMultiUploader(!showMultiUploader)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          {showMultiUploader ? 'キャンセル' : '複数画像アップロード'}
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
          
          {/* 画像アップロード */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品画像（任意）
            </label>
            <ImageUpload
              onImageUploaded={(imageData) => {
                setNewProduct({...newProduct, image_id: imageData.imageId});
              }}
              onError={(error) => {
                console.error('画像アップロードエラー:', error);
                setMessage(`❌ 画像アップロードエラー: ${error.message}`);
              }}
              maxSizeMB={1}
              maxWidthOrHeight={1200}
              variant="w=800,q=75"
              showPreview={true}
            multiple={true}
            onImagesReordered={(images) => {
              // 並び順の変更を検知（必要ならサーバー保存やプレビュー反映に利用）
            }}
            />
          </div>
          
          <button
            onClick={addProduct}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            商品を追加
          </button>
        </div>
      )}

      {/* 複数画像アップローダー */}
      {showMultiUploader && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">複数画像アップロード</h3>
          <p className="text-sm text-gray-600 mb-4">
            最大3枚までの画像を選択して、一括でアップロードできます。
            商品IDを指定すると、自動的にSupabaseに保存されます。
          </p>
          <MultiImageUploader
            maxImages={3}
            maxSizeMB={0.5}
            maxWidthOrHeight={1024}
            accountHash={CF_ACCOUNT_HASH}
            variant="w=800,q=75"
            onUploadComplete={(uploadedImages) => {
              setMessage(`✅ ${uploadedImages.length}件の画像がアップロードされました`);
              setShowMultiUploader(false);
            }}
            onError={(error) => {
              setMessage(`❌ アップロードエラー: ${error.message}`);
            }}
          />
        </div>
      )}

      {/* 商品一覧 */}
      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex space-x-4">
                {/* 商品画像 */}
                <div className="flex-shrink-0">
                  {product.image_id ? (
                    <img
                      src={buildImageUrl({ 
                        accountHash: CF_ACCOUNT_HASH, 
                        imageId: product.image_id, 
                        variant: 'w=150,h=150,q=75' 
                      })}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center text-gray-400 text-xs ${product.image_id ? 'hidden' : 'flex'}`}
                  >
                    画像なし
                  </div>
                </div>
                
                {/* 商品情報 */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.brand} - {product.category}</p>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  )}
                  {product.barcode && (
                    <p className="text-xs text-gray-400 mt-1">バーコード: {product.barcode}</p>
                  )}
                </div>
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
    notes: '',
    fragrance_end: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const normalized = { ...formData }
    if (normalized.fragrance_end) {
      normalized.presence_type = 'trace'
      normalized.amount_level = 'trace'
      normalized.notes = (normalized.notes || '') + (normalized.notes ? ' ' : '') + '[fragrance_end] 成分末尾に香料表記あり'
    }
    onAdd(
      product.id,
      normalized.allergy_item_id,
      normalized.presence_type,
      normalized.amount_level,
      normalized.notes
    )
    setFormData({ allergy_item_id: '', presence_type: 'direct', amount_level: 'unknown', notes: '', fragrance_end: false })
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
              <option value="processed">加工済み（保存時に加熱済みに正規化）</option>
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
          <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={formData.fragrance_end}
              onChange={(e) => setFormData({...formData, fragrance_end: e.target.checked})}
            />
            成分表示の末尾に「香料」がある（自動で香料程度/微量として登録）
          </label>
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
