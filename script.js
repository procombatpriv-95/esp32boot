const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');

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

/* ---------- COLORATION ---------- */
function colorizeCode(text) {
  return text
    .replace(/(\(|\))/g, '<span style="color:#ff66cc;">$1</span>')
    .replace(/\b(setup|loop)\b/g, '<span style="color:orange;">$1</span>')
    .replace(/\bvoid\b/g, '<span style="color:#4da6ff;">void</span>');
}

/* ---------- CURSEUR ---------- */
function getCaretCharacterOffsetWithin(element) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function setCaretCharacterOffsetWithin(element, offset) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node = walker.nextNode();
  let count = 0;

  while (node) {
    const len = node.textContent.length;
    if (count + len >= offset) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(node, offset - count);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    count += len;
    node = walker.nextNode();
  }

  // fallback si plus court
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ---------- COLORATION + CURSEUR ---------- */
let lastRaw = '';
function updateHighlight() {
  const raw = editor.innerText
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  if (raw === lastRaw) return;

  // position du curseur avant la recoloration
  const caretOffset = getCaretCharacterOffsetWithin(editor);

  editor.innerHTML = colorizeCode(raw);

  // restaurer le curseur exactement au même caractère
  setCaretCharacterOffsetWithin(editor, caretOffset);

  lastRaw = raw;
}

/* ---------- CONTENU PAR DÉFAUT ---------- */
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

/* ---------- ÉVÉNEMENTS ---------- */
// !!! Correction : utilise la position de caret en caractères
editor.addEventListener('input', () => {
  setTimeout(updateHighlight, 0);
  setTimeout(checkEditorContent, 100);
});

// saisie texte (mode Text)
textEditor.addEventListener('keydown', (e) => {
  const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey;
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

/* ---------- SELECTS ---------- */
fontSize.addEventListener('change', () => {
  currentFontSize = fontSize.value;
  localStorage.setItem('text-font-size', currentFontSize);
});
fontColor.addEventListener('change', () => {
  currentFontColor = fontColor.value;
  localStorage.setItem('text-font-color', currentFontColor);
});
fontFamily.addEventListener('change', () => {
  currentFontFamily = fontFamily.value;
  localStorage.setItem('text-font-family', currentFontFamily);
});

/* ---------- BOUTONS ---------- */
bleft.addEventListener('click', () => {
  const content = inTextMode ? textEditor.innerText : editor.innerText;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = inTextMode ? 'text.txt' : 'code.txt';
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
    textEditor.focus();
  } else {
    editor.style.transform = 'rotateY(0deg)';
    textEditor.style.transform = 'rotateY(-180deg)';
    controlBar.style.display = 'none';
    inTextMode = false;
    bright.textContent = 'Text';
    editor.focus();
    setTimeout(updateHighlight, 0);
  }
});

/* ---------- SAUVEGARDE ---------- */
setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);


