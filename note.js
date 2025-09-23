
const textBox = document.getElementById('textBox');
const wordInput = document.getElementById('wordInput');
let savedWords = JSON.parse(localStorage.getItem('protocolWords') || '[]');
renderWords();

wordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && wordInput.value.trim() !== '') {
    savedWords.push(wordInput.value.trim());
    wordInput.value = '';
    saveAndRender();
  }
});

function saveAndRender() {
  localStorage.setItem('protocolWords', JSON.stringify(savedWords));
  renderWords();
}

function renderWords() {
  const spacer = '<div style="height:10px"></div>';
  textBox.innerHTML = '<button id="resetBtn">✕</button>' +
                      spacer +
                      savedWords.map(w => `• ${w}`).join('<br>');
  document.getElementById('resetBtn').onclick = () => {
    savedWords = [];
    saveAndRender();
  };
}
