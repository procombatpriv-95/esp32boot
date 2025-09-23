const boutoncycle = document.getElementById("boutoncycle");
const contentDiv  = document.getElementById('content');
const parametre   = document.getElementById('parametre');
let selectedBackground = null;
let inBackgroundMenu = false;

// 🔑 Charger le background déjà enregistré (localStorage)
const savedBg = localStorage.getItem('savedBackground');
if (savedBg) {
  selectedBackground = savedBg;
  document.body.style.backgroundImage = `url('${savedBg}')`;
}

// Fonction pour revenir au menu principal
function showMainMenu(){
  contentDiv.classList.remove('background-top');
  contentDiv.innerHTML = `
    <a href="http://detector.local">Detector</a>
    <a href="http://camera.local">Camera</a>
    <a href="/note">Note</a>
    <div class="separator-wide"></div>
    <div class="parametre" id="parametre">Parametre</div>
  `;
  contentDiv.querySelector('#parametre').addEventListener('click', openBackgroundMenu);
  inBackgroundMenu = false;
}

// Fonction pour ouvrir le menu Background
function openBackgroundMenu(e){
  e.stopPropagation();
  contentDiv.classList.add('background-top');
  contentDiv.innerHTML = '';

  const bgMenu = document.createElement('div');

  // 🔹 Titre légèrement remonté
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Background Change';
  label.style.marginTop = '-8px'; // remonter le titre
  bgMenu.appendChild(label);

  // Conteneur séparé pour les options
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'options-container';
  optionsContainer.style.marginTop = '12px'; // descendre les options
  bgMenu.appendChild(optionsContainer);

  // Options disponibles
  const options = [
    {name: 'Paysage', bg: 'https://cdn.pixabay.com/photo/2020/06/11/01/28/landscape-5284806_1280.jpg'},
    {name: 'Sombre',  bg: 'https://wallpapers.com/images/hd/dark-nature-ecoszxkcqcayo73x.jpg'},
    {name: 'Mode Chill', bg: 'https://img.tastelife.tv/assets/uploads/2022/01/New_Zealand_-_AMAZING_Beautiful_Nature_with_Relaxing_Music__Soundscapes_16x9.jpg'}
  ];

  // Création de chaque option
  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'bg-option';

    // 🔹 réduire légèrement et descendre chaque option
    div.style.transform = 'scale(0.9)';
    div.style.marginTop = '12px'; // 2px de plus que l'original

    const preview = document.createElement('div');
    preview.style.backgroundImage = `url('${opt.bg}')`;

    const text = document.createElement('span');
    text.textContent = opt.name;

    div.appendChild(preview);
    div.appendChild(text);

    // Quand on clique sur une option
    div.addEventListener('click', () => {
      selectedBackground = opt.bg;
      document.body.style.backgroundImage = `url('${opt.bg}')`;
      localStorage.setItem('savedBackground', opt.bg); // 🔑 mémoriser le choix
      console.log('Background enregistré :', opt.bg);
    });

    optionsContainer.appendChild(div);
  });

  contentDiv.appendChild(bgMenu);
  inBackgroundMenu = true;
}

// Ouvrir le menu Background quand on clique sur Parametre
parametre.addEventListener('click', openBackgroundMenu);

// Gestion du clic sur le bouton pour zoomer/dézoomer
boutoncycle.addEventListener("click", (e) => {
  e.stopPropagation();
  const wasExpanded = boutoncycle.classList.contains("expanded");
  boutoncycle.classList.toggle("expanded");
  if (wasExpanded && inBackgroundMenu) showMainMenu();
});

// Fermer le menu si on clique en dehors
document.addEventListener("click", (e) => {
  if (!boutoncycle.contains(e.target)) {
    const wasExpanded = boutoncycle.classList.contains("expanded");
    boutoncycle.classList.remove("expanded");
    if (wasExpanded && inBackgroundMenu) showMainMenu();
  }
});
</script>
