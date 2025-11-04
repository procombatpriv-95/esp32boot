// ===== VARIABLES GLOBALES =====

async function loadFromESP32() {
    try {
        const response = await fetch('/load');
        return await response.json();
    } catch (error) {
        console.error('Erreur chargement ESP32:', error);
        return null;
    }
}

// ===== GESTIONNAIRE DE FICHIERS =====
const fileManager = {
    currentPath: ['Racine'],
    selectedItem: null,
    currentFile: null,
    fileSystem: {
        'Racine': {
            type: 'folder',
            children: {}
        }
    },
    
    async init() {
        await this.loadFromESP32();
        this.bindEvents();
        this.render();
        const lastFile = await this.getLastOpenFile();
        if (lastFile) {
            this.openFileByPath(lastFile);
        }
    },
    
    bindEvents() {
        document.getElementById('add-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleActionButtons();
        });
        
        document.getElementById('back-button').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentPath.length > 1) {
                this.currentPath.pop();
                this.selectedItem = null;
                this.render();
                this.saveToESP32();
            }
        });
        
        document.getElementById('add-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            this.createFolder();
        });
        
        document.getElementById('add-file').addEventListener('click', (e) => {
            e.stopPropagation();
            this.createFile();
        });
        
        document.getElementById('add-ino').addEventListener('click', (e) => {
            e.stopPropagation();
            this.createInoFile();
        });
        
        document.getElementById('delete-item').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteSelectedItem();
        });

        document.getElementById('rename-item').addEventListener('click', (e) => {
            e.stopPropagation();
            this.renameCurrentItem();
        });

        // Événements pour la modal de renommage
        document.getElementById('rename-confirm').addEventListener('click', () => {
            this.confirmRename();
        });

        document.getElementById('rename-cancel').addEventListener('click', () => {
            this.hideRenameModal();
        });

        document.getElementById('rename-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmRename();
            }
        });

        document.getElementById('rename-modal').addEventListener('click', (e) => {
            if (e.target.id === 'rename-modal') {
                this.hideRenameModal();
            }
        });
    },
    
    toggleActionButtons() {
        const actionButtons = document.getElementById('action-buttons');
        const isShowing = actionButtons.style.display === 'flex';
        
        if (isShowing) {
            this.hideActionButtons();
        } else {
            this.showActionButtons();
        }
    },
    
    showActionButtons() {
        const actionButtons = document.getElementById('action-buttons');
        actionButtons.style.display = 'flex';
        
        const buttons = actionButtons.querySelectorAll('button');
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.add('show');
            }, index * 100);
        });
    },
    
    hideActionButtons() {
        const buttons = document.querySelectorAll('#action-buttons button');
        buttons.forEach(btn => {
            btn.classList.remove('show');
        });
        
        setTimeout(() => {
            document.getElementById('action-buttons').style.display = 'none';
        }, 300);
    },

    showRenameModal(oldName) {
        document.getElementById('rename-input').value = oldName;
        document.getElementById('rename-modal').style.display = 'flex';
        document.getElementById('rename-input').focus();
        document.getElementById('rename-input').select();
        this.renameOldName = oldName;
    },

    hideRenameModal() {
        document.getElementById('rename-modal').style.display = 'none';
        this.renameOldName = null;
    },

    confirmRename() {
        const newName = document.getElementById('rename-input').value.trim();
        if (newName && this.renameOldName) {
            this.renameItem(this.renameOldName, newName);
        }
        this.hideRenameModal();
    },

    renameCurrentItem() {
        if (this.selectedItem) {
            this.showRenameModal(this.selectedItem);
        } else if (this.currentPath.length > 1) {
            const currentFolderName = this.currentPath[this.currentPath.length - 1];
            this.showRenameModal(currentFolderName);
        }
    },
    
    getCurrentFolder() {
        let current = this.fileSystem['Racine'];
        for (let i = 1; i < this.currentPath.length; i++) {
            current = current.children[this.currentPath[i]];
        }
        return current;
    },

    getItemByPath(pathArray) {
        let current = this.fileSystem['Racine'];
        for (let i = 1; i < pathArray.length; i++) {
            if (current.children[pathArray[i]]) {
                current = current.children[pathArray[i]];
            } else {
                return null;
            }
        }
        return current;
    },

    getParentFolder() {
        if (this.currentPath.length <= 1) return null;
        
        let current = this.fileSystem['Racine'];
        for (let i = 1; i < this.currentPath.length - 1; i++) {
            current = current.children[this.currentPath[i]];
        }
        return current;
    },
    
    // ===== FONCTION CRÉER DOSSIER =====
    createFolder() {
        console.log("Création d'un nouveau dossier...");
        
        const currentFolder = this.getCurrentFolder();
        const existingFolders = Object.keys(currentFolder.children)
            .filter(name => currentFolder.children[name].type === 'folder' && name.startsWith('Nouveau dossier'));
        
        let folderNumber = 1;
        let folderName = `Nouveau dossier ${folderNumber}`;
        
        // Trouver le premier numéro disponible
        while (currentFolder.children[folderName]) {
            folderNumber++;
            folderName = `Nouveau dossier ${folderNumber}`;
        }
        
        // Créer le dossier
        currentFolder.children[folderName] = {
            type: 'folder',
            children: {}
        };
        
        this.selectedItem = folderName;
        this.render();
        this.saveToESP32();
        
        console.log("✅ Dossier créé:", folderName);
    },
    
    // ===== FONCTION CRÉER FICHIER =====
    createFile() {
        console.log("Création d'un nouveau fichier...");
        
        const currentFolder = this.getCurrentFolder();
        const existingFiles = Object.keys(currentFolder.children)
            .filter(name => currentFolder.children[name].type === 'file' && name.startsWith('Nouveau fichier'));
        
        let fileNumber = 1;
        let fileName = `Nouveau fichier ${fileNumber}.txt`;
        
        // Trouver le premier numéro disponible
        while (currentFolder.children[fileName]) {
            fileNumber++;
            fileName = `Nouveau fichier ${fileNumber}.txt`;
        }
        
        // Créer le fichier
        currentFolder.children[fileName] = {
            type: 'file',
            content: '',
            style: {
                fontSize: currentFontSize,
                fontColor: currentFontColor,
                fontFamily: currentFontFamily
            }
        };
        
        this.selectedItem = fileName;
        this.render();
        this.saveToESP32();
        
        // Ouvrir automatiquement le nouveau fichier
        this.openFile(fileName);
        
        console.log("✅ Fichier créé et ouvert:", fileName);
    },

    // ===== FONCTION POUR CRÉER .INO =====
    createInoFile() {
        console.log("Création d'un nouveau fichier .ino...");
        
        const currentFolder = this.getCurrentFolder();
        const existingFiles = Object.keys(currentFolder.children)
            .filter(name => currentFolder.children[name].type === 'file' && name.startsWith('Nouveau_sketch'));
        
        let fileNumber = 1;
        let fileName = `Nouveau_sketch_${fileNumber}.ino`;
        
        // Trouver le premier numéro disponible
        while (currentFolder.children[fileName]) {
            fileNumber++;
            fileName = `Nouveau_sketch_${fileNumber}.ino`;
        }
        
        // Contenu par défaut pour un fichier .ino
        const defaultInoContent = `void setup() {
  // Initialisation
}

void loop() {
  // Code principal
}`;
        
        // Créer le fichier .ino
        currentFolder.children[fileName] = {
            type: 'file',
            content: defaultInoContent,
            style: {
                fontSize: currentFontSize,
                fontColor: currentFontColor,
                fontFamily: currentFontFamily
            }
        };
        
        this.selectedItem = fileName;
        this.render();
        this.saveToESP32();
        
        // Ouvrir automatiquement le nouveau fichier .ino dans l'éditeur
        this.openInoFile(fileName);
        
        console.log("✅ Fichier .ino créé et ouvert:", fileName);
    },

    // ===== FONCTION POUR OUVRIR .INO DANS L'ÉDITEUR =====
    openInoFile(fileName) {
        const file = this.getCurrentFolder().children[fileName];
        if (file && file.type === 'file' && fileName.endsWith('.ino')) {
            // Sauvegarder le fichier actuel avant d'en ouvrir un nouveau
            if (this.currentFile) {
                this.saveCurrentFile();
            }

            // Basculer en mode éditeur (côté gauche) si nécessaire
            if (inTextMode && bright) {
                bright.click();
            }

            this.currentFile = {
                path: [...this.currentPath],
                name: fileName
            };

            if (editor) {
                editor.innerHTML = file.content || '';
            }
            
            this.saveLastOpenFile();
            this.render();
        }
    },
    
    deleteSelectedItem() {
        if (this.selectedItem) {
            const currentFolder = this.getCurrentFolder();
            const item = currentFolder.children[this.selectedItem];
            
            // Si on supprime le fichier actuellement ouvert
            if (this.currentFile && 
                this.currentFile.name === this.selectedItem && 
                JSON.stringify(this.currentFile.path) === JSON.stringify(this.currentPath)) {
                this.currentFile = null;
                textEditor.innerHTML = '';
                editor.innerHTML = '';
                this.saveLastOpenFile();
            }
            
            delete currentFolder.children[this.selectedItem];
            this.selectedItem = null;
            this.render();
            this.saveToESP32();
        } else if (this.currentPath.length > 1) {
            const folderName = this.currentPath.pop();
            const parentFolder = this.getCurrentFolder();
            delete parentFolder.children[folderName];
            
            this.selectedItem = null;
            this.render();
            this.saveToESP32();
        }
    },
    
    openSelectedItem() {
        if (!this.selectedItem) return;
        
        const item = this.getCurrentFolder().children[this.selectedItem];
        if (item.type === 'folder') {
            this.currentPath.push(this.selectedItem);
            this.selectedItem = null;
            this.render();
            this.saveToESP32();
        } else if (item.type === 'file') {
            // Si c'est un fichier .ino, l'ouvrir dans l'éditeur
            if (this.selectedItem.endsWith('.ino')) {
                this.openInoFile(this.selectedItem);
            } else {
                this.openFile(this.selectedItem);
            }
        }
    },

    openFile(fileName) {
        const file = this.getCurrentFolder().children[fileName];
        if (file && file.type === 'file') {
            // Sauvegarder le fichier actuel avant d'en ouvrir un nouveau
            if (this.currentFile) {
                this.saveCurrentFile();
            }

            // Basculer en mode texte si nécessaire
            if (!inTextMode && bright) {
                bright.click();
            }

            this.currentFile = {
                path: [...this.currentPath],
                name: fileName
            };

            if (textEditor) {
                textEditor.innerHTML = file.content || '';
            }
            
            // Appliquer les styles sauvegardés
            if (file.style) {
                currentFontSize = file.style.fontSize || currentFontSize;
                currentFontColor = file.style.fontColor || currentFontColor;
                currentFontFamily = file.style.fontFamily || currentFontFamily;
                
                if (fontSize) fontSize.value = currentFontSize;
                if (fontColor) fontColor.value = currentFontColor;
                if (fontFamily) fontFamily.value = currentFontFamily;
            }
            
            this.saveLastOpenFile();
            this.render();
        }
    },

    openFileByPath(fileInfo) {
        if (!fileInfo) return;
        
        // Naviguer vers le chemin du fichier
        this.currentPath = [...fileInfo.path];
        this.selectedItem = fileInfo.name;
        this.render();
        
        const file = this.getCurrentFolder().children[fileInfo.name];
        if (file && file.type === 'file') {
            // Si c'est un fichier .ino, l'ouvrir dans l'éditeur
            if (fileInfo.name.endsWith('.ino')) {
                if (inTextMode && bright) {
                    bright.click();
                }
                editor.innerHTML = file.content || '';
                this.currentFile = fileInfo;
            } else {
                if (!inTextMode && bright) {
                    bright.click();
                }
                textEditor.innerHTML = file.content || '';
                this.currentFile = fileInfo;
                
                if (file.style) {
                    currentFontSize = file.style.fontSize || currentFontSize;
                    currentFontColor = file.style.fontColor || currentFontColor;
                    currentFontFamily = file.style.fontFamily || currentFontFamily;
                    
                    if (fontSize) fontSize.value = currentFontSize;
                    if (fontColor) fontColor.value = currentFontColor;
                    if (fontFamily) fontFamily.value = currentFontFamily;
                }
            }
        }
    },

    async saveCurrentFile() {
        if (this.currentFile) {
            const filePath = [...this.currentFile.path];
            const fileName = this.currentFile.name;
            let current = this.fileSystem['Racine'];
            
            // Naviguer vers le dossier parent du fichier
            for (let i = 1; i < filePath.length; i++) {
                current = current.children[filePath[i]];
            }
            
            // Mettre à jour le contenu et les styles du fichier
            if (current.children[fileName] && current.children[fileName].type === 'file') {
                // Déterminer quel éditeur utiliser selon l'extension
                if (fileName.endsWith('.ino')) {
                    current.children[fileName].content = editor ? editor.innerHTML : '';
                } else {
                    current.children[fileName].content = textEditor ? textEditor.innerHTML : '';
                }
                
                current.children[fileName].style = {
                    fontSize: currentFontSize,
                    fontColor: currentFontColor,
                    fontFamily: currentFontFamily
                };
                await this.saveToESP32();
            }
        }
    },

    getFullPath() {
        return this.currentPath.join('/');
    },
    
    selectItem(name) {
        this.selectedItem = this.selectedItem === name ? null : name;
        this.render();
    },
    
    renameItem(oldName, newName) {
        if (!newName || newName.trim() === '') return;
        
        if (this.currentPath.length > 1 && oldName === this.currentPath[this.currentPath.length - 1]) {
            const parentFolder = this.getParentFolder();
            if (parentFolder && parentFolder.children[newName]) {
                alert('Un élément avec ce nom existe déjà!');
                return;
            }
            
            if (parentFolder) {
                parentFolder.children[newName] = parentFolder.children[oldName];
                delete parentFolder.children[oldName];
                this.currentPath[this.currentPath.length - 1] = newName;
            }
        } else {
            const currentFolder = this.getCurrentFolder();
            if (currentFolder.children[newName]) {
                alert('Un élément avec ce nom existe déjà!');
                return;
            }
            
            currentFolder.children[newName] = currentFolder.children[oldName];
            delete currentFolder.children[oldName];
            
            if (this.currentFile && this.currentFile.name === oldName) {
                this.currentFile.name = newName;
                this.saveLastOpenFile();
            }
            
            if (this.selectedItem === oldName) {
                this.selectedItem = newName;
            }
        }
        
        this.render();
        this.saveToESP32();
    },
    
    render() {
        const fileContent = document.getElementById('file-content');
        const backButton = document.getElementById('back-button');
        
        if (backButton) {
            backButton.style.display = this.currentPath.length > 1 ? 'flex' : 'none';
        }
        
        if (fileContent) {
            fileContent.innerHTML = '';
            
            const currentFolderObj = this.getCurrentFolder();
            const items = Object.keys(currentFolderObj.children);
            
            if (items.length === 0) {
                // Afficher un message si le dossier est vide
                const emptyMessage = document.createElement('div');
                emptyMessage.style.gridColumn = '1 / -1';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.color = 'rgba(255,255,255,0.5)';
                emptyMessage.style.padding = '20px';
                emptyMessage.textContent = 'Dossier vide';
                fileContent.appendChild(emptyMessage);
            } else {
                items.forEach(name => {
                    const item = currentFolderObj.children[name];
                    const element = document.createElement('div');
                    element.className = item.type === 'folder' ? 'folder-item' : 'file-item';
                    
                    // Mettre en surbrillance l'élément sélectionné
                    if (this.selectedItem === name) {
                        element.classList.add('selected');
                    }
                    
                    // Mettre en surbrillance le fichier actuellement ouvert
                    if (this.currentFile && 
                        this.currentFile.name === name && 
                        JSON.stringify(this.currentFile.path) === JSON.stringify(this.currentPath)) {
                        element.style.background = 'rgba(0, 255, 0, 0.3)';
                        element.style.border = '2px solid green';
                    }
                    
                    const emoji = document.createElement('div');
                    emoji.className = item.type === 'folder' ? 'folder-emoji' : 'file-emoji';
                    
                    // Utiliser un emoji différent pour les fichiers .ino
                    if (item.type === 'file' && name.endsWith('.ino')) {
                        emoji.textContent = '</>'; // Emoji pour les fichiers .ino
                    } else {
                        emoji.textContent = item.type === 'folder' ? '📁' : '📄';
                    }
                    
                    const nameElement = document.createElement('div');
                    nameElement.className = item.type === 'folder' ? 'folder-name' : 'file-name';
                    nameElement.textContent = name;
                    
                    element.appendChild(emoji);
                    element.appendChild(nameElement);
                    
                    // Gestion des clics
                    element.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (e.detail === 1) {
                            // Simple clic : sélectionner
                            this.selectItem(name);
                            if (item.type === 'file') {
                                // Si c'est un fichier .ino, l'ouvrir dans l'éditeur
                                if (name.endsWith('.ino')) {
                                    this.openInoFile(name);
                                } else {
                                    this.openFile(name);
                                }
                            }
                        } else if (e.detail === 2) {
                            // Double clic : ouvrir le dossier
                            if (item.type === 'folder') {
                                this.currentPath.push(name);
                                this.selectedItem = null;
                                this.render();
                                this.saveToESP32();
                            }
                        }
                    });
                    
                    fileContent.appendChild(element);
                });
            }
        }
    },

    async saveToESP32() {
        const data = {
            fileSystem: this.fileSystem,
            currentPath: this.currentPath,
            selectedItem: this.selectedItem
        };
        await saveToESP32(data);
    },

    async loadFromESP32() {
        const data = await loadFromESP32();
        if (data && data.fileSystem) {
            this.fileSystem = data.fileSystem;
            this.currentPath = data.currentPath || ['Racine'];
            this.selectedItem = data.selectedItem || null;
        }
    },

    async saveLastOpenFile() {
        if (this.currentFile) {
            await saveToESP32({ lastOpenFile: this.currentFile });
        }
    },

    async getLastOpenFile() {
        const data = await loadFromESP32();
        return data ? data.lastOpenFile : null;
    }
};

// ===== INITIALISATION DES ÉLÉMENTS DOM =====
const textEditor = document.getElementById('text-editor');
const editor = document.getElementById('editor');
const bleft = document.getElementById('bleft');
const bright = document.getElementById('bright');
const controlBar = document.getElementById('control-bar');
const fontSize = document.getElementById('font-size');
const fontColor = document.getElementById('font-color');
const fontFamily = document.getElementById('font-family');

// ===== CONFIGURATION INITIALE =====
if (controlBar) controlBar.style.display = 'none';

// ===== FONCTIONS DE STYLISATION =====
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
        
        fileManager.saveCurrentFile();
    }
}

textEditor.addEventListener('input', () => {
    fileManager.saveCurrentFile();
});

// Également sauvegarder quand on édite dans l'éditeur de code
editor.addEventListener('input', () => {
    fileManager.saveCurrentFile();
});

fontSize.addEventListener('change', () => {
    currentFontSize = fontSize.value;
    applyStyleToSelection();
});

fontColor.addEventListener('change', () => {
    currentFontColor = fontColor.value;
    applyStyleToSelection();
});

fontFamily.addEventListener('change', () => {
    currentFontFamily = fontFamily.value;
    applyStyleToSelection();
});

// ===== MODIFICATION DU BOUTON SAVE =====
bleft.addEventListener('click', () => {
    fileManager.saveCurrentFile();
    
    const isText = inTextMode;
    let content, filename;

    if (isText) {
        // Mode texte - utiliser le contenu du text-editor
        content = textEditor.innerText;
        
        // Si un fichier est ouvert, utiliser son nom, sinon "document.txt"
        if (fileManager.currentFile) {
            filename = fileManager.currentFile.name;
            // S'assurer que c'est un .txt
            if (!filename.endsWith('.txt')) {
                filename = filename.split('.')[0] + '.txt';
            }
        } else {
            filename = 'document.txt';
        }
    } else {
        // Mode éditeur - utiliser le contenu de l'editor
        content = editor.innerText;
        
        // Si un fichier .ino est ouvert, utiliser son nom, sinon "sketch.ino"
        if (fileManager.currentFile && fileManager.currentFile.name.endsWith('.ino')) {
            filename = fileManager.currentFile.name;
        } else {
            filename = 'sketch.ino';
        }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
        fileManager.saveCurrentFile();
        
        editor.style.transform = 'rotateY(0deg)';
        textEditor.style.transform = 'rotateY(-180deg)';
        controlBar.style.display = 'none';
        inTextMode = false;
        bright.textContent = 'Text';
    }
});

editor.style.overflowX = 'auto';
textEditor.style.overflowX = 'auto';

// Sauvegarde automatique toutes les 3 secondes
setInterval(() => {
    fileManager.saveCurrentFile();
}, 3000);

function checkEditorContent() {
    if (editor.innerText.trim() === '') {
        editor.innerText = "void setup() {\n    \n}\n\nvoid loop() {\n    \n}";
    }
}

editor.addEventListener('input', () => {
    setTimeout(checkEditorContent, 100);
});

// ===== INITIALISATION AU CHARGEMENT =====
window.addEventListener('load', () => {
    if (!editor.innerText || editor.innerText.trim() === '') {
        editor.innerText = "void setup() {\n\n}";
    }
    fileManager.init();
});

window.addEventListener('beforeunload', () => {
    fileManager.saveCurrentFile();
});
