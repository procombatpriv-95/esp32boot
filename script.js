const textEditor = document.getElementById('text-editor');
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

// 🔹 Restauration du code avec couleurs
if (localStorage.getItem('code')) {
  editor.innerHTML = localStorage.getItem('code'); 
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
    span.innerText = sel.toString();
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
    span.innerText = e.key;
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

// ✅ Sauvegarde régulière du contenu HTML
setInterval(() => {
  localStorage.setItem('code', editor.innerHTML);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

/* ---------- AJOUT AUTOMATIQUE DU TEMPLATE COLORÉ ---------- */
function insertColoredTemplate() {
  editor.innerHTML =
    '<span style="color:blue;">void</span> ' +
    '<span style="color:orange;">setup</span>() {<br><br>}<br><br><br>' +
    '<span style="color:blue;">void</span> ' +
    '<span style="color:orange;">loop</span>() {<br><br>}';
}

/* ---------- COLORATION DYNAMIQUE DE "void" AVEC CURSEUR ---------- */
function colorVoidInEditor() {
  const sel = window.getSelection();
  const range = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;

  let html = editor.innerHTML;
  html = html.replace(/\bvoid\b/g, '<span style="color:blue;">void</span>');

  if (editor.innerHTML !== html) {
    editor.innerHTML = html;
    // Restaurer la sélection/cursor
    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}

/* ---------- GESTION DU CONTENU ---------- */
function checkEditorContent() {
  if (editor.innerText.trim() === '') {
    insertColoredTemplate();
  }
}

// Déclenche à chaque saisie
editor.addEventListener('input', () => {
  setTimeout(() => {
    checkEditorContent();
    colorVoidInEditor();
  }, 100);
});

// Au chargement initial
window.addEventListener('load', () => {
  if (!localStorage.getItem('code') || localStorage.getItem('code').trim() === '') {
    insertColoredTemplate();
  }
  colorVoidInEditor();
});

