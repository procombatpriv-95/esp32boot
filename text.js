

// ===== VARIABLES GLOBALES =====
let inTextMode = false;
let currentFontSize = '14px';
let currentFontColor = 'black';
let currentFontFamily = 'Arial';

// ===== COMMUNICATION ESP32 =====
async function saveToESP32(data) {
    try {
        const response = await fetch('/save?data=' + encodeURIComponent(JSON.stringify(data)), {method: 'GET'});
        return response.ok ? await response.json() : {success: false};
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        return {success: false};
    }
}

async function loadFromESP32() {
    try {
        const response = await fetch('/load');
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error('Erreur chargement:', error);
        return null;
    }
}

// ===== GESTIONNAIRE DE FICHIERS =====
const fileManager = {
    currentPath: ['Racine'], selectedItem: null, currentFile: null,
    fileSystem: {'Racine': {type: 'folder', children: {}}},
    
    async init() {
        const savedData = await loadFromESP32();
        if (savedData?.fileSystem) {
            this.fileSystem = savedData.fileSystem;
            this.currentPath = savedData.currentPath || ['Racine'];
            this.selectedItem = savedData.selectedItem;
        }
        this.bindEvents();
        this.render();
        if (savedData?.lastOpenFile) this.openFileByPath(savedData.lastOpenFile);
    },
    
    bindEvents() {
        document.getElementById('add-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleActionButtons();
        });
        
        const actions = {
            'back-button': () => this.currentPath.length > 1 && (this.currentPath.pop(), this.selectedItem = null, this.render(), this.saveToESP32()),
            'add-folder': () => this.createFolder(),
            'add-file': () => this.createFile(),
            'add-ino': () => this.createInoFile(),
            'delete-item': () => this.deleteSelectedItem(),
            'rename-item': () => this.renameCurrentItem()
        };
        
        Object.entries(actions).forEach(([id, action]) => {
            document.getElementById(id).addEventListener('click', (e) => { e.stopPropagation(); action(); });
        });
    },
    
    createFolder() {
        const currentFolder = this.getCurrentFolder();
        let folderNumber = 1, folderName = `Nouveau dossier ${folderNumber}`;
        while (currentFolder.children[folderName]) folderName = `Nouveau dossier ${++folderNumber}`;
        currentFolder.children[folderName] = {type: 'folder', children: {}};
        this.selectedItem = folderName;
        this.render(); this.saveToESP32();
    },
    
    createFile() {
        const currentFolder = this.getCurrentFolder();
        let fileNumber = 1, fileName = `Nouveau fichier ${fileNumber}.txt`;
        while (currentFolder.children[fileName]) fileName = `Nouveau fichier ${++fileNumber}.txt`;
        currentFolder.children[fileName] = {type: 'file', content: '', style: {fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily}};
        this.selectedItem = fileName; this.render(); this.saveToESP32(); this.openFile(fileName);
    },

    createInoFile() {
        const currentFolder = this.getCurrentFolder();
        let fileNumber = 1, fileName = `Nouveau_sketch_${fileNumber}.ino`;
        while (currentFolder.children[fileName]) fileName = `Nouveau_sketch_${++fileNumber}.ino`;
        currentFolder.children[fileName] = {type: 'file', content: 'void setup() {\n  // Initialisation\n}\n\nvoid loop() {\n  // Code principal\n}', style: {fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily}};
        this.selectedItem = fileName; this.render(); this.saveToESP32(); this.openInoFile(fileName);
    },

    openFile(fileName) {
        const file = this.getCurrentFolder().children[fileName];
        if (file?.type === 'file') {
            if (this.currentFile) this.saveCurrentFile();
            if (!inTextMode && bright) bright.click();
            this.currentFile = {path: [...this.currentPath], name: fileName};
            if (textEditor) textEditor.innerHTML = file.content || '';
            if (file.style) {
                currentFontSize = file.style.fontSize || currentFontSize;
                currentFontColor = file.style.fontColor || currentFontColor;
                currentFontFamily = file.style.fontFamily || currentFontFamily;
                if (fontSize) fontSize.value = currentFontSize;
                if (fontColor) fontColor.value = currentFontColor;
                if (fontFamily) fontFamily.value = currentFontFamily;
            }
            this.saveLastOpenFile(); this.render();
        }
    },

    openInoFile(fileName) {
        const file = this.getCurrentFolder().children[fileName];
        if (file?.type === 'file' && fileName.endsWith('.ino')) {
            if (this.currentFile) this.saveCurrentFile();
            if (inTextMode && bright) bright.click();
            this.currentFile = {path: [...this.currentPath], name: fileName};
            if (editor) editor.innerHTML = file.content || '';
            this.saveLastOpenFile(); this.render();
        }
    },

    getCurrentFolder() {
        let current = this.fileSystem['Racine'];
        for (let i = 1; i < this.currentPath.length; i++) current = current.children[this.currentPath[i]];
        return current;
    },

    async saveCurrentFile() {
        if (this.currentFile) {
            let current = this.fileSystem['Racine'];
            for (let i = 1; i < this.currentFile.path.length; i++) current = current.children[this.currentFile.path[i]];
            if (current.children[this.currentFile.name]?.type === 'file') {
                current.children[this.currentFile.name].content = this.currentFile.name.endsWith('.ino') ? (editor?.innerHTML || '') : (textEditor?.innerHTML || '');
                current.children[this.currentFile.name].style = {fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily};
                await this.saveToESP32();
            }
        }
    },

    render() {
        const fileContent = document.getElementById('file-content');
        const backButton = document.getElementById('back-button');
        if (backButton) backButton.style.display = this.currentPath.length > 1 ? 'flex' : 'none';
        if (fileContent) {
            fileContent.innerHTML = '';
            const items = Object.keys(this.getCurrentFolder().children);
            if (items.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; color: rgba(255,255,255,0.5); padding: 20px;';
                emptyMsg.textContent = 'Dossier vide';
                fileContent.appendChild(emptyMsg);
            } else {
                items.forEach(name => {
                    const item = this.getCurrentFolder().children[name];
                    const element = document.createElement('div');
                    element.className = item.type === 'folder' ? 'folder-item' : 'file-item';
                    if (this.selectedItem === name) element.classList.add('selected');
                    if (this.currentFile?.name === name && JSON.stringify(this.currentFile.path) === JSON.stringify(this.currentPath)) {
                        element.style.background = 'rgba(0, 255, 0, 0.3)'; element.style.border = '2px solid green';
                    }
                    const emoji = document.createElement('div');
                    emoji.className = item.type === 'folder' ? 'folder-emoji' : 'file-emoji';
                    emoji.textContent = item.type === 'folder' ? '📁' : (name.endsWith('.ino') ? '</>' : '📄');
                    const nameElement = document.createElement('div');
                    nameElement.className = item.type === 'folder' ? 'folder-name' : 'file-name';
                    nameElement.textContent = name;
                    element.appendChild(emoji); element.appendChild(nameElement);
                    element.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (e.detail === 1) {
                            this.selectItem(name);
                            if (item.type === 'file') name.endsWith('.ino') ? this.openInoFile(name) : this.openFile(name);
                        } else if (e.detail === 2 && item.type === 'folder') {
                            this.currentPath.push(name); this.selectedItem = null; this.render(); this.saveToESP32();
                        }
                    });
                    fileContent.appendChild(element);
                });
            }
        }
    },

    async saveToESP32() { await saveToESP32({fileSystem: this.fileSystem, currentPath: this.currentPath, selectedItem: this.selectedItem}); },
    async saveLastOpenFile() { if (this.currentFile) await saveToESP32({lastOpenFile: this.currentFile}); },
    async getLastOpenFile() { const data = await loadFromESP32(); return data?.lastOpenFile || null; },
    selectItem(name) { this.selectedItem = this.selectedItem === name ? null : name; this.render(); }
};

// ===== INITIALISATION =====
const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');

if (controlBar) controlBar.style.display = 'none';

textEditor?.addEventListener('input', () => fileManager.saveCurrentFile());
editor?.addEventListener('input', () => fileManager.saveCurrentFile());

[fontSize, fontColor, fontFamily].forEach(el => el?.addEventListener('change', () => {
    if (el === fontSize) currentFontSize = el.value;
    if (el === fontColor) currentFontColor = el.value;
    if (el === fontFamily) currentFontFamily = el.value;
    fileManager.saveCurrentFile();
}));

bleft?.addEventListener('click', () => {
    fileManager.saveCurrentFile();
    const content = inTextMode ? textEditor?.innerText : editor?.innerText;
    const filename = fileManager.currentFile ? 
        (inTextMode ? (fileManager.currentFile.name.endsWith('.txt') ? fileManager.currentFile.name : fileManager.currentFile.name.split('.')[0] + '.txt') : 
         (fileManager.currentFile.name.endsWith('.ino') ? fileManager.currentFile.name : 'sketch.ino')) : 
        (inTextMode ? 'document.txt' : 'sketch.ino');
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

bright?.addEventListener('click', () => {
    if (!inTextMode) {
        editor.style.transform = 'rotateY(-180deg)'; textEditor.style.transform = 'rotateY(0deg)';
        controlBar.style.display = 'flex'; inTextMode = true; bright.textContent = 'Code';
    } else {
        fileManager.saveCurrentFile();
        editor.style.transform = 'rotateY(0deg)'; textEditor.style.transform = 'rotateY(-180deg)';
        controlBar.style.display = 'none'; inTextMode = false; bright.textContent = 'Text';
    }
});

setInterval(() => fileManager.saveCurrentFile(), 3000);

window.addEventListener('load', () => {
    if (!editor?.innerText || editor.innerText.trim() === '') editor.innerText = "void setup() {\n\n}";
    fileManager.init();
});
