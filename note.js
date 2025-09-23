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
  
  // On garde le reset button
  textBox.innerHTML = '<button id="resetBtn">✕</button>' + spacer;

  // On crée chaque mot dans un div aligné à gauche
  savedWords.forEach(word => {
    const wordDiv = document.createElement('div');
    wordDiv.textContent = `• ${word}`;
    wordDiv.style.textAlign = 'left'; // Force l'alignement à gauche
    textBox.appendChild(wordDiv);
  });

  // Reset button
  document.getElementById('resetBtn').onclick = () => {
    savedWords = [];
    saveAndRender();
  };
}
