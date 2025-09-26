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

/* ---------- COLORATION SYNTAXIQUE JS ---------- */
function colorizeCode(text) {
  return text
    // parenthèses () → rose
    .replace(/(\(|\))/g, '<span style="color:#ff66cc;">$1</span>')
    // setup ou loop → orange
    .replace(/\b(setup|loop)\b/g, '<span style="color:orange;">$1</span>')
    // void → bleu
    .replace(/\bvoid\b/g, '<span style="color:#4da6ff;">void</span>');
}

/* ---------- MISE À JOUR AVEC COLORATION ---------- */
let lastRaw = '';
function updateHighlight() {
  const raw = editor.innerText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (raw === lastRaw) return; // rien n'a changé

  // sauvegarde position du curseur
  const sel = window.getSelection();
  const range = sel.rangeCount ? sel.getRangeAt(0) : null;
  const offsets = range ? getSelectionCharacterOffsetsWithin(editor) : null;

  // applique la coloration
  editor.innerHTML = colorizeCode(raw);

  // restaure le curseur
  if (offsets) {
    try {
      setSelectionCharacterOffsets(editor, offsets);
    } catch {
      placeCaretAtEnd(editor);
    }
  }
  lastRaw = raw;
}

/* ---------- UTILITAIRES DE CURSEUR ---------- */
function getSelectionCharacterOffsetsWithin(element) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;

  const preRangeEnd = range.cloneRange();
  preRangeEnd.selectNodeContents(element);
  preRangeEnd.setEnd(range.endContainer, range.endOffset);
  const end = preRangeEnd.toString().length;

  return { start, end };
}

function setSelectionCharacterOffsets(element, offsets) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
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
  range.setStart(startNode || element, startNode ? startOffset : element.childNodes.length);
  range.setEnd(endNode || element, endNode ? endOffset : element.childNodes.length);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ---------- COLORATION RETARDÉE POUR NE PAS CASSER ENTER ---------- */
let typingTimer;
editor.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(updateHighlight, 500); // coloration après 0,5s d'inactivité
});

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
editor.addEventListener('input', () => setTimeout(checkEditorContent, 100));

/* ---------- SAUVEGARDE ---------- */
setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

/* ---------- CONTRÔLES TEXTE ---------- */
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

/* ---------- BOUTONS ---------- */
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

