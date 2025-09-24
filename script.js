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

// 🔹 Restauration du code et du texte
if (localStorage.getItem('code')) editor.innerHTML = localStorage.getItem('code');
if (localStorage.getItem('text')) textEditor.innerHTML = localStorage.getItem('text');

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
fontFamily.value = currentFontFamily;
controlBar.style.display = 'none';

// Mise à jour initiale du caret et style du texte
textEditor.style.caretColor = currentFontColor;
textEditor.style.fontSize = currentFontSize;
textEditor.style.fontFamily = currentFontFamily;

// Appliquer les styles sélectionnés (pour les sélections existantes)
function applyStyleToSelection() {
  document.execCommand('foreColor', false, currentFontColor);
  document.execCommand('fontName', false, currentFontFamily);
  document.execCommand('fontSize', false, parseInt(currentFontSize));
}

// Gestion de la saisie dans textEditor
textEditor.addEventListener('keydown', (e) => {
  if (!inTextMode) return;

  if (e.key === 'Enter') {
    // Insère un saut de ligne correct
    document.execCommand('insertHTML', false, '<br>');
    e.preventDefault();
    return;
  }

  // Pour les touches imprimables
  if (e.key.length === 1) {
    document.execCommand('insertText', false, e.key);
    applyStyleToSelection();
    e.preventDefault();
  }
});

// 🔹 Mise à jour des styles en direct
fontSize.addEventListener('change', () => {
  currentFontSize = fontSize.value;
  localStorage.setItem('text-font-size', currentFontSize);
  applyStyleToSelection();
  textEditor.style.fontSize = currentFontSize;
});

fontColor.addEventListener('change', () => {
  currentFontColor = fontColor.value;
  localStorage.setItem('text-font-color', currentFontColor);
  applyStyleToSelection();
  textEditor.style.caretColor = currentFontColor;
});

fontFamily.addEventListener('change', () => {
  currentFontFamily = fontFamily.value;
  localStorage.setItem('text-font-family', currentFontFamily);
  applyStyleToSelection();
  textEditor.style.fontFamily = currentFontFamily;
});

// Gestion des boutons de téléchargement
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

// Bascule texte / code
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

/* ---------- COLORATION DYNAMIQUE DE "void" ---------- */
function colorVoidInEditor() {
  let html = editor.innerHTML;
  html = html.replace(/\bvoid\b/g, '<span style="color:blue;">void</span>');
  if (editor.innerHTML !== html) editor.innerHTML = html;
}

/* ---------- GESTION DU CONTENU ---------- */
function checkEditorContent() {
  if (editor.innerText.trim() === '') insertColoredTemplate();
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

