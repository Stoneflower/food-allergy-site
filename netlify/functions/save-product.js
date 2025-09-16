import fetch from 'node-fetch'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ''
    }
  }

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: corsHeaders(), body: 'Method Not Allowed' }
    }

    const body = JSON.parse(event.body || '{}')
    const { product, allergies } = body
    if (!product?.name) {
      return { statusCode: 400, headers: corsHeaders(), body: 'Missing product.name' }
    }

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY
    if (!url || !serviceKey) {
      return { statusCode: 500, headers: corsHeaders(), body: 'Missing Supabase env' }
    }

    // products insert
    const prodRes = await fetch(`${url}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify([{ name: product.name, brand: product.brand || null, category: product.category || null }])
    })
    const prodJson = await prodRes.json()
    if (!prodRes.ok) {
      return { statusCode: prodRes.status, headers: corsHeaders(), body: JSON.stringify({ error: prodJson }) }
    }
    const productId = prodJson[0]?.id

    // product_allergies insert
    if (Array.isArray(allergies) && allergies.length > 0) {
      const rows = allergies.map(r => ({
        product_id: productId,
        allergy_item_id: r.allergy_item_id,
        presence_type: r.presence_type || 'direct',
        amount_level: r.amount_level || 'unknown',
        notes: r.notes || ''
      }))
      const paRes = await fetch(`${url}/rest/v1/product_allergies`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rows)
      })
      if (!paRes.ok) {
        const paJson = await paRes.text()
        return { statusCode: paRes.status, headers: corsHeaders(), body: JSON.stringify({ error: paJson }) }
      }
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ id: productId }) }
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: e.message }) }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'
  }
}


