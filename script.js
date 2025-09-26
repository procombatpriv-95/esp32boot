je veux que maintenant dans le code java script void setup() {} le void doit etre bleu le setup orange etles parenthese   en rose emsuite saute 2 ligne void bleu loop orange () rose espace { saute de ligne }#tous {  margin-left:300px; margin-top:30px; position:relative; width:650px; height:500px;  border-radius:30px; overflow:hidden; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
.editor, .text-editor { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:30px; padding:50px 50px 20px 50px; box-sizing:border-box; overflow:auto; white-space:pre-wrap; font-size:14px; line-height:1.4em; backface-visibility:hidden; transform-style:preserve-3d; transition: transform 0.6s; outline:none; text-align: left;}
.editor { background:#111216; background-color: rgba(17, 18, 22, 0.5);  color:pink;}
.text-editor {   background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); color:black; transform:rotateY(-180deg); }
#control-bar { display:none; position:absolute; top:10px; left:50%; transform:translateX(-50%); width:270px; height:30px; background:rgba(0,0,0,0.5); border-radius:5px; display:flex; justify-content:center; gap:5px; align-items:center; color:white; z-index:10;}
#control-bar select { padding:2px; border-radius:3px;}

#bleft { left:10px; }
#bright { right:10px; } 
<div id="tous">
<div id="control-bar">
  <select id="font-size">
    <option value="12px">12</option>
    <option value="14px">14</option>
    <option value="16px">16</option>
    <option value="18px">18</option>
  </select>
  <select id="font-color">
    <option value="black">Black</option>
    <option value="red">Red</option>
    <option value="blue">Blue</option>
    <option value="skyblue">SkyBlue</option>
  </select>
  <select id="font-family">
    <option value="Arial">Arial</option>
    <option value="Chalkduster">Chalkduster</option>
    <option value="Baskerville">Baskerville</option>
    <option value="'Big Caslon'">Big Caslon</option>
    <option value="Papyrus">Papyrus</option>
  </select>
</div>const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');

let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';
let currentFontFamily = localStorage.getItem('text-font-family') || 'Arial';

if (localStorage.getItem('code')) {
  editor.innerText = localStorage.getItem('code');
}
if (localStorage.getItem('text')) {
  textEditor.innerHTML = localStorage.getItem('text');
}

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
fontFamily.value = currentFontFamily;
controlBar.style.display = 'none';

function applyStyleToSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0 && sel.toString() !== '') {
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = currentFontColor;
    span.style.fontSize = currentFontSize;
    span.style.fontFamily = currentFontFamily;
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

textEditor.addEventListener('keydown', (e) => {
  const isPrintable = e.key.length === 1;
  if (!inTextMode || !isPrintable) return;

  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = currentFontColor;
    span.style.fontSize = currentFontSize;
    span.style.fontFamily = currentFontFamily;
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

fontSize.addEventListener('change', () => {
  currentFontSize = fontSize.value;
  localStorage.setItem('text-font-size', currentFontSize);
  applyStyleToSelection();
});
fontColor.addEventListener('change', () => {
  currentFontColor = fontColor.value;
  localStorage.setItem('text-font-color', currentFontColor);
  applyStyleToSelection();
});
fontFamily.addEventListener('change', () => {
  currentFontFamily = fontFamily.value;
  localStorage.setItem('text-font-family', currentFontFamily);
  applyStyleToSelection();
});

bleft.addEventListener('click', () => {
  const isText = inTextMode;
  const content = isText ? textEditor.innerText : editor.innerText;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = isText ? 'text.txt' : 'code.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

bright.addEventListener('click', () => {
  if (!inTextMode) {
    editor.style.transform = 'rotateY(-180deg)';
    textEditor.style.transform = 'rotateY(0deg)';
    controlBar.style.display = 'flex';
    inTextMode = true;
    bright.textContent = 'Code';
  } else {
    editor.style.transform = 'rotateY(0deg)';
    textEditor.style.transform = 'rotateY(-180deg)';
    controlBar.style.display = 'none';
    inTextMode = false;
    bright.textContent = 'Text';
  }
});

editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

/* ---------- AJOUT AUTOMATIQUE DU TEXTE PAR DÉFAUT ---------- */
function checkEditorContent() {
  // Vérifie si le contenu est vide ou seulement des espaces
  if (editor.innerText.trim() === '') {
    editor.innerText = "void setup() {\n\n}";
  }
}

// Déclenche à chaque modification du contenu
editor.addEventListener('input', () => {
  setTimeout(checkEditorContent, 100);
});

// Vérifie aussi au chargement initial
window.addEventListener('load', () => {
  if (
    !localStorage.getItem('code') ||
    localStorage.getItem('code').trim() === ''
  ) {
    editor.innerText = "void setup() {\n\n}";
  }
});
