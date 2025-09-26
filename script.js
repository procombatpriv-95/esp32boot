const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
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

/* ---------- FONCTIONS DE SAUVEGARDE/RESTAURATION DU CURSEUR ---------- */
function getSelectionCharacterOffsetsWithin(element) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return { start: 0, end: 0, collapsed: true };
  const range = sel.getRangeAt(0);

  const preStart = range.cloneRange();
  preStart.selectNodeContents(element);
  preStart.setEnd(range.startContainer, range.startOffset);
  const start = preStart.toString().length;

  const preEnd = range.cloneRange();
  preEnd.selectNodeContents(element);
  preEnd.setEnd(range.endContainer, range.endOffset);
  const end = preEnd.toString().length;

  return { start, end, collapsed: sel.isCollapsed };
}

function setSelectionCharacterOffsets(element, offsets) {
  // parcourt les noeuds texte et localise start/end
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node = walker.nextNode();
  let accumulated = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;

  while (node) {
    const nodeEnd = accumulated + node.length;
    if (startNode === null && offsets.start <= nodeEnd) {
      startNode = node;
      startOffset = Math.max(0, offsets.start - accumulated);
    }
    if (endNode === null && offsets.end <= nodeEnd) {
      endNode = node;
      endOffset = Math.max(0, offsets.end - accumulated);
      break;
    }
    accumulated = nodeEnd;
    node = walker.nextNode();
  }

  const range = document.createRange();
  if (startNode) range.setStart(startNode, Math.min(startNode.length, startOffset));
  else range.setStart(element, element.childNodes.length);

  if (endNode) range.setEnd(endNode, Math.min(endNode.length, endOffset));
  else range.setEnd(element, element.childNodes.length);

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ---------- MISE À JOUR AVEC PRÉSERVATION DU CURSEUR ---------- */
let lastRaw = '';

function updateHighlight() {
  // échappe le HTML (pour éviter injection) puis recolore
  const raw = editor.innerText
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // si rien n'a changé, on ne touche pas au DOM (évite de casser la sélection)
  if (raw === lastRaw) return;

  // sauvegarde position/offset du curseur
  const offsets = getSelectionCharacterOffsetsWithin(editor);

  // remplace le HTML par le texte coloré
  editor.innerHTML = colorizeCode(raw);

  // restaure la sélection au même offset (ou met à la fin en fallback)
  try {
    setSelectionCharacterOffsets(editor, offsets);
  } catch (e) {
    placeCaretAtEnd(editor);
  }

  lastRaw = raw;
}

/* déclenche la coloration à chaque saisie */
editor.addEventListener('input', updateHighlight);

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
