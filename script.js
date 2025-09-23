const editor = document.getElementById('editor');
const textEditor = document.getElementById('text-editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');

let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';

if(localStorage.getItem('code')) editor.textContent = localStorage.getItem('code');
if(localStorage.getItem('text')) textEditor.innerHTML = localStorage.getItem('text');

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
controlBar.style.display = 'none';

// ========================= HIGHLIGHT FUNCTION =========================
function highlightCode() {
    const selection = window.getSelection();
    const cursorPos = selection.getRangeAt(0).startOffset;

    // On récupère le texte brut
    const code = editor.textContent;

    // On applique le highlighting
    let highlighted = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\bvoid\b/g, '<span style="color:blue;">void</span>')
        .replace(/\b(loop\(\)|setup\(\))\b/g, '<span style="color:orange;">$1</span>');

    editor.innerHTML = highlighted;

    // On replace le curseur à la position précédente
    const range = document.createRange();
    const sel = window.getSelection();

    let node = editor.firstChild;
    let charIndex = 0;
    let found = false;

    function traverse(n) {
        if(n.nodeType === 3) { // text node
            if(cursorPos <= charIndex + n.length) {
                range.setStart(n, cursorPos - charIndex);
                found = true;
                return true;
            }
            charIndex += n.length;
        } else {
            for(let i=0; i<n.childNodes.length; i++) {
                if(traverse(n.childNodes[i])) return true;
            }
        }
    }

    traverse(editor);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

// ========================= INPUT EVENT =========================
editor.addEventListener('input', highlightCode);

// ========================= TEXT EDITOR =========================
textEditor.addEventListener('keydown', (e) => {
    const isPrintable = e.key.length === 1;
    if(!inTextMode || !isPrintable) return;

    const sel = window.getSelection();
    if(sel.rangeCount > 0){
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = currentFontColor;
        span.style.fontSize = currentFontSize;
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

function applyStyleToSelection() {
    const sel = window.getSelection();
    if(sel.rangeCount > 0 && sel.toString() !== ''){
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = currentFontColor;
        span.style.fontSize = currentFontSize;
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

// ========================= FONT SETTINGS =========================
fontSize.addEventListener('change', ()=>{
    currentFontSize = fontSize.value;
    localStorage.setItem('text-font-size', currentFontSize);
    applyStyleToSelection();
});

fontColor.addEventListener('change', ()=>{
    currentFontColor = fontColor.value;
    localStorage.setItem('text-font-color', currentFontColor);
    applyStyleToSelection();
});

// ========================= DOWNLOAD =========================
bleft.addEventListener('click', ()=>{
    const isText = inTextMode;
    const content = isText ? textEditor.innerText : editor.textContent;

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

// ========================= TOGGLE EDITOR =========================
bright.addEventListener('click', ()=>{
    if(!inTextMode){
        editor.style.transform='rotateY(-180deg)';
        textEditor.style.transform='rotateY(0deg)';
        controlBar.style.display='flex';
        inTextMode = true;
        bright.textContent='Code';
    } else {
        editor.style.transform='rotateY(0deg)';
        textEditor.style.transform='rotateY(-180deg)';
        controlBar.style.display='none';
        inTextMode = false;
        bright.textContent='Text';
    }
});

editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// ========================= AUTO-SAVE =========================
setInterval(() => {
    localStorage.setItem('code', editor.textContent);
    localStorage.setItem('text', textEditor.innerHTML);
}, 3000);

// ========================= INITIAL HIGHLIGHT =========================
highlightCode();
