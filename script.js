const editor = document.getElementById('editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');

// Sauvegarde régulière du contenu
setInterval(() => {
  localStorage.setItem('code', editor.innerHTML);
}, 3000);

// ---------- Gestion du caret ----------
function saveCaretPosition(containerEl) {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    return preSelectionRange.toString().length;
  }
  return 0;
}

function restoreCaretPosition(containerEl, charIndex) {
  const nodeStack = [containerEl];
  let node, stop = false;
  let chars = 0;

  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === 3) { // Text node
      const nextChars = chars + node.length;
      if (charIndex <= nextChars) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(node, charIndex - chars);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        stop = true;
      }
      chars = nextChars;
    } else {
      let i = node.childNodes.length;
      while (i--) nodeStack.push(node.childNodes[i]);
    }
  }
}

// ---------- Coloration dynamique ----------
function colorVoidInEditor() {
  const caretPos = saveCaretPosition(editor);
  let html = editor.innerHTML;
  html = html.replace(/\bvoid\b/g, '<span style="color:blue;">void</span>');
  editor.innerHTML = html;
  restoreCaretPosition(editor, caretPos);
}

// ---------- Template par défaut ----------
function insertColoredTemplate() {
  editor.innerHTML =
    '<span style="color:blue;">void</span> ' +
    '<span style="color:orange;">setup</span>() {<br><br>}<br><br><br>' +
    '<span style="color:blue;">void</span> ' +
    '<span style="color:orange;">loop</span>() {<br><br>}';
}

// ---------- Vérification du contenu ----------
function checkEditorContent() {
  if (editor.innerText.trim() === '') {
    insertColoredTemplate();
  }
}

// ---------- Événements ----------
editor.addEventListener('input', () => {
  setTimeout(() => {
    checkEditorContent();
    colorVoidInEditor();
  }, 50);
});

// ---------- Initialisation ----------
window.addEventListener('load', () => {
  if (!localStorage.getItem('code') || localStorage.getItem('code').trim() === '') {
    insertColoredTemplate();
  }
  colorVoidInEditor();
});

// ---------- Boutons ----------
bleft.addEventListener('click', () => {
  const content = editor.innerText;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'code.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

bright.addEventListener('click', () => {
  // Ici tu peux gérer la bascule Code/Text si nécessaire
});

