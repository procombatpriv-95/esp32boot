// ---------- RÉFÉRENCES ----------
const editor = document.getElementById('editor');
const textEditor = document.getElementById('text-editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');

if (!editor || !textEditor) {
  console.warn('Elements #editor et/ou #text-editor manquants — script arrêté.');
  // Ne pas lancer le reste si les éléments essentiels sont absents
  return;
}

// ---------- VARIABLES D'ÉTAT ----------
let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';
let currentFontFamily = localStorage.getItem('text-font-family') || 'Arial';
let lastRaw = '';

// initialise selects si présents
if (fontSize) fontSize.value = currentFontSize;
if (fontColor) fontColor.value = currentFontColor;
if (fontFamily) fontFamily.value = currentFontFamily;
if (controlBar) controlBar.style.display = 'none';

// overflow
editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// restaure contenu depuis localStorage si présent
if (localStorage.getItem('code')) {
  editor.innerText = localStorage.getItem('code');
}
if (localStorage.getItem('text')) {
  textEditor.innerHTML = localStorage.getItem('text');
}

/* ---------- COLORATION SYNTAXIQUE ---------- */
/**
 * Prend un texte brut (avec \n) et renvoie du HTML
 * avec spans colorés. On échappe d'abord le HTML.
 */
function colorizeCode(text) {
  // on ne modifie pas les retours ligne : CSS white-space: pre-wrap gèrera l'affichage
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // applique coloration (ordre non critique ici)
  return escaped
    .replace(/\bvoid\b/g, '<span style="color:#4da6ff;">void</span>')
    .replace(/\b(setup|loop)\b/g, '<span style="color:orange;">$1</span>')
    .replace(/(\(|\))/g, '<span style="color:#ff66cc;">$1</span>');
}

/* ---------- SAUVEGARDE / RESTITUTION DE LA SÉLECTION (offset caractères) ----------
   Méthode : on calcule l'offset caractère dans le texte (innerText) avant la mise à jour,
   on remet l'innerHTML coloré, puis on parcourt les nœuds textes pour retrouver la position. */

/** Renvoie { start, end, collapsed } en nombre de caractères depuis le début du container */
function getSelectionCharacterOffsetsWithin(element) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return { start: 0, end: 0, collapsed: true };

  const range = sel.getRangeAt(0);
  // calcul start
  const preStart = range.cloneRange();
  preStart.selectNodeContents(element);
  preStart.setEnd(range.startContainer, range.startOffset);
  const start = preStart.toString().length;

  // calcul end
  const preEnd = range.cloneRange();
  preEnd.selectNodeContents(element);
  preEnd.setEnd(range.endContainer, range.endOffset);
  const end = preEnd.toString().length;

  return { start, end, collapsed: sel.isCollapsed };
}

/**
 * Restaure la sélection à partir d'offsets caractères.
 * Fonction tolérante : si le offset dépasse, place à la fin.
 */
function setSelectionCharacterOffsets(element, offsets) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node = walker.nextNode();
  let accumulated = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;

  while (node) {
    const nodeLen = node.textContent.length;
    const nodeEnd = accumulated + nodeLen;

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

  // fallback : si pas trouvé, place à la fin
  if (!startNode) {
    // essayer dernier nœud texte
    let lastText = null;
    const w2 = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let n2;
    while ((n2 = w2.nextNode())) lastText = n2;
    if (lastText) {
      startNode = lastText;
      startOffset = lastText.textContent.length;
    } else {
      // aucun nœud texte (cas improbable) : placer sur l'élément
      element.focus();
      return;
    }
  }

  if (!endNode) {
    endNode = startNode;
    endOffset = startOffset;
  }

  const range = document.createRange();
  range.setStart(startNode, Math.min(startOffset, startNode.textContent.length));
  range.setEnd(endNode, Math.min(endOffset, endNode.textContent.length));

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ---------- MISE À JOUR (recoloration + restauration du curseur) ---------- */
function updateHighlight() {
  // Sauvegarde offset AVANT la transformation
  const offsets = getSelectionCharacterOffsetsWithin(editor);
  const raw = editor.innerText; // texte brut contenant \n

  // optimisation : si rien n'a changé ne pas toucher au DOM
  if (raw === lastRaw) return;
  lastRaw = raw;

  // on remplace l'HTML par la version colorée
  // IMPORTANT : la coloration garde les \n dans le texte (CSS pre-wrap affichera les sauts)
  editor.innerHTML = colorizeCode(raw);

  // Restore selection à l'offset précédemment calculé
  try {
    setSelectionCharacterOffsets(editor, offsets);
  } catch (e) {
    // fallback : mettre le caret à la fin si erreur
    const r = document.createRange();
    const sel = window.getSelection();
    r.selectNodeContents(editor);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

/* ---------- GESTION DU MODE TEXTE (appliquer style à la sélection) ---------- */
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

    // replace selection après l'insertion
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

// Interception des frappes dans text-editor pour appliquer le style caractère par caractère
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

/* ---------- GESTION DES SELECTS (font size/color/family) ---------- */
if (fontSize) {
  fontSize.addEventListener('change', () => {
    currentFontSize = fontSize.value;
    localStorage.setItem('text-font-size', currentFontSize);
    applyStyleToSelection();
  });
}
if (fontColor) {
  fontColor.addEventListener('change', () => {
    currentFontColor = fontColor.value;
    localStorage.setItem('text-font-color', currentFontColor);
    applyStyleToSelection();
  });
}
if (fontFamily) {
  fontFamily.addEventListener('change', () => {
    currentFontFamily = fontFamily.value;
    localStorage.setItem('text-font-family', currentFontFamily);
    applyStyleToSelection();
  });
}

/* ---------- BOUTONS (download / toggle Text/Code) ---------- */
if (bleft) {
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
}

if (bright) {
  bright.addEventListener('click', () => {
    if (!inTextMode) {
      // show text editor
      editor.style.transform = 'rotateY(-180deg)';
      textEditor.style.transform = 'rotateY(0deg)';
      if (controlBar) controlBar.style.display = 'flex';
      inTextMode = true;
      bright.textContent = 'Code';
    } else {
      // show code editor
      editor.style.transform = 'rotateY(0deg)';
      textEditor.style.transform = 'rotateY(-180deg)';
      if (controlBar) controlBar.style.display = 'none';
      inTextMode = false;
      bright.textContent = 'Text';
    }
  });
}

/* ---------- CONTENU PAR DÉFAUT & CHECK ---------- */
function checkEditorContent() {
  if (editor.innerText.trim() === '') {
    editor.innerText = "void setup() {\n\n}\n\nvoid loop() {\n\n}";
    // on recolore ensuite
    setTimeout(updateHighlight, 0);
  }
}

// Sur input : on attend la fin du cycle d'événements pour que Enter soit traité par le navigateur
editor.addEventListener('input', () => {
  setTimeout(updateHighlight, 0);
  // small delay pour checkEditorContent (si tu supprimes tout)
  setTimeout(checkEditorContent, 100);
});

// aussi on sauvegarde le contenu textEditor si on édite dedans
textEditor.addEventListener('input', () => {
  // pas de recoloration côté textEditor : il conserve son style natif
  localStorage.setItem('text', textEditor.innerHTML);
});

// initialisation au chargement
window.addEventListener('load', () => {
  const saved = localStorage.getItem('code');
  if (saved && saved.trim() !== "") {
    editor.innerText = saved;
  } else {
    editor.innerText = "void setup() {\n\n}\n\nvoid loop() {\n\n}";
  }
  // recolore et restaure caret correctement
  updateHighlight();
});

/* ---------- SAUVEGARDE PÉRIODIQUE ---------- */
setInterval(() => {
  try {
    localStorage.setItem('code', editor.innerText);
    localStorage.setItem('text', textEditor.innerHTML);
  } catch (e) {
    // ignore (p.ex. localStorage plein)
  }
}, 3000);
