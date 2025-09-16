export const handler = async (event) => {
  try {
    const url = event.queryStringParameters?.url
    if (!url) {
      return { statusCode: 400, body: 'Missing url parameter' }
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*'
      },
      redirect: 'follow'
    })

    if (!res.ok) {
      return { statusCode: res.status, body: `Upstream error: ${res.status}` }
    }

    const arrayBuffer = await res.arrayBuffer()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=600',
        'Access-Control-Allow-Origin': '*'
      },
      body: Buffer.from(arrayBuffer).toString('base64'),
      isBase64Encoded: true
    }
  } catch (e) {
    return { statusCode: 500, body: `Function error: ${e.message}` }
  }
}


