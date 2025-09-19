// Netlify Function: Cloudflare Images 直リンク用の署名付きアップロードURLを発行
// 環境変数:
// - CF_ACCOUNT_ID: Cloudflare アカウントID
// - CF_IMAGES_API_TOKEN: Cloudflare Images APIトークン (Images:Write 権限)

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_IMAGES_API_TOKEN;
    if (!accountId || !apiToken) {
      return { statusCode: 500, body: 'Missing CF_ACCOUNT_ID or CF_IMAGES_API_TOKEN' };
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    const json = await res.json();
    if (!json?.success) {
      return { statusCode: 502, body: JSON.stringify(json || { error: 'cloudflare_error' }) };
    }

    // 返却: アップロードURLと画像ID
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadURL: json.result?.uploadURL, id: json.result?.id }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error', message: String(e) }) };
  }
}




