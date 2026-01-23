
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
let flip;
(async function(){
 const book=document.getElementById('book');
 const pdf=await pdfjsLib.getDocument('pdf/VH8000_Manual.pdf').promise;
 const pages=[];
 for(let i=1;i<=pdf.numPages;i++){
  const p=await pdf.getPage(i);
  const v=p.getViewport({scale:1.35});
  const c=document.createElement('canvas');
  c.width=v.width;c.height=v.height;
  await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
  const d=document.createElement('div');d.className='page';d.appendChild(c);
  pages.push(d);
 }
 flip=new St.PageFlip(book,{size:'stretch',showCover:true,maxShadowOpacity:0.35});
 flip.loadFromHTML(pages);
})();
function prev(){flip.flipPrev()}
function next(){flip.flipNext()}
function downloadPDF(){window.open('pdf/VH8000_Manual.pdf','_blank')}
function printManual(){window.print()}
