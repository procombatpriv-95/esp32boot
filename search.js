const startBtn = document.getElementById('startBtn');
const box = document.getElementById('box');
const input = document.getElementById('input');
const results = document.getElementById('results');

function forceReflow(el) { void el.offsetWidth; }

function resetAll() {
  box.classList.remove('visible', 'expand', 'opened');
  results.classList.remove('show');
  results.innerHTML = '';
  input.value = '';
  input.style.display = 'block';
  input.disabled = false;
  input.classList.remove('focus-left');
  startBtn.style.opacity = '1';
  startBtn.style.pointerEvents = 'auto';
}

// Bouton clic
startBtn.addEventListener('click', () => {
  startBtn.style.opacity = '0';
  startBtn.style.pointerEvents = 'none';
  box.classList.add('visible');
  requestAnimationFrame(() => {
    forceReflow(box);
    box.classList.add('expand');
    input.focus();
  });
});

// Focus / blur pour text-align
input.addEventListener('focus', () => { input.classList.add('focus-left'); });
input.addEventListener('blur', () => { if (!box.classList.contains('opened')) input.classList.remove('focus-left'); });

// Entrée pour envoyer à DuckDuckGo
input.addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = encodeURIComponent(input.value.trim());
    if (!query) return;

    input.value = '';
    input.disabled = true;
    input.style.display = 'none';
    requestAnimationFrame(() => box.classList.add('opened'));

    results.classList.remove('show');
    results.innerHTML = '<div class="result-item">Chargement...</div>';

    try {
      // API JSON de DuckDuckGo
      const resp = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1`);
      const data = await resp.json();

      results.innerHTML = '';

      // Afficher les 5 premiers résultats
      let count = 0;
      data.RelatedTopics.forEach(item => {
        if (count >= 5) return;
        if (item.Text) {
          const div = document.createElement('div');
          div.className = 'result-item';
          div.textContent = item.Text.length > 120 ? item.Text.substring(0, 120) + '...' : item.Text;
          results.appendChild(div);
          count++;
        } else if (item.Topics) {
          item.Topics.slice(0, 5 - count).forEach(sub => {
            if (sub.Text) {
              const div = document.createElement('div');
              div.className = 'result-item';
              div.textContent = sub.Text.length > 120 ? sub.Text.substring(0, 120) + '...' : sub.Text;
              results.appendChild(div);
              count++;
            }
          });
        }
      });

      if (count === 0) {
        results.innerHTML = '<div class="result-item">Aucun résultat trouvé</div>';
      }

      results.classList.add('show');
    } catch (err) {
      results.innerHTML = '<div class="result-item">Erreur lors de la requête DuckDuckGo.</div>';
      results.classList.add('show');
      console.error(err);
    }
  }
});

// Clic en dehors pour reset
document.addEventListener('click', e => {
  if (!box.contains(e.target) && e.target !== startBtn) {
    resetAll();
  }
});
