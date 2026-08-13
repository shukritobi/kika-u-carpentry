function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function hmacSHA256(data,key){
  const enc=new TextEncoder();
  const cryptoKey=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',cryptoKey,enc.encode(data)));
}
function timingSafeEqual(a,b){
  a=String(a||'').toLowerCase();b=String(b||'').toLowerCase();
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
function signatureSource(entries){
  return entries
    .filter(([k])=>k.toLowerCase()!=='x_signature')
    .map(([k,v])=>[k,String(v)])
    .sort((a,b)=>a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
    .map(([k,v])=>`${k}${v}`)
    .join('|');
}

export async function onRequestPost({request,env}){
  try{
    const form=await request.formData();
    const entries=[...form.entries()];
    const payload=Object.fromEntries(entries.map(([k,v])=>[k,String(v)]));
    const supplied=String(payload.x_signature||'');
    const key=String(env.BILLPLZ_X_SIGNATURE_KEY||'');

    // Production should always use X Signature. Basic callback remains allowed only
    // when explicitly opted in for sandbox/debugging.
    if(key){
      if(!supplied)return new Response('Missing x_signature',{status:401});
      const expected=await hmacSHA256(signatureSource(entries),key);
      if(!timingSafeEqual(expected,supplied))return new Response('Invalid x_signature',{status:401});
    }else if(env.ALLOW_UNSIGNED_BILLPLZ_CALLBACK!=='true'){
      return new Response('X Signature key not configured',{status:503});
    }

    const record={
      provider:'billplz',
      id:payload.id||'',
      collection_id:payload.collection_id||'',
      paid:String(payload.paid||'')==='true',
      state:payload.state||'',
      amount:Number(payload.amount||0),
      paid_amount:Number(payload.paid_amount||0),
      paid_at:payload.paid_at||null,
      transaction_id:payload.transaction_id||null,
      transaction_status:payload.transaction_status||null,
      email:payload.email||'',
      mobile:payload.mobile||'',
      updated_at:new Date().toISOString()
    };

    // Optional Cloudflare KV binding. Billplz remains the payment source of truth.
    if(env.ORDERS_KV && record.id){
      await env.ORDERS_KV.put(`billplz:${record.id}`,JSON.stringify(record),{expirationTtl:60*60*24*180});
    }
    return new Response('OK',{status:200,headers:{'content-type':'text/plain;charset=UTF-8','cache-control':'no-store'}});
  }catch{
    return new Response('Callback error',{status:500,headers:{'cache-control':'no-store'}});
  }
}
