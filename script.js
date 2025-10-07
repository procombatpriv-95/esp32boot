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

// Charger le contenu sauvegardé
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

// Fonction pour colorier le code Arduino
function colorizeArduinoCode() {
  let content = editor.innerText;
  
  // Remplacer les mots-clés par des spans colorés
  content = content
    .replace(/\b(void)\b/g, '<span class="keyword-blue">$1</span>')
    .replace(/\b(setup|loop)\b/g, '<span class="keyword-orange">$1</span>')
    .replace(/(\{|\})/g, '<span class="bracket-white">$1</span>');
  
  editor.innerHTML = content;
  
  // Restaurer la position du curseur
  restoreCursorPosition();
}

// Sauvegarder la position du curseur
let cursorPosition = 0;

function saveCursorPosition() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    cursorPosition = preCaretRange.toString().length;
  }
}

// Restaurer la position du curseur
function restoreCursorPosition() {
  const textNode = getTextNodeAtPosition(editor, cursorPosition);
  if (textNode) {
    const range = document.createRange();
    range.setStart(textNode.node, textNode.position);
    range.collapse(true);
    
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Helper pour trouver la position du texte
function getTextNodeAtPosition(root, index) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentIndex = 0;
  let currentNode;
  
  while (currentNode = treeWalker.nextNode()) {
    const nodeLength = currentNode.textContent.length;
    if (index >= currentIndex && index <= currentIndex + nodeLength) {
      return {
        node: currentNode,
        position: index - currentIndex
      };
    }
    currentIndex += nodeLength;
  }
  return null;
}

// Appliquer les styles à la sélection
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

// Événements pour l'éditeur de texte
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

// Événements pour l'éditeur de code
editor.addEventListener('input', () => {
  saveCursorPosition();
  setTimeout(() => {
    colorizeArduinoCode();
    checkEditorContent();
  }, 10);
});

// Changer les polices et couleurs
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

// Bouton de sauvegarde
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

// Bouton de changement de mode
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

// Style pour le défilement horizontal
editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// Sauvegarde automatique
setInterval(() => {
  localStorage.setItem('code', editor.innerHTML);
  localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

/* ---------- AJOUT AUTOMATIQUE DU TEXTE PAR DÉFAUT ---------- */
function checkEditorContent() {
  // Vérifie si le contenu est vide ou seulement des espaces
  if (editor.innerText.trim() === '') {
    editor.innerHTML = '<span class="keyword-blue">void</span> <span class="keyword-orange">setup</span><span class="bracket-white">{</span>\n\n<span class="bracket-white">}</span>\n\n<span class="keyword-blue">void</span> <span class="keyword-orange">loop</span><span class="bracket-white">{</span>\n\n<span class="bracket-white">}</span>';
  }
}

// Vérifie aussi au chargement initial
window.addEventListener('load', () => {
  if (
    !localStorage.getItem('code') ||
    localStorage.getItem('code').trim() === ''
  ) {
    editor.innerHTML = '<span class="keyword-blue">void</span> <span class="keyword-orange">setup</span><span class="bracket-white">{</span>\n\n<span class="bracket-white">}</span>\n\n<span class="keyword-blue">void</span> <span class="keyword-orange">loop</span><span class="bracket-white">{</span>\n\n<span class="bracket-white">}</span>';
  } else {
    // Appliquer la coloration au contenu existant
    colorizeArduinoCode();
  }
});

// Ajouter les styles CSS pour la coloration
const style = document.createElement('style');
style.textContent = `
  .keyword-blue {
    color: #4dabf7;
    font-weight: bold;
  }
  .keyword-orange {
    color: #ff922b;
    font-weight: bold;
  }
  .bracket-white {
    color: #ffffff;
    font-weight: bold;
  }
`;
document.head.appendChild(style);
