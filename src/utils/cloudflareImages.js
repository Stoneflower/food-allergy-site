import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

// 署名URLを取得（Netlify Function経由）
export async function getDirectUploadUrl() {
  const res = await fetch('/.netlify/functions/cf-images-sign-upload', { method: 'POST' });
  if (!res.ok) throw new Error('failed_to_get_signed_url');
  return res.json();
}

// 商品ID付きで署名URLを取得（Netlify Function経由）
export async function getUploadUrl(productId) {
  const res = await fetch(`/.netlify/functions/cf-images-sign-upload?productId=${productId}`, { 
    method: 'POST' 
  });
  if (!res.ok) throw new Error('署名付きURL取得失敗');
  return res.json(); // { uploadURL, id }
}

// 画像をCloudflare Imagesにアップロード
export async function uploadToCloudflareImages(file) {
  const { uploadURL, id } = await getDirectUploadUrl();
  const form = new FormData();
  form.append('file', file);
  const up = await fetch(uploadURL, { method: 'POST', body: form });
  if (!up.ok) throw new Error('upload_failed');
  return { imageId: id };
}

// 画像圧縮→アップロードの高レベル関数
export async function compressAndUpload(file, { maxSizeMB = 1, maxWidthOrHeight = 1600, onProgress } = {}) {
  const compressed = await imageCompression(file, { 
    maxSizeMB, 
    maxWidthOrHeight, 
    useWebWorker: true,
    onProgress 
  });
  return uploadToCloudflareImages(compressed);
}

// 変換付きの配信URLを生成
export function buildImageUrl({ accountHash, imageId, variant = 'public' }) {
  // variantに代わって、Imagesの変換パラメータ指定（w=,q= など）も可
  // 例: `/${imageId}/w=800,q=75` を使う場合は variant をその文字列に
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

// Supabaseに画像URLを保存（商品テーブル用）
export async function saveImageUrlToSupabase(productId, imageId, imageUrl) {
  const { error } = await supabase
    .from('products')
    .update({ 
      image_id: imageId,
      image_url: imageUrl 
    })
    .eq('id', productId);
  
  if (error) throw error;
}

// Supabaseに画像URLを保存（メニューアイテムテーブル用）
export async function saveImageUrlToMenuItems(menuItemId, imageId, imageUrl) {
  const { error } = await supabase
    .from('menu_items')
    .update({ 
      image_id: imageId,
      image_url: imageUrl 
    })
    .eq('id', menuItemId);
  
  if (error) throw error;
}

// 複数画像の一括アップロード
export async function uploadMultipleImages(files, { 
  productId = null, 
  maxSizeMB = 0.5, 
  maxWidthOrHeight = 1024,
  accountHash = null,
  variant = 'public'
} = {}) {
  const results = [];
  
  for (const file of files) {
    try {
      // 1. 画像を圧縮
      const compressedFile = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
      });

      // 2. Cloudflare Images へアップロード
      const result = await compressAndUpload(compressedFile, { 
        maxSizeMB: 1, 
        maxWidthOrHeight: 1600 
      });

      // 3. 表示用URL生成
      const displayUrl = buildImageUrl({ 
        accountHash, 
        imageId: result.imageId, 
        variant 
      });

      // 4. 商品IDがある場合はSupabaseに保存
      if (productId) {
        await saveImageUrlToSupabase(productId, result.imageId, displayUrl);
      }

      results.push({
        file,
        imageId: result.imageId,
        url: displayUrl,
        uploadedAt: new Date()
      });

    } catch (error) {
      console.error('画像アップロードエラー:', error);
      results.push({
        file,
        error: error.message,
        uploadedAt: new Date()
      });
    }
  }
  
  return results;
}




