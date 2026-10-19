const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();const elem=()=>({innerHTML:'',textContent:'',hidden:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false},getBoundingClientRect(){return {left:0,right:1,top:0,bottom:1}}});
const listeners=new Map();const store=new Map();const document={querySelector(s){if(!elements.has(s))elements.set(s,elem());return elements.get(s)},querySelectorAll(){return []},addEventListener(type,fn){listeners.set(type,fn)},title:''};
let currentHash='#home';const location={get hash(){return currentHash},set hash(value){currentHash=value.startsWith('#')?value:'#'+value}};
const ctx=vm.createContext({document,location,window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Intl,console,setTimeout(){},clearTimeout(){},URL,Blob,FormData,confirm:()=>false});
if(fs.existsSync('dist/photos.js'))vm.runInContext(fs.readFileSync('dist/photos.js','utf8'),ctx);
if(fs.existsSync('dist/studio-photos.js'))vm.runInContext(fs.readFileSync('dist/studio-photos.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run('products.length'),48);assert.equal(run("products.filter(p=>p.category==='Чай').length"),24);assert.equal(run("products.filter(p=>p.category==='Кофе').length"),18);
assert.equal(run('new Set(products.map(p=>p.id)).size'),48);
assert.ok(run('products.every(p=>p.name&&p.notes&&p.ingredients&&p.price>0&&p.weight>0&&p.image.startsWith("assets/"))'));
const manifest=JSON.parse(fs.readFileSync('photo-manifest.json','utf8'));
assert.equal(Object.keys(manifest).length,48);
assert.equal(new Set(Object.values(manifest).map(x=>x.image)).size,48);
for(const p of Object.values(manifest)){assert.ok(fs.existsSync('dist/'+p.image));assert.ok(p.source);assert.ok(p.license)}
assert.ok(run('catalog().includes(encodeURIComponent("Кофе"))'));
assert.ok(run("servingGallery(products[0]).includes('Показать фото сырья')"));
assert.ok(run("servingGallery(products[0]).includes('ИИ-иллюстрация')"));
listeners.get('click')({target:{closest(){return {dataset:{action:'gallery',img:'assets/product-1.jpg',caption:'Фото сырья'}}}}});
assert.equal(elements.get('#gallery-main').src,'assets/product-1.jpg');
assert.equal(elements.get('#gallery-caption').textContent,'Фото сырья');
const studioManifest=JSON.parse(fs.readFileSync('studio-manifest.json','utf8'));
assert.equal(Object.keys(studioManifest).length,48);
assert.equal(new Set(Object.values(studioManifest).map(x=>x.image)).size,48);
assert.ok(run("products.every(p=>p.visualType==='ai'&&p.rawImage&&p.rawImage!==p.image)"));
for(const p of Object.values(studioManifest))assert.ok(fs.existsSync('dist/'+p.image));
// Check a stored owner's photo survives upgrades while an old stock photo receives its serving image.
const saved=JSON.parse(run('JSON.stringify(products)'));saved[0].image='https://example.com/owner-photo.jpg';saved[1].image=manifest[2].image;
const seededCtx=vm.createContext({document:{...document,addEventListener(){}},location:{hash:'#home'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>k==='pv-products'?JSON.stringify(saved):null,setItem(){}},Intl,console,setTimeout(){},clearTimeout(){},URL,Blob,FormData,confirm:()=>false});
for(const file of ['dist/photos.js','dist/studio-photos.js','dist/app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),seededCtx);
assert.equal(vm.runInContext('products[0].image',seededCtx),'https://example.com/owner-photo.jpg');
assert.equal(vm.runInContext('products[1].image',seededCtx),studioManifest[2].image);
assert.ok(run("matches({category:'Кофе',budget:900,taste:'шоколад'}).every(x=>x.p.category==='Кофе'&&x.p.price<=900&&x.p.stock>0)"));
assert.equal(run("matches({category:'Подарки',budget:100}).length"),0);
assert.ok(run("matches({category:'Чай',noCaffeine:true,exclude:['мят','ванил']}).every(x=>x.p.caffeine==='без кофеина'&&!/мят|ванил/.test(x.p.ingredients))"));
run("addToCart(25,1,'Для фильтра',2)");assert.equal(run('cart[0].weight'),500);assert.equal(run('cart[0].qty'),2);assert.equal(run('cartSum()'),2622);
run("addToCart(25,0,'В зёрнах',999)");assert.equal(run('cart.length'),1);
run("catalogState.q='Иргачеффе'");assert.equal(run('filterProducts().length'),1);
for(const route of ['home','catalog','product/1','product/25','quiz','admin','about','delivery','privacy','terms']){run('location.hash='+JSON.stringify('#'+route));run('render()');assert.ok(elements.get('#main').innerHTML.length>100)}
for(const tab of ['overview','products','orders','agent','knowledge','versions','dialogs']){run('adminTab='+JSON.stringify(tab));assert.ok(run('adminPanel().length')>50)}
assert.ok(run("esc('<img onerror=alert(1)>').includes('&lt;')"));
run("location.hash='#catalog/'+encodeURIComponent('Чай');catalogState.q='';render()");
assert.equal(run('filterProducts().length'),24);
for(const [category,count] of [['Кофе',18],['Подарки',6],['Все',48],['Чай',24]]){
  listeners.get('click')({target:{closest(){return {dataset:{action:'category',category}}}}});
  run('render(false)');
  assert.equal(run('catalogState.category'),category);
  assert.equal(run('filterProducts().length'),count);
}
listeners.get('click')({target:{closest(){return {dataset:{action:'reset-filters'}}}}});
run('render(false)');assert.equal(run('filterProducts().length'),48);
console.log('PASS: category click transitions from /Чай to coffee, gifts, all, tea; reset filters; rerender persistence.');
console.log('PASS: 48 products; budget/stock/caffeine/exclusions; variants/cart limits; search; 10 routes; 7 admin sections; HTML escaping.');
