const PRICE_BOOK={"mobile-cart":799,"node-cart":899,"poplite":699,"tanjak-go":650};
const PRODUCT_NAMES={"mobile-cart":"Mobile Cart","node-cart":"Node Cart","poplite":"PopLite","tanjak-go":"Tanjak Go"};
let splitVerifiedAt=0;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function textError(title,message,status=400){return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><style>body{font-family:system-ui;background:#f4f0e8;padding:40px;color:#111}.box{max-width:680px;margin:auto;background:white;border-radius:24px;padding:30px}a{display:inline-block;background:#111;color:white;padding:12px 18px;border-radius:999px;text-decoration:none}</style><div class="box"><h1>${esc(title)}</h1><p>${esc(message)}</p><a href="/">Kembali ke KIKA.U</a></div>`,{status,headers:{"content-type":"text/html;charset=UTF-8"}})}
function fmtMY(date=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(date).reduce((a,p)=>(a[p.type]=p.value,a),{});return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`}
function normalizePhone(v){let p=String(v||'').replace(/[^0-9+]/g,'');if(p.startsWith('+'))p=p.slice(1);if(p.startsWith('0'))p='60'+p.slice(1);return p}
function basicAuth(secret){return `Basic ${btoa(`${secret}:`)}`}
async function hmacSHA256(data,key){const enc=new TextEncoder();const cryptoKey=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',cryptoKey,enc.encode(data));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function checksum(payload,privateKey){const values=Object.keys(payload).sort().map(k=>{const v=payload[k];return typeof v==='object'?JSON.stringify(v):String(v)});return hmacSHA256(values.join(','),privateKey)}

async function verifyBillplzSplit(env){
  if(Date.now()-splitVerifiedAt<10*60*1000)return true;
  const secret=env.BILLPLZ_SECRET_KEY,collection=env.BILLPLZ_COLLECTION_ID,splitEmail=String(env.PLATFORM_SPLIT_EMAIL||'').trim().toLowerCase();
  const fee=Math.max(1,Math.min(100,parseInt(env.PLATFORM_FEE_PERCENT||'1',10)||1));
  if(!secret||!collection||!splitEmail)throw new Error('Billplz split configuration is incomplete');
  const base=(env.BILLPLZ_BASE_URL||'https://www.billplz.com').replace(/\/$/,'');
  const r=await fetch(`${base}/api/v4/collections/${encodeURIComponent(collection)}`,{headers:{Authorization:basicAuth(secret),Accept:'application/json'}});
  if(!r.ok)throw new Error(`Unable to verify Billplz collection (${r.status})`);
  const data=await r.json();
  const recipients=Array.isArray(data.split_payments)?data.split_payments:[];
  const match=recipients.find(x=>String(x.email||'').toLowerCase()===splitEmail && Number(x.variable_cut)===fee);
  if(!match)throw new Error(`Billplz collection does not contain the required ${fee}% Split Rule recipient`);
  splitVerifiedAt=Date.now();return true;
}

async function checkoutBillplz({request,env,name,email,phone,bank_prefix,amount,descriptions,orderRef}){
  await verifyBillplzSplit(env);
  const base=(env.BILLPLZ_BASE_URL||'https://www.billplz.com').replace(/\/$/,'');
  const origin=new URL(request.url).origin;
  const body=new URLSearchParams();
  body.set('collection_id',env.BILLPLZ_COLLECTION_ID);
  body.set('email',email);body.set('mobile',normalizePhone(phone));body.set('name',name);
  body.set('amount',String(Math.round(amount*100)));
  body.set('callback_url',`${origin}/api/billplz-callback`);
  body.set('redirect_url',`${origin}/payment-status.html`);
  body.set('description',descriptions.join(', ').slice(0,200));
  body.set('reference_1_label','Bank Code');body.set('reference_1',bank_prefix);
  body.set('reference_2_label','Order Ref');body.set('reference_2',orderRef.slice(0,120));
  const r=await fetch(`${base}/api/v3/bills`,{method:'POST',headers:{Authorization:basicAuth(env.BILLPLZ_SECRET_KEY),'content-type':'application/x-www-form-urlencoded',Accept:'application/json'},body:body.toString()});
  const text=await r.text();let data={};try{data=JSON.parse(text)}catch{}
  if(!r.ok||!data.url)throw new Error(data?.error?.message||data?.error||`Billplz create bill failed (${r.status})`);
  const sep=data.url.includes('?')?'&':'?';
  return Response.redirect(`${data.url}${sep}auto_submit=true`,302);
}

async function checkoutHerepay({env,name,email,phone,bank_prefix,amount,descriptions,orderRef}){
  const fee=parseInt(env.PLATFORM_FEE_PERCENT||'1',10)||0;
  if(fee>0 && env.ALLOW_HEREPAY_WITHOUT_SPLIT!=='true')throw new Error('Herepay checkout is disabled while a platform transaction fee is enabled because the current API integration does not provide a verified 1% split rule. Use Billplz for monetized checkout.');
  const apiKey=env.HEREPAY_API_KEY,secretKey=env.HEREPAY_SECRET_KEY,privateKey=env.HEREPAY_PRIVATE_KEY;
  if(!apiKey||!secretKey||!privateKey)throw new Error('Herepay credentials are incomplete');
  const payload={payment_code:orderRef,created_at:fmtMY(),amount,name,email,phone,description:descriptions.join(', ').slice(0,150),bank_prefix,payment_method:'Online Banking'};
  payload.checksum=await checksum(payload,privateKey);
  const base=(env.HEREPAY_BASE_URL||'https://uat.herepay.org').replace(/\/$/,'');
  const resp=await fetch(`${base}/api/v1/herepay/initiate`,{method:'POST',headers:{'content-type':'application/json','SecretKey':secretKey,'XApiKey':apiKey},body:JSON.stringify(payload),redirect:'manual'});
  const location=resp.headers.get('location');if(location)return Response.redirect(location,302);
  const body=await resp.text();try{const data=JSON.parse(body);const url=data.redirect_url||data.payment_url||data.url||data.data?.redirect_url||data.data?.payment_url;if(url)return Response.redirect(url,302)}catch{}
  throw new Error(`Herepay initiate failed (${resp.status})`);
}

export async function onRequestPost({request,env}){
  try{
    const form=await request.formData();
    const name=String(form.get('name')||'').trim(),email=String(form.get('email')||'').trim(),phone=String(form.get('phone')||'').trim(),bank_prefix=String(form.get('bank_prefix')||'').trim();
    let items=[];try{items=JSON.parse(String(form.get('items')||'[]'))}catch{}
    if(!name||!email||!phone||!bank_prefix||!Array.isArray(items)||!items.length)return textError('Maklumat tak lengkap','Sila kembali dan lengkapkan maklumat checkout.');
    let amount=0;const descriptions=[];
    for(const item of items){const id=String(item.id||'');const qty=Math.max(1,Math.min(10,Number(item.qty)||1));if(!PRICE_BOOK[id])return textError('Produk tak sah','Ada item dalam cart yang tak dapat disahkan oleh server.');amount+=PRICE_BOOK[id]*qty;descriptions.push(`${PRODUCT_NAMES[id]} x${qty}`)}
    const orderRef=`KIKAU-${Date.now().toString(36).toUpperCase()}`;
    const provider=String(env.PAYMENT_PROVIDER||(env.BILLPLZ_SECRET_KEY?'billplz':'herepay')).toLowerCase();
    if(provider==='billplz')return await checkoutBillplz({request,env,name,email,phone,bank_prefix,amount,descriptions,orderRef});
    if(provider==='herepay')return await checkoutHerepay({request,env,name,email,phone,bank_prefix,amount,descriptions,orderRef});
    return textError('Payment provider tidak dikenali','Set PAYMENT_PROVIDER kepada billplz atau herepay.',500);
  }catch(err){
    const msg=String(err?.message||'Unknown checkout error');
    const noGateway=/credentials|configuration|Split Rule|disabled|incomplete/i.test(msg);
    return textError(noGateway?'Checkout belum diaktifkan':'Checkout error',msg,noGateway?503:502);
  }
}
