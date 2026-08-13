function basicAuth(secret){return `Basic ${btoa(`${secret}:`)}`}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}})}

export async function onRequestGet({request,env}){
  const id=String(new URL(request.url).searchParams.get('id')||'').trim();
  if(!id||!/^[A-Za-z0-9_-]{4,80}$/.test(id))return json({error:'Invalid bill id'},400);
  if(!env.BILLPLZ_SECRET_KEY)return json({error:'Billplz is not configured'},503);

  try{
    if(env.ORDERS_KV){
      const cached=await env.ORDERS_KV.get(`billplz:${id}`,'json');
      if(cached?.paid)return json({id,paid:true,state:cached.state||'paid',amount:cached.amount||0,paid_amount:cached.paid_amount||0,paid_at:cached.paid_at||null});
    }
    const base=(env.BILLPLZ_BASE_URL||'https://www.billplz.com').replace(/\/$/,'');
    const r=await fetch(`${base}/api/v3/bills/${encodeURIComponent(id)}`,{headers:{Authorization:basicAuth(env.BILLPLZ_SECRET_KEY),Accept:'application/json'}});
    if(!r.ok)return json({error:`Gateway status unavailable (${r.status})`},502);
    const b=await r.json();
    return json({id:b.id,paid:Boolean(b.paid),state:b.state||'',amount:Number(b.amount||0),paid_amount:Number(b.paid_amount||0),paid_at:b.paid_at||null});
  }catch{return json({error:'Unable to verify payment'},502)}
}
