const boutoncycle = document.getElementById("boutoncycle");
const contentDiv  = document.getElementById('content');
const parametre   = document.getElementById('parametre');
let selectedBackground = null;
let inBackgroundMenu = false;

// 🔑 Charger le background déjà enregistré
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

  // Conteneur scrollable
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'options-container';
  optionsContainer.style.marginTop = '4px';      // ✅ remonte la liste de 4 px
  optionsContainer.style.maxHeight = '100px';    // ✅ limite la hauteur
  optionsContainer.style.overflowY = 'auto';     // ✅ rend scrollable

  // Options disponibles (avec les 2 nouveaux)
  const options = [
    {name: 'Paysage', bg: 'https://cdn.pixabay.com/photo/2020/06/11/01/28/landscape-5284806_1280.jpg'},
    {name: 'Sombre',  bg: 'https://wallpapers.com/images/hd/dark-nature-ecoszxkcqcayo73x.jpg'},
    {name: 'Chill', bg: 'https://img.tastelife.tv/assets/uploads/2022/01/New_Zealand_-_AMAZING_Beautiful_Nature_with_Relaxing_Music__Soundscapes_16x9.jpg'},
    {name: 'Mountain', bg: 'https://print.marcdaviet.com/wp-content/uploads/2021/08/Paysage-montagne.jpg'},
    {name: 'Gif', bg: 'https://miro.medium.com/v2/0*yV2tBvRjHsezy30L.gif'}
  ];

  // Création de chaque option
  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'bg-option';
    div.style.transform = 'scale(0.9)';   // réduction légère
    div.style.marginTop = '10px';         // espacement entre chaque option

    const preview = document.createElement('div');
    preview.style.backgroundImage = `url('${opt.bg}')`;

    const text = document.createElement('span');
    text.textContent = opt.name;

    div.appendChild(preview);
    div.appendChild(text);

    // Clic sur une option
    div.addEventListener('click', () => {
      selectedBackground = opt.bg;
      document.body.style.backgroundImage = `url('${opt.bg}')`;
      localStorage.setItem('savedBackground', opt.bg);
      console.log('Background enregistré :', opt.bg);
    });

    optionsContainer.appendChild(div);
  });

  contentDiv.appendChild(optionsContainer);
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
