
  // ===== VARIABLES GLOBALES =====
  let inTextMode = false;
  let currentFontSize = '14px';
  let currentFontColor = 'black';
  let currentFontFamily = 'Arial';

  // 🔁 Charger une variable depuis l’ESP32
  async function loadVar(key) {
    const res = await fetch('/loadvar?key=' + encodeURIComponent(key));
    if (res.ok) return await res.text();
    return null;
  }

  // 💾 Sauvegarder une variable sur l’ESP32
  async function saveVar(key, value) {
    await fetch('/savevar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`
    });
  }

  // 📤 Charger un fichier depuis l’ESP32
  async function loadFileFromESP32(path) {
    const res = await fetch('/load?path=' + encodeURIComponent(path));
    if (res.ok) return await res.text();
    return '';
  }

  // 💾 Sauvegarder un fichier sur l’ESP32
  async function saveFileToESP32(path, content) {
    await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `path=${encodeURIComponent(path)}&content=${encodeURIComponent(content)}`
    });
  }

  // ===== GESTIONNAIRE DE FICHIERS =====
  const fileManager = {
    currentPath: ['Racine'],
    selectedItem: null,
    currentFile: null,
    fileSystem: { Racine: { type: 'folder', children: {} } },

    async init() {
      await this.loadFromESP32();
      this.bindEvents();
      this.render();
      const lastFile = await loadVar('lastOpenFile');
      if (lastFile) {
        this.openFileByPath(JSON.parse(lastFile));
      }
    },

    bindEvents() {
      const addButton = document.getElementById('add-button');
      const backButton = document.getElementById('back-button');
      const addFolder = document.getElementById('add-folder');
      const addFile = document.getElementById('add-file');
      const addIno = document.getElementById('add-ino');
      const deleteItem = document.getElementById('delete-item');
      const renameItem = document.getElementById('rename-item');
      const renameConfirm = document.getElementById('rename-confirm');
      const renameCancel = document.getElementById('rename-cancel');
      const renameModal = document.getElementById('rename-modal');
      const renameInput = document.getElementById('rename-input');

      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleActionButtons();
      });

      backButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentPath.length > 1) {
          this.currentPath.pop();
          this.selectedItem = null;
          this.render();
          this.saveToESP32();
        }
      });

      addFolder.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createFolder();
      });

      addFile.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createFile();
      });

      addIno.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createInoFile();
      });

      deleteItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSelectedItem();
      });

      renameItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renameCurrentItem();
      });

      renameConfirm.addEventListener('click', () => this.confirmRename());
      renameCancel.addEventListener('click', () => this.hideRenameModal());
      renameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.confirmRename();
      });
      renameModal.addEventListener('click', (e) => {
        if (e.target.id === 'rename-modal') this.hideRenameModal();
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

    async createFolder() {
      const currentFolder = this.getCurrentFolder();
      let folderNumber = 1;
      let folderName = `Nouveau dossier ${folderNumber}`;
      while (currentFolder.children[folderName]) {
        folderNumber++;
        folderName = `Nouveau dossier ${folderNumber}`;
      }
      currentFolder.children[folderName] = { type: 'folder', children: {} };
      this.selectedItem = folderName;
      this.render();
      await this.saveToESP32();
    },

    async createFile() {
      const currentFolder = this.getCurrentFolder();
      let fileNumber = 1;
      let fileName = `Nouveau fichier ${fileNumber}.txt`;
      while (currentFolder.children[fileName]) {
        fileNumber++;
        fileName = `Nouveau fichier ${fileNumber}.txt`;
      }
      currentFolder.children[fileName] = {
        type: 'file',
        content: '',
        style: { fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily }
      };
      this.selectedItem = fileName;
      this.render();
      await this.saveToESP32();
      await this.openFile(fileName);
    },

    async createInoFile() {
      const currentFolder = this.getCurrentFolder();
      let fileNumber = 1;
      let fileName = `Nouveau_sketch_${fileNumber}.ino`;
      while (currentFolder.children[fileName]) {
        fileNumber++;
        fileName = `Nouveau_sketch_${fileNumber}.ino`;
      }
      const defaultInoContent = `void setup() {\n  // Initialisation\n}\n\nvoid loop() {\n  // Code principal\n}`;
      currentFolder.children[fileName] = {
        type: 'file',
        content: defaultInoContent,
        style: { fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily }
      };
      this.selectedItem = fileName;
      this.render();
      await this.saveToESP32();
      await this.openInoFile(fileName);
    },

    async openInoFile(fileName) {
      const file = this.getCurrentFolder().children[fileName];
      if (file && file.type === 'file' && fileName.endsWith('.ino')) {
        if (this.currentFile) await this.saveCurrentFile();
        if (inTextMode) bright.click();
        this.currentFile = { path: [...this.currentPath], name: fileName };
        editor.innerText = file.content || '';
        await saveVar('lastOpenFile', JSON.stringify(this.currentFile));
        this.render();
      }
    },

    async openFile(fileName) {
      const file = this.getCurrentFolder().children[fileName];
      if (file && file.type === 'file') {
        if (this.currentFile) await this.saveCurrentFile();
        if (!inTextMode) bright.click();
        this.currentFile = { path: [...this.currentPath], name: fileName };
        textEditor.innerHTML = file.content || '';
        if (file.style) {
          currentFontSize = file.style.fontSize || currentFontSize;
          currentFontColor = file.style.fontColor || currentFontColor;
          currentFontFamily = file.style.fontFamily || currentFontFamily;
          if (fontSize) fontSize.value = currentFontSize;
          if (fontColor) fontColor.value = currentFontColor;
          if (fontFamily) fontFamily.value = currentFontFamily;
        }
        await saveVar('lastOpenFile', JSON.stringify(this.currentFile));
        this.render();
      }
    },

    async openFileByPath(fileInfo) {
      if (!fileInfo) return;
      this.currentPath = [...fileInfo.path];
      this.selectedItem = fileInfo.name;
      this.render();
      const file = this.getCurrentFolder().children[fileInfo.name];
      if (file && file.type === 'file') {
        if (fileInfo.name.endsWith('.ino')) {
          if (inTextMode) bright.click();
          editor.innerText = file.content || '';
        } else {
          if (!inTextMode) bright.click();
          textEditor.innerHTML = file.content || '';
        }
        this.currentFile = fileInfo;
      }
    },

    async saveCurrentFile() {
      if (!this.currentFile) return;
      const filePath = [...this.currentFile.path];
      const fileName = this.currentFile.name;
      let current = this.fileSystem['Racine'];
      for (let i = 1; i < filePath.length; i++) {
        current = current.children[filePath[i]];
      }
      if (current.children[fileName] && current.children[fileName].type === 'file') {
        current.children[fileName].content = fileName.endsWith('.ino') ? editor.innerText : textEditor.innerHTML;
        current.children[fileName].style = { fontSize: currentFontSize, fontColor: currentFontColor, fontFamily: currentFontFamily };
        await this.saveToESP32();
      }
    },

    async deleteSelectedItem() {
      if (this.selectedItem) {
        const currentFolder = this.getCurrentFolder();
        if (this.currentFile && this.currentFile.name === this.selectedItem && JSON.stringify(this.currentFile.path) === JSON.stringify(this.currentPath)) {
          this.currentFile = null;
          textEditor.innerHTML = '';
          editor.innerText = '';
          await saveVar('lastOpenFile', '');
        }
        delete currentFolder.children[this.selectedItem];
        this.selectedItem = null;
        this.render();
        await this.saveToESP32();
      } else if (this.currentPath.length > 1) {
        const folderName = this.currentPath.pop();
        const parentFolder = this.getCurrentFolder();
        delete parentFolder.children[folderName];
        this.selectedItem = null;
        this.render();
        await this.saveToESP32();
      }
    },

    async renameItem(oldName, newName) {
      if (!newName || newName.trim() === '') return;
      const currentFolder = this.getCurrentFolder();
      if (currentFolder.children[newName]) {
        alert('Un élément avec ce nom existe déjà!');
        return;
      }
      currentFolder.children[newName] = currentFolder.children[oldName];
      delete currentFolder.children[oldName];
      if (this.currentFile && this.currentFile.name === oldName) {
        this.currentFile.name = newName;
        await saveVar('lastOpenFile', JSON.stringify(this.currentFile));
      }
      if (this.selectedItem === oldName) this.selectedItem = newName;
      this.render();
      await this.saveToESP32();
    },

    async saveToESP32() {
      await saveVar('fileSystem', JSON.stringify(this.fileSystem));
      await saveVar('currentPath', JSON.stringify(this.currentPath));
      if (this.selectedItem) await saveVar('selectedItem', this.selectedItem);
    },

    async loadFromESP32() {
      const fs = await loadVar('fileSystem');
      const cp = await loadVar('currentPath');
      const si = await loadVar('selectedItem');
      if (fs) this.fileSystem = JSON.parse(fs);
      if (cp) this.currentPath = JSON.parse(cp);
      if (si) this.selectedItem = si;
    },

    render() {
      const fileContent = document.getElementById('file-content');
      const backButton = document.getElementById('back-button');
      if (backButton) backButton.style.display = this.currentPath.length > 1 ? 'flex' : 'none';
      if (fileContent) {
        fileContent.innerHTML = '';
        const currentFolderObj = this.getCurrentFolder();
        const items = Object.keys(currentFolderObj.children);
        if (items.length === 0) {
          const empty = document.createElement('div');
          empty.style.gridColumn = '1 / -1';
          empty.style.textAlign = 'center';
          empty.style.color = 'rgba(255,255,255,0.5)';
          empty.style.padding = '20px';
          empty.textContent = 'Dossier vide';
          fileContent.appendChild(empty);
        } else {
          items.forEach(name => {
            const item = currentFolderObj.children[name];
            const div = document.createElement('div');
            div.className = item.type === 'folder' ? 'folder-item' : 'file-item';
            if (this.selectedItem === name) div.classList.add('selected');
            if (this.currentFile && this.currentFile.name === name && JSON.stringify(this.currentFile.path) === JSON.stringify(this.currentPath)) {
              div.style.background = 'rgba(0, 255, 0, 0.3)';
              div.style.border = '2px solid green';
            }
            div.innerHTML = `
              <div class="file-emoji">${item.type === 'folder' ? '📁' : name.endsWith('.ino') ? '</>' : '📄'}</div>
              <div class="file-name">${name}</div>
            `;
            div.addEventListener('click', (e) => {
              e.stopPropagation();
              if (e.detail === 1) {
                this.selectedItem = name;
                this.render();
                if (item.type === 'file') {
                  if (name.endsWith('.ino')) this.openInoFile(name);
                  else this.openFile(name);
                }
              } else if (e.detail === 2 && item.type === 'folder') {
                this.currentPath.push(name);
                this.selectedItem = null;
                this.render();
                this.saveToESP32();
              }
            });
            fileContent.appendChild(div);
          });
        }
      }
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
  window.addEventListener('load', async () => {
    const savedCode = await loadVar('code');
    if (savedCode) editor.innerText = savedCode;
    else editor.innerText = "void setup() {\n  // Code setup\n}\n\nvoid loop() {\n  // Code loop\n}";

    const savedFontSize = await loadVar('text-font-size');
    const savedFontColor = await loadVar('text-font-color');
    const savedFontFamily = await loadVar('text-font-family');

    if (savedFontSize) currentFontSize = savedFontSize;
    if (savedFontColor) currentFontColor = savedFontColor;
    if (savedFontFamily) currentFontFamily = savedFontFamily;

    if (fontSize) fontSize.value = currentFontSize;
    if (fontColor) fontColor.value = currentFontColor;
    if (fontFamily) fontFamily.value = currentFontFamily;
    if (controlBar) controlBar.style.display = 'none';

    await fileManager.init();
  });

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
      sel.removeAllRanges();
      sel.addRange(range);
      fileManager.saveCurrentFile();
    }
  }

  textEditor.addEventListener('input', () => fileManager.saveCurrentFile());
  editor.addEventListener('input', () => fileManager.saveCurrentFile());

  fontSize.addEventListener('change', async () => {
    currentFontSize = fontSize.value;
    await saveVar('text-font-size', currentFontSize);
    applyStyleToSelection();
  });

  fontColor.addEventListener('change', async () => {
    currentFontColor = fontColor.value;
    await saveVar('text-font-color', currentFontColor);
    applyStyleToSelection();
  });

  fontFamily.addEventListener('change', async () => {
    currentFontFamily = fontFamily.value;
    await saveVar('text-font-family', currentFontFamily);
    applyStyleToSelection();
  });

  // ===== BOUTONS SAVE ET TEXT/CODE =====
  bleft.addEventListener('click', async () => {
    await fileManager.saveCurrentFile();
    const isText = inTextMode;
    let content, filename;

    if (isText) {
      content = textEditor.innerText;
      filename = fileManager.currentFile ? (fileManager.currentFile.name.endsWith('.txt') ? fileManager.currentFile.name : fileManager.currentFile.name.replace(/\..+$/, '.txt')) : 'document.txt';
    } else {
      content = editor.innerText;
      filename = fileManager.currentFile && fileManager.currentFile.name.endsWith('.ino') ? fileManager.currentFile.name : 'sketch.ino';
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

  bright.addEventListener('click', async () => {
    inTextMode = !inTextMode;
    if (inTextMode) {
      editor.style.transform = 'rotateY(-180deg)';
      textEditor.style.transform = 'rotateY(0deg)';
      controlBar.style.display = 'flex';
      bright.textContent = 'Code';
    } else {
      await fileManager.saveCurrentFile();
      editor.style.transform = 'rotateY(0deg)';
      textEditor.style.transform = 'rotateY(-180deg)';
      controlBar.style.display = 'none';
      bright.textContent = 'Text';
    }
  });

  // ===== SAUVEGARDE AUTO TOUTES LES 3 SECONDES =====
  setInterval(async () => {
    await saveVar('code', editor.innerText);
    await fileManager.saveCurrentFile();
  }, 3000);

  // ===== VÉRIFICATION CONTENU ÉDITEUR =====
  function checkEditorContent() {
    if (editor.innerText.trim() === '') {
      editor.innerText = "void setup() {\n    \n}\n\nvoid loop() {\n    \n}";
    }
  }

  editor.addEventListener('input', () => setTimeout(checkEditorContent, 100));

  // ===== SAUVEGARDE À LA FERMETURE =====
  window.addEventListener('beforeunload', async () => {
    await saveVar('code', editor.innerText);
    await fileManager.saveCurrentFile();
  });
