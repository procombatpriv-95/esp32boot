const editorInput = document.getElementById('editorInput');
const editorDisplay = document.getElementById('editorDisplay');
const textEditor = document.getElementById('text-editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');

let inTextMode = false;
let currentFontSize = localStorage.getItem('text-font-size') || '14px';
let currentFontColor = localStorage.getItem('text-font-color') || 'black';

// Charger le contenu sauvegardé
if(localStorage.getItem('code')) editorInput.value = localStorage.getItem('code');
if(localStorage.getItem('text')) textEditor.innerHTML = localStorage.getItem('text');

fontSize.value = currentFontSize;
fontColor.value = currentFontColor;
controlBar.style.display = 'none';

// ========================= HIGHLIGHTING =========================
function highlight(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\bvoid\b/g, '<span style="color:blue;">void</span>')
        .replace(/\b(loop\(\)|setup\(\))\b/g, '<span style="color:orange;">$1</span>');
}

function updateDisplay() {
    editorDisplay.innerHTML = highlight(editorInput.value);
}

// Initial display
updateDisplay();

// Mettre à jour à chaque frappe
editorInput.addEventListener('input', updateDisplay);

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
    const content = isText ? textEditor.innerText : editorInput.value;

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
        editorInput.style.display = 'none';
        editorDisplay.style.display = 'none';
        textEditor.style.transform='rotateY(0deg)';
        controlBar.style.display='flex';
        inTextMode = true;
        bright.textContent='Code';
    } else {
        editorInput.style.display = 'block';
        editorDisplay.style.display = 'block';
        textEditor.style.transform='rotateY(-180deg)';
        controlBar.style.display='none';
        inTextMode = false;
        bright.textContent='Text';
    }
});

// ========================= SCROLL =========================
editorInput.style.overflowX = 'auto';
editorDisplay.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// ========================= AUTO-SAVE =========================
setInterval(() => {
    localStorage.setItem('code', editorInput.value);
    localStorage.setItem('text', textEditor.innerHTML);
}, 4000);
