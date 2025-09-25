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

function updateHighlight() {
  const raw = editor.innerText
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
  editor.innerHTML = colorizeCode(raw);
  placeCaretAtEnd(editor);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// déclenche la coloration à chaque saisie
editor.addEventListener('input', updateHighlight);

// ---------- CONTENU PAR DÉFAUT ----------
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

// ---------- SAUVEGARDE ----------
setInterval(() => {
  localStorage.setItem('code', editor.innerText);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);
