
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let flip;
let cachedPages = null;

(async function(){
  const pdf = await pdfjsLib.getDocument('./pdf/VH8000_Manual.pdf').promise;
  const pages = [];

  for(let i=1;i<=pdf.numPages;i++){
    const p = await pdf.getPage(i);
    const v = p.getViewport({scale: 1.35});
    const c = document.createElement('canvas');
    c.width = v.width; c.height = v.height;
    await p.render({canvasContext: c.getContext('2d'), viewport: v}).promise;

    const d = document.createElement('div');
    d.className = 'page';
    d.appendChild(c);
    pages.push(d);
  }

  cachedPages = pages;
  initFlip();

  window.addEventListener('resize', () => {
    if (!cachedPages) return;
    try { flip && flip.destroy(); } catch(e){}
    initFlip();
  });
})();

function initFlip(){
  const book = document.getElementById('book');
  const viewer = document.querySelector('.viewer');
  const w = Math.max(600, viewer.clientWidth);
  const h = Math.max(500, viewer.clientHeight);

  flip = new St.PageFlip(book, {
    width: Math.floor(w/2),
    height: Math.floor(h),
    size: 'fixed',
    showCover: true,
    maxShadowOpacity: 0.35,
    mobileScrollSupport: false
  });

  flip.loadFromHTML(cachedPages);
}

function prev(){ flip && flip.flipPrev(); }
function next(){ flip && flip.flipNext(); }
function downloadPDF(){ window.open('./pdf/VH8000_Manual.pdf','_blank'); }
function printManual(){ window.print(); }
