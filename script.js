// === RÉFÉRENCES DES ÉLÉMENTS ===
const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
const bleft = document.getElementById('bleft');      // bouton gauche (save)
const bright = document.getElementById('bright');    // bouton droit (switch)
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');

// === VARIABLES ===
let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';
let currentFontFamily = localStorage.getItem('text-font-family') || 'Arial';

// === RESTAURATION LOCALSTORAGE ===
if (localStorage.getItem('code')) editor.innerText = localStorage.getItem('code');
if (localStorage.getItem('text')) textEditor.innerHTML = localStorage.getItem('text');

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
fontFamily.value = currentFontFamily;
controlBar.style.display = 'none';

// === COLORATION SYNTAXIQUE ===
function colorizeCode(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // parenthèses
    .replace(/(\(|\))/g, '<span style="color:#ff66cc;">$1</span>')
    // setup / loop
    .replace(/\b(setup|loop)\b/g, '<span style="color:orange;">$1</span>')
    // void
    .replace(/\bvoid\b/g, '<span style="color:#4da6ff;">void</span>');
}

// === OUTILS CURSEUR ===
function getSelectionOffsets(el) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);

  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;

  const preEnd = range.cloneRange();
  preEnd.selectNodeContents(el);
  preEnd.setEnd(range.endContainer, range.endOffset);
  const end = preEnd.toString().length;

  return { start, end };
}

function setSelectionOffsets(el, offsets) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  let node, startNode, endNode;
  let accumulated = 0;
  let startOffset = 0, endOffset = 0;

  while ((node = walker.nextNode())) {
    const nodeEnd = accumulated + node.length;
    if (!startNode && offsets.start <= nodeEnd) {
      startNode = node;
      startOffset = offsets.start - accumulated;
    }
    if (!endNode && offsets.end <= nodeEnd) {
      endNode = node;
      endOffset = offsets.end - accumulated;
      break;
    }
    accumulated = nodeEnd;
  }

  const range = document.createRange();
  range.setStart(startNode || el, startNode ? startOffset : el.childNodes.length);
  range.setEnd(endNode || el, endNode ? endOffset : el.childNodes.length);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// === COLORATION + RESTAURATION CURSEUR ===
let lastRaw = '';

function updateHighlight() {
  const raw = editor.innerText.replace(/\r/g, '');
  if (raw === lastRaw) return;

  const offsets = getSelectionOffsets(editor);
  editor.innerHTML = colorizeCode(raw);

  try {
    setSelectionOffsets(editor, offsets);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  lastRaw = raw;
}

// === GESTION SAISIE ===
editor.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    // attendre que le navigateur crée la nouvelle ligne
    setTimeout(updateHighlight, 0);
  }
});
editor.addEventListener('input', () => {
  setTimeout(updateHighlight, 0);
});

// === CONTENU PAR DÉFAUT ===
function checkEditorContent() {
  if (editor.innerText.trim() === '') {
    editor.innerText = "void setup() {\n\n}\n\nvoid loop() {\n\n}";
    updateHighlight();
  }
}
window.addEventListener('load', () => {
  if (!localStorage.getItem('code') || localStorage.getItem('code').trim() === '') {
    editor.innerText = "void setup() {\n\n}\n\nvoid loop() {\n\n}";
  }
  updateHighlight();
});
editor.addEventListener('input', () => setTimeout(checkEditorContent, 100));

// === SAUVEGARDE AUTOMATIQUE ===
setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

// === MODE TEXTE : STYLE SUR LA SÉLECTION ===
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

// === BOUTON SAVE (gauche) ===
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

// === BOUTON SWITCH (droit) ===
bright.addEventListener('click', () => {
  if (!inTextMode) {
    // passage en mode Texte
    editor.style.transform = 'rotateY(-180deg)';
    textEditor.style.transform = 'rotateY(0deg)';
    controlBar.style.display = 'flex';
    inTextMode = true;
    bright.textContent = 'Code';
  } else {
    // retour au mode Code
    editor.style.transform = 'rotateY(0deg)';
    textEditor.style.transform = 'rotateY(-180deg)';
    controlBar.style.display = 'none';
    inTextMode = false;
    bright.textContent = 'Text';
  }
});

// === SCROLL HORIZONTAL ===
editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

