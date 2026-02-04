import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

// シンクレンタルサーバーに画像をアップロード
export async function uploadToServer(file, productId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (productId) {
    formData.append('productId', productId);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('アップロード失敗');
  }

  const result = await response.json();
  return { 
    imageId: result.filename, 
    imageUrl: result.url 
  };
}

// 商品ID付きでアップロード（後方互換性のため）
export async function getUploadUrl(productId) {
  // この関数は後方互換性のため残すが、実際のアップロードはuploadToServerを使用
  return { productId };
}

// 画像をサーバーにアップロード（Cloudflare Imagesの代替）
export async function uploadToCloudflareImages(file) {
  return uploadToServer(file);
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

// 画像URLを生成（シンクレンタルサーバー用）
export function buildImageUrl({ imageId, variant = 'public' }) {
  // シンクレンタルサーバーの画像配信URL
  return `/images/${imageId}`;
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




