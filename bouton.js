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

function openBackgroundMenu(e){
  e.stopPropagation();
  contentDiv.classList.add('background-top');
  contentDiv.innerHTML = '';

  const bgMenu = document.createElement('div');
  bgMenu.style.marginTop = '20px';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Background Change';
  bgMenu.appendChild(label);

  const options = [
    {name: 'Paysage', bg: 'https://cdn.pixabay.com/photo/2020/06/11/01/28/landscape-5284806_1280.jpg'},
    {name: 'Sombre',  bg: 'https://wallpapers.com/images/hd/dark-nature-ecoszxkcqcayo73x.jpg'},
    {name: 'Mode Chill', bg: 'https://img.tastelife.tv/assets/uploads/2022/01/New_Zealand_-_AMAZING_Beautiful_Nature_with_Relaxing_Music__Soundscapes_16x9.jpg'}
  ];

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'bg-option';
    div.style.marginTop = '10px';


    
    const preview = document.createElement('div');
    preview.style.backgroundImage = `url('${opt.bg}')`;

    const text = document.createElement('span');
    text.textContent = opt.name;

    div.appendChild(preview);
    div.appendChild(text);
    bgMenu.appendChild(div);

    div.addEventListener('click', () => {
      selectedBackground = opt.bg;
      document.body.style.backgroundImage = `url('${opt.bg}')`;
      // ✅ Enregistrer dans localStorage
      localStorage.setItem('savedBackground', opt.bg);
      console.log('Background enregistré :', opt.bg);
    });
  });

  contentDiv.appendChild(bgMenu);
  inBackgroundMenu = true;
}

parametre.addEventListener('click', openBackgroundMenu);

boutoncycle.addEventListener("click", (e) => {
  e.stopPropagation();
  const wasExpanded = boutoncycle.classList.contains("expanded");
  boutoncycle.classList.toggle("expanded");
  if (wasExpanded && inBackgroundMenu) showMainMenu();
});

document.addEventListener("click", (e) => {
  if (!boutoncycle.contains(e.target)) {
    const wasExpanded = boutoncycle.classList.contains("expanded");
    boutoncycle.classList.remove("expanded");
    if (wasExpanded && inBackgroundMenu) showMainMenu();
  }
});
