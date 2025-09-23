const editor = document.getElementById('editor');
const textEditor = document.getElementById('text-editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');

let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';

if(localStorage.getItem('code')) editor.innerText = localStorage.getItem('code');
if(localStorage.getItem('text')) textEditor.innerHTML = localStorage.getItem('text');

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
controlBar.style.display = 'none';

textEditor.addEventListener('keydown', (e) => {
  const isPrintable = e.key.length === 1;
  if(!inTextMode || !isPrintable) return;

  const sel = window.getSelection();
  if(sel.rangeCount > 0){
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = currentFontColor;
    span.style.fontSize = currentFontSize;
    span.textContent = e.key;
    range.deleteContents();
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    e.preventDefault();
  }
});

function applyStyleToSelection() {
  const sel = window.getSelection();
  if(sel.rangeCount > 0 && sel.toString() !== ''){
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = currentFontColor;
    span.style.fontSize = currentFontSize;
    span.textContent = sel.toString();
    range.deleteContents();
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

fontSize.addEventListener('change', ()=>{
  currentFontSize = fontSize.value;
  localStorage.setItem('text-font-size', currentFontSize);
  applyStyleToSelection();
});
fontColor.addEventListener('change', ()=>{
  currentFontColor = fontColor.value;
  localStorage.setItem('text-font-color', currentFontColor);
  applyStyleToSelection();
});

// ===== Nouveau comportement du bouton : Télécharger en DOCX =====
bleft.addEventListener('click', ()=>{
  const isText = inTextMode;
  const content = isText ? textEditor.innerHTML : editor.innerText;

  // Crée un blob au format Word (HTML encapsulé)
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"></head><body>' +
    (isText ? content : `<pre>${content}</pre>`) +
    '</body></html>';

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = isText ? 'text.docx' : 'code.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

bright.addEventListener('click', ()=>{
  if(!inTextMode){
    editor.style.transform='rotateY(-180deg)';
    textEditor.style.transform='rotateY(0deg)';
    controlBar.style.display='flex';
    inTextMode = true;
    bright.textContent='Code';
  } else {
    editor.style.transform='rotateY(0deg)';
    textEditor.style.transform='rotateY(-180deg)';
    controlBar.style.display='none';
    inTextMode = false;
    bright.textContent='Text';
  }
});

editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// ===================== Auto-save toutes les 4 secondes =====================
setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
  console.log('Auto-save effectué à', new Date().toLocaleTimeString());
}, 4000);
