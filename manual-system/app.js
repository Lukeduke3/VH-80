const qs = new URLSearchParams(location.search);
const manualKey = (qs.get('m') || 'vh8000').trim();

const els = {
  viewer: document.getElementById('viewer'),
  imgLeft: document.getElementById('imgLeft'),
  imgRight: document.getElementById('imgRight'),
  counter: document.getElementById('counter'),
  notice: document.getElementById('notice'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  btnManual: document.getElementById('btnManual'),
  btnBom: document.getElementById('btnBom'),
  btnPrint: document.getElementById('btnPrint'),
  btnDownload: document.getElementById('btnDownload'),
};

let manifest = null;
let mode = 'manual'; // manual | bom
let spread = 0; // spread index

function showNotice(msg){
  els.notice.hidden = !msg;
  els.notice.textContent = msg || '';
}

async function loadManifest(){
  const url = `manuals/${manualKey}/manifest.json`;
  const res = await fetch(url, {cache:'no-store'});
  if(!res.ok) throw new Error(`Missing manifest: ${url}`);
  manifest = await res.json();
  document.title = manifest.title || 'Craftlander Manuals';
}

function pageUrl(i){
  const m = manifest.manual;
  const n = String(i+1).padStart(3,'0');
  return `manuals/${manualKey}/pages/${m.prefix}${n}.${m.ext}`;
}

function bomPdfUrl(){
  return `manuals/${manualKey}/${manifest.bom.pdf}`;
}

function totalSpreads(){
  const count = mode==='manual' ? manifest.manual.count : 1;
  return Math.ceil(count/2);
}

function clampSpread(s){
  return Math.max(0, Math.min(totalSpreads()-1, s));
}

function setImg(imgEl, src){
  if(!src){
    imgEl.removeAttribute('src');
    imgEl.style.visibility='hidden';
    return;
  }
  imgEl.style.visibility='visible';
  imgEl.src = src;
}

async function preload(src){
  if(!src) return;
  const img = new Image();
  img.src = src;
  await img.decode().catch(()=>{});
}

async function render(){
  if(!manifest) return;

  spread = clampSpread(spread);
  const leftIndex = spread*2;
  const rightIndex = leftIndex+1;

  if(mode==='manual'){
    const lsrc = leftIndex < manifest.manual.count ? pageUrl(leftIndex) : '';
    const rsrc = rightIndex < manifest.manual.count ? pageUrl(rightIndex) : '';

    await Promise.all([preload(lsrc), preload(rsrc)]);
    setImg(els.imgLeft, lsrc);
    setImg(els.imgRight, rsrc);

    els.counter.textContent = `Manual spread ${spread+1} / ${totalSpreads()}`;
  } else {
    // BOM mode - show PDF preview via embedded img is not reliable; we show blank spread + buttons
    setImg(els.imgLeft, '');
    setImg(els.imgRight, '');
    els.counter.textContent = `BOM 1 / 1`;
    showNotice('BOM is available via Download / Print button.');
  }
}

function curl(dir){
  els.viewer.classList.remove('curl-next','curl-prev');
  void els.viewer.offsetWidth;
  els.viewer.classList.add(dir==='next'?'curl-next':'curl-prev');
  setTimeout(()=>els.viewer.classList.remove('curl-next','curl-prev'), 620);
}

els.btnPrev.addEventListener('click', async ()=>{
  if(spread<=0) return;
  curl('prev');
  spread -= 1;
  await render();
});

els.btnNext.addEventListener('click', async ()=>{
  if(spread>=totalSpreads()-1) return;
  curl('next');
  spread += 1;
  await render();
});

els.btnManual.addEventListener('click', async ()=>{
  mode='manual'; spread=0; showNotice('');
  els.btnManual.classList.add('primary');
  els.btnBom.classList.remove('primary');
  await render();
});

els.btnBom.addEventListener('click', async ()=>{
  if(!manifest.bom?.enabled){
    showNotice('No BOM configured for this manual.');
    return;
  }
  mode='bom'; spread=0;
  els.btnBom.classList.add('primary');
  els.btnManual.classList.remove('primary');
  await render();
});

els.btnDownload.addEventListener('click', ()=>{
  if(mode==='bom'){
    if(!manifest.bom?.enabled) return;
    location.href = bomPdfUrl();
    return;
  }
  // download current spread as images via direct open
  const leftIndex = spread*2;
  const lsrc = leftIndex < manifest.manual.count ? pageUrl(leftIndex) : '';
  if(lsrc) window.open(lsrc,'_blank');
});

els.btnPrint.addEventListener('click', ()=>{
  if(mode==='bom'){
    if(!manifest.bom?.enabled) return;
    window.open(bomPdfUrl(), '_blank');
    return;
  }
  const leftIndex = spread*2;
  const rightIndex = leftIndex+1;
  const lsrc = leftIndex < manifest.manual.count ? pageUrl(leftIndex) : '';
  const rsrc = rightIndex < manifest.manual.count ? pageUrl(rightIndex) : '';

  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html><head><title>Print</title><style>body{margin:0}img{width:100%;page-break-after:always}</style></head><body>`);
  if(lsrc) w.document.write(`<img src="${lsrc}">`);
  if(rsrc) w.document.write(`<img src="${rsrc}">`);
  w.document.write(`</body></html>`);
  w.document.close();
  w.focus();
  w.onload = ()=> w.print();
});

(async function init(){
  try{
    await loadManifest();
    els.btnManual.classList.add('primary');
    await render();
  }catch(e){
    showNotice(String(e));
  }
})();
