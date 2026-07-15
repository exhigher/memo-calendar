export const config = {
  runtime: 'edge'
};

const UPSTASH_URL = 'https://selected-monkey-148490.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAkQKAAIgcDExMTUxZWYyNjk4MDQ0MGY0YTRlZmZhMjQ3MzUwMGU3Zg';

async function redisCommand(cmd, ...args) {
  const res = await fetch(`${UPSTASH_URL}/${cmd}/${args.join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return res.json();
}

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code || code.length < 4) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  const key = 'memo:' + code;
  
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
      await redisCommand('set', key, encodeURIComponent(body.payload));
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: corsHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400, headers: corsHeaders
      });
    }
  }
  
  if (request.method === 'GET') {
    const result = await redisCommand('get', key);
    if (result.result) {
      return new Response(JSON.stringify({
        payload: decodeURIComponent(result.result)
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
