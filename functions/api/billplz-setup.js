function basicAuth(secret){return `Basic ${btoa(`${secret}:`)}`}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}})}

export async function onRequestPost({request,env}){
  const expected=String(env.ADMIN_SETUP_TOKEN||'');
  const supplied=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!expected||supplied!==expected)return json({error:'Unauthorized'},401);

  const secret=String(env.BILLPLZ_SECRET_KEY||'');
  const splitEmail=String(env.PLATFORM_SPLIT_EMAIL||'').trim();
  const fee=Math.max(1,Math.min(100,parseInt(env.PLATFORM_FEE_PERCENT||'1',10)||1));
  if(!secret||!splitEmail)return json({error:'Set BILLPLZ_SECRET_KEY and PLATFORM_SPLIT_EMAIL first'},400);

  const base=(env.BILLPLZ_BASE_URL||'https://www.billplz.com').replace(/\/$/,'');
  const body=new URLSearchParams();
  body.set('title',String(env.BILLPLZ_COLLECTION_TITLE||'KIKA.U Website Orders'));
  body.append('split_payments[][email]',splitEmail);
  body.append('split_payments[][variable_cut]',String(fee));
  body.append('split_payments[][stack_order]','0');
  body.set('split_header','false');

  try{
    const r=await fetch(`${base}/api/v4/collections`,{method:'POST',headers:{Authorization:basicAuth(secret),'content-type':'application/x-www-form-urlencoded',Accept:'application/json'},body:body.toString()});
    const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}
    if(!r.ok)return json({error:'Billplz collection creation failed',status:r.status,details:data},502);
    return json({
      ok:true,
      collection_id:data.id,
      split_payments:data.split_payments||[],
      next:`Set BILLPLZ_COLLECTION_ID=${data.id} in Cloudflare Pages environment variables, then redeploy.`
    });
  }catch{return json({error:'Unable to contact Billplz'},502)}
}
