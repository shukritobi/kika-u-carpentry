const PRICE_BOOK={"mobile-cart":799,"node-cart":899,"poplite":699,"tanjak-go":650};
const PRODUCT_NAMES={"mobile-cart":"Mobile Cart","node-cart":"Node Cart","poplite":"PopLite","tanjak-go":"Tanjak Go"};
function textError(title,message,status=400){return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><style>body{font-family:system-ui;background:#f4f0e8;padding:40px;color:#111}.box{max-width:620px;margin:auto;background:white;border-radius:24px;padding:30px}a{display:inline-block;background:#111;color:white;padding:12px 18px;border-radius:999px;text-decoration:none}</style><div class="box"><h1>${title}</h1><p>${message}</p><a href="/">Kembali ke KIKA.U</a></div>`,{status,headers:{"content-type":"text/html;charset=UTF-8"}})}
function fmtMY(date=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(date).reduce((a,p)=>(a[p.type]=p.value,a),{});return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`}
async function hmacSHA256(data,key){const enc=new TextEncoder();const cryptoKey=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',cryptoKey,enc.encode(data));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function checksum(payload,privateKey){const values=Object.keys(payload).sort().map(k=>{const v=payload[k];return typeof v==='object'?JSON.stringify(v):String(v)});return hmacSHA256(values.join(','),privateKey)}
export async function onRequestPost({request,env}){
  try{
    const form=await request.formData();
    const name=String(form.get('name')||'').trim();const email=String(form.get('email')||'').trim();const phone=String(form.get('phone')||'').trim();const bank_prefix=String(form.get('bank_prefix')||'').trim();
    let items=[];try{items=JSON.parse(String(form.get('items')||'[]'))}catch{}
    if(!name||!email||!phone||!bank_prefix||!Array.isArray(items)||!items.length)return textError('Maklumat tak lengkap','Sila kembali dan lengkapkan maklumat checkout.');
    let amount=0;const descriptions=[];
    for(const item of items){const id=String(item.id||'');const qty=Math.max(1,Math.min(10,Number(item.qty)||1));if(!PRICE_BOOK[id])return textError('Produk tak sah','Ada item dalam cart yang tak dapat disahkan.');amount+=PRICE_BOOK[id]*qty;descriptions.push(`${PRODUCT_NAMES[id]} x${qty}`)}
    const apiKey=env.HEREPAY_API_KEY,secretKey=env.HEREPAY_SECRET_KEY,privateKey=env.HEREPAY_PRIVATE_KEY;
    if(!apiKey||!secretKey||!privateKey){const wa=`https://wa.me/601143776911?text=${encodeURIComponent('Hi KIKA.U, saya cuba checkout website untuk '+descriptions.join(', ')+' (RM'+amount+'). Boleh bantu proceed payment?')}`;return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><style>body{font-family:system-ui;background:#f4f0e8;padding:40px}.box{max-width:620px;margin:auto;background:white;padding:30px;border-radius:24px}a{display:inline-block;background:#ff6a00;color:#111;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:700}</style><div class="box"><h1>Checkout hampir siap.</h1><p>Payment gateway belum diaktifkan dengan credential merchant KIKA.U. Order anda bernilai <b>RM${amount}</b>.</p><a href="${wa}">Teruskan melalui WhatsApp</a></div>`,{headers:{"content-type":"text/html;charset=UTF-8"}})}
    const payload={payment_code:`KIKAU-${Date.now().toString(36).toUpperCase()}`,created_at:fmtMY(),amount,name,email,phone,description:descriptions.join(', ').slice(0,150),bank_prefix,payment_method:'Online Banking'};
    payload.checksum=await checksum(payload,privateKey);
    const base=(env.HEREPAY_BASE_URL||'https://uat.herepay.org').replace(/\/$/,'');
    const resp=await fetch(`${base}/api/v1/herepay/initiate`,{method:'POST',headers:{'content-type':'application/json','SecretKey':secretKey,'XApiKey':apiKey},body:JSON.stringify(payload),redirect:'manual'});
    const location=resp.headers.get('location');if(location)return Response.redirect(location,302);
    const ctype=resp.headers.get('content-type')||'';const body=await resp.text();
    if(ctype.includes('text/html'))return new Response(body,{status:resp.status,headers:{'content-type':'text/html;charset=UTF-8'}});
    try{const data=JSON.parse(body);const url=data.redirect_url||data.payment_url||data.url||data.data?.redirect_url||data.data?.payment_url;if(url)return Response.redirect(url,302)}catch{}
    return textError('Herepay tidak dapat dimulakan',`Gateway response: ${resp.status}. Semak credential dan konfigurasi Herepay.`,502);
  }catch(err){return textError('Checkout error','Sila cuba lagi atau WhatsApp KIKA.U untuk bantuan.',500)}
}
