const PRODUCTS = [
  {id:'mobile-cart',name:'Mobile Cart',category:'ready',kicker:'2026 promo',price:799,was:1000,checkout:true,image:'assets/instagram/project-02.webp',badge:'PROMO',desc:'Mobile cart lipat untuk F&B, retail dan event. Saiz katalog: open 2ft(W) × 4ft(L) × 3ft(H), closed 2ft(W) × 4ft(L) × 1ft(H).'},
  {id:'node-cart',name:'Node Cart',category:'ready',kicker:'2026 promo',price:899,was:1300,checkout:true,image:'assets/instagram/project-01.webp',badge:'PROMO',desc:'Unit lebih solid untuk operasi harian dan branding. Katalog menyenaraikan saiz sekitar 2ft(W) × 4ft(L) × 3ft(H), dengan sticker logo.'},
  {id:'poplite',name:'PopLite',category:'ready',kicker:'2026 promo',price:699,was:899,checkout:true,image:'assets/instagram/project-10.webp',badge:'PROMO',desc:'Counter ringkas untuk pop-up dan event. Katalog menyenaraikan 2ft(W) × 4ft(L) × 2.5ft(H), dengan sticker logo.'},
  {id:'tanjak-go',name:'Tanjak Go',category:'ready',kicker:'2026 promo',price:650,was:799,checkout:true,image:'assets/instagram/project-11.webp',badge:'PROMO',desc:'Saiz katalog 2ft(W) × 3ft(L) × 3ft(H), termasuk front shelf, side wings, tanjak top dan sticker logo.'},
  {id:'kaunter-go',name:'KaunterGo',category:'ready',kicker:'2026 collection',price:799,checkout:false,image:'assets/instagram/project-06.webp',badge:'CATALOG',desc:'Model KaunterGo disenaraikan pada katalog 2026 pada RM799. Spesifikasi akhir perlu disahkan sebelum pembayaran.'},
  {id:'sampir-go',name:'SampirGo',category:'ready',kicker:'2026 collection',price:699,checkout:false,image:'assets/instagram/project-07.webp',badge:'CATALOG',desc:'Model SampirGo disenaraikan pada katalog 2026 pada RM699. Spesifikasi akhir perlu disahkan dengan KIKA.U.'},
  {id:'candy-wall',name:'Candy Wall',category:'custom',kicker:'Custom display',price:null,image:'assets/instagram/project-04.webp',badge:'FROM RM400',desc:'Backdrop/display custom. Katalog: 4ft(H) × 3ft(W) RM400, 5ft × 3ft RM500, 6ft × 3ft RM600.'},
  {id:'custom-cart',name:'Custom Cart / Kiosk',category:'custom',kicker:'Made to order',price:null,image:'assets/instagram/project-05.webp',badge:'CUSTOM',desc:'Custom Mobile Cart, Node Cart, Tanjak Go dan PopLite. Contoh harga dalam katalog 2026 berada sekitar RM799 hingga RM2,300 bergantung setup.'},
  {id:'corner-cart',name:'Corner Counter',category:'custom',kicker:'Custom layout',price:null,image:'assets/instagram/project-04.webp',badge:'CUSTOM',desc:'Counter sudut dan kiosk bentuk khas untuk coffee, dessert, retail, event activation dan permanent pop-up.'},
  {id:'furniture',name:'Booth & Furniture',category:'custom',kicker:'Made by KIKA.U',price:null,image:'assets/instagram/project-12.webp',badge:'QUOTE',desc:'Booth, counter dan furniture komersial mengikut saiz, finishing dan keperluan operasi.'}
];

const ADDONS = [
  ['Signage Pole 2 Sided','RM200'],['Side Table','RM250'],['Songkok Top','RM200'],['Word Lightbox','RM150'],
  ['Signage Pole 1 Sided','RM200+'],['Front Shelf','RM100+'],['Scallop Top','RM350+'],['Bumbung I','RM200+'],
  ['Frame LED','RM50'],['Bumbung II','RM250'],['Wirebox','RM350+'],['Logo Lightbox','RM350+'],
  ['Signage Lightbox','RM100'],['QR & Menu Board','RM450'],['3D Detachable Logo','RM150'],['Scallop Signage','RM50'],
  ['Knockbox','RM200'],['Full Body Sticker','RM200+'],['Brand Logo Sticker','RM400+'],['Sliding Door','RM100'],
  ['Tanjak Top','RM200'],['Patio Umbrella','RM250+'],['1 Tier Side Wing','RM200+'],['Divider Shelf','RM200']
];

const BANKS=[['ABB0233','Affin Bank'],['AGRO01','Agrobank / AGRONet'],['ABMB0212','Alliance Bank'],['AMBB0209','AmBank'],['BIMB0340','Bank Islam'],['BKRM0602','Bank Rakyat'],['BMMB0341','Bank Muamalat'],['BSN0601','BSN'],['BCBB0235','CIMB Clicks'],['CIT0219','Citibank'],['HLB0224','Hong Leong Bank'],['HSBC0223','HSBC'],['KFH0346','KFH'],['MB2U0227','Maybank2U'],['OCBC0229','OCBC Bank'],['PBB0233','Public Bank'],['RHB0218','RHB Bank'],['SCB0216','Standard Chartered'],['UOB0226','UOB Bank']];

const state={cart:JSON.parse(localStorage.getItem('kika-cart')||'{}'),filter:'all'};
const $=s=>document.querySelector(s);
const money=n=>`RM${Number(n).toLocaleString('en-MY')}`;
const productMedia=p=>p.image?`<img class="product-asset" src="${p.image}" loading="lazy" alt="${p.name} oleh KIKA.U">`:`<div class="sprite sprite-5" role="img" aria-label="${p.name}"></div>`;

function renderProducts(){
  const grid=$('#productGrid');
  const list=PRODUCTS.filter(p=>state.filter==='all'||p.category===state.filter);
  grid.innerHTML=list.map(p=>`<article class="product-card">
    <div class="product-image">${productMedia(p)}<span class="badge">${p.badge}</span></div>
    <div class="product-body"><span class="product-kicker">${p.kicker}</span><h3 class="product-title">${p.name}</h3><p class="product-desc">${p.desc}</p>
    <div class="product-bottom">${p.price?`<div class="price">${p.was?`<s>${money(p.was)}</s>`:''}<strong>${money(p.price)}</strong></div>`:`<div class="price"><strong>Quote</strong></div>`}
    ${p.price&&p.checkout?`<button class="add-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart">+</button>`:`<a class="enquire-btn" target="_blank" rel="noopener" href="https://wa.me/601143776911?text=${encodeURIComponent('Hi KIKA.U, saya nak tanya pasal '+p.name)}">Tanya</a>`}</div></div>
  </article>`).join('');
}

function renderAddons(){
  const grid=$('#addonGrid'); if(!grid)return;
  grid.innerHTML=ADDONS.map(([name,price])=>`<a class="addon-card" target="_blank" rel="noopener" href="https://wa.me/601143776911?text=${encodeURIComponent('Hi KIKA.U, saya nak tambah '+name)}"><span>${name}</span><strong>${price}</strong></a>`).join('');
}

function save(){localStorage.setItem('kika-cart',JSON.stringify(state.cart));renderCart();}
function add(id){const p=PRODUCTS.find(x=>x.id===id);if(!p||!p.checkout)return;state.cart[id]=(state.cart[id]||0)+1;save();openCart();}
function change(id,d){state.cart[id]=(state.cart[id]||0)+d;if(state.cart[id]<=0)delete state.cart[id];save();}
function cartEntries(){return Object.entries(state.cart).map(([id,qty])=>({p:PRODUCTS.find(x=>x.id===id),qty})).filter(x=>x.p&&x.p.price&&x.p.checkout)}
function renderCart(){
  const entries=cartEntries();const count=entries.reduce((s,x)=>s+x.qty,0);$('#cartCount').textContent=count;
  $('#cartItems').innerHTML=entries.length?entries.map(({p,qty})=>`<div class="cart-row"><img class="cart-thumb asset-thumb" src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${money(p.price)} / unit</small><div class="qty"><button data-dec="${p.id}">−</button><span>${qty}</span><button data-inc="${p.id}">+</button></div></div><button class="remove" data-remove="${p.id}">×</button></div>`).join(''):`<div class="empty-cart">Cart masih kosong.<br>Pilih model untuk mula.</div>`;
  const total=entries.reduce((s,x)=>s+x.p.price*x.qty,0);$('#subtotal').textContent=money(total);$('#checkoutBtn').disabled=!entries.length;
}
function openCart(){ $('#cartDrawer').classList.add('open');$('#drawerBackdrop').classList.add('show');$('#cartDrawer').setAttribute('aria-hidden','false');}
function closeCart(){ $('#cartDrawer').classList.remove('open');$('#drawerBackdrop').classList.remove('show');$('#cartDrawer').setAttribute('aria-hidden','true');}
function openCheckout(){if(!cartEntries().length)return;closeCart();$('#checkoutItems').value=JSON.stringify(cartEntries().map(({p,qty})=>({id:p.id,qty})));$('#checkoutModal').classList.add('open');$('#modalBackdrop').classList.add('show');$('#checkoutModal').setAttribute('aria-hidden','false');}
function closeCheckout(){ $('#checkoutModal').classList.remove('open');$('#modalBackdrop').classList.remove('show');$('#checkoutModal').setAttribute('aria-hidden','true');}
function whatsappOrder(){const entries=cartEntries();if(!entries.length)return;const total=entries.reduce((s,x)=>s+x.p.price*x.qty,0);const lines=entries.map(x=>`• ${x.p.name} x${x.qty} = ${money(x.p.price*x.qty)}`).join('\n');const text=`Hi KIKA.U, saya nak order:\n${lines}\n\nSubtotal: ${money(total)}\nBoleh confirm stok, delivery dan lead time?`;window.open(`https://wa.me/601143776911?text=${encodeURIComponent(text)}`,'_blank');}

document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a)add(a.dataset.add);const inc=e.target.closest('[data-inc]');if(inc)change(inc.dataset.inc,1);const dec=e.target.closest('[data-dec]');if(dec)change(dec.dataset.dec,-1);const rem=e.target.closest('[data-remove]');if(rem){delete state.cart[rem.dataset.remove];save()}const fil=e.target.closest('.filter');if(fil){document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));fil.classList.add('active');state.filter=fil.dataset.filter;renderProducts();}});
$('#openCart').onclick=openCart;$('#closeCart').onclick=closeCart;$('#drawerBackdrop').onclick=closeCart;$('#checkoutBtn').onclick=openCheckout;$('#closeCheckout').onclick=closeCheckout;$('#modalBackdrop').onclick=closeCheckout;$('#whatsappOrder').onclick=whatsappOrder;
$('#bankSelect').innerHTML='<option value="">Pilih bank</option>'+BANKS.map(([id,n])=>`<option value="${id}">${n}</option>`).join('');
const GALLERY_PROJECTS=[1,2,3,4,5,6,7,10,11,12];
$('#gallery').innerHTML=GALLERY_PROJECTS.map(n=>`<figure class="gallery-card"><img class="gallery-img" loading="lazy" src="assets/instagram/project-${String(n).padStart(2,'0')}.webp" alt="KIKA.U customer cart project ${n}"></figure>`).join('');
renderProducts();renderAddons();renderCart();
