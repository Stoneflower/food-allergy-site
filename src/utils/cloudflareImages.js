import imageCompression from 'browser-image-compression';

// 署名URLを取得（Netlify Function経由）
export async function getDirectUploadUrl() {
  const res = await fetch('/.netlify/functions/cf-images-sign-upload', { method: 'POST' });
  if (!res.ok) throw new Error('failed_to_get_signed_url');
  return res.json();
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
export async function compressAndUpload(file, { maxSizeMB = 1, maxWidthOrHeight = 1600 } = {}) {
  const compressed = await imageCompression(file, { maxSizeMB, maxWidthOrHeight, useWebWorker: true });
  return uploadToCloudflareImages(compressed);
}

// 変換付きの配信URLを生成
export function buildImageUrl({ accountHash, imageId, variant = 'public' }) {
  // variantに代わって、Imagesの変換パラメータ指定（w=,q= など）も可
  // 例: `/${imageId}/w=800,q=75` を使う場合は variant をその文字列に
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}




