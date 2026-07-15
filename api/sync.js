export const config = {
  runtime: 'edge'
};

// 简单的内存存储（Vercel Edge 每次冷启动会清空，但足够个人使用）
// 如需持久化，可接入 Upstash Redis
const storage = new Map();

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code || code.length < 4) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const key = 'memo:' + code;

  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.payload) {
        return new Response(JSON.stringify({ error: 'Missing payload' }), {
          status: 400, headers: corsHeaders
        });
      }
      storage.set(key, {
        payload: body.payload,
        timestamp: Date.now()
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: corsHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: corsHeaders
      });
    }
  }

  if (request.method === 'GET') {
    const data = storage.get(key);
    if (data) {
      return new Response(JSON.stringify({
        payload: data.payload,
        timestamp: data.timestamp
      }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ payload: null }), {
      status: 200, headers: corsHeaders
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: corsHeaders
  });
}