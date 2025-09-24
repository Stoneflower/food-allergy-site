const https = require('https');

// DeepL API Free プラン用の翻訳エンドポイント
exports.handler = async (event, context) => {
  // CORS対応
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS リクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST リクエストのみ処理
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, source_lang, target_lang } = JSON.parse(event.body);
    const api_key = process.env.DEEPL_API_KEY;

    // 必須パラメータのチェック
    if (!text || !target_lang || !api_key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: text, target_lang, api_key' 
        })
      };
    }

    // DeepL API Free プランの制限チェック
    if (text.length > 50000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Text too long. Maximum 50,000 characters per request.' 
        })
      };
    }

    // DeepL API へのリクエスト
    const deeplResponse = await translateWithDeepL(text, source_lang, target_lang, api_key);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(deeplResponse)
    };

  } catch (error) {
    console.error('Translation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Translation failed', 
        message: error.message 
      })
    };
  }
};

// DeepL API を呼び出す関数
function translateWithDeepL(text, sourceLang, targetLang, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: [text],
      source_lang: sourceLang,
      target_lang: targetLang
    });

    const options = {
      hostname: 'api-free.deepl.com',
      port: 443,
      path: '/v2/translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `DeepL-Auth-Key ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            resolve({
              translations: [{
                text: response.translations[0].text,
                detected_source_language: response.translations[0].detected_source_language
              }]
            });
          } else {
            reject(new Error(`DeepL API error: ${res.statusCode} - ${response.message || 'Unknown error'}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse DeepL response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}
