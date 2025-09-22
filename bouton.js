function openBackgroundMenu(e){
  e.stopPropagation();
  contentDiv.classList.add('background-top');
  contentDiv.innerHTML = '';

  const bgMenu = document.createElement('div');
  bgMenu.style.display = 'flex';
  bgMenu.style.flexDirection = 'column';
  bgMenu.style.alignItems = 'flex-start'; // titre collé à gauche

  // Titre
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Background Change';
  bgMenu.appendChild(label);

  // Conteneur pour les options (séparé du titre)
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'options-container';
  optionsContainer.style.display = 'flex';
  optionsContainer.style.flexDirection = 'column';
  optionsContainer.style.marginTop = '20px'; // espace entre titre et liste
  bgMenu.appendChild(optionsContainer);

  const options = [
    {name: 'Paysage', bg: 'https://cdn.pixabay.com/photo/2020/06/11/01/28/landscape-5284806_1280.jpg'},
    {name: 'Sombre',  bg: 'https://wallpapers.com/images/hd/dark-nature-ecoszxkcqcayo73x.jpg'},
    {name: 'Mode Chill', bg: 'https://img.tastelife.tv/assets/uploads/2022/01/New_Zealand_-_AMAZING_Beautiful_Nature_with_Relaxing_Music__Soundscapes_16x9.jpg'}
  ];

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'bg-option';
    div.style.marginTop = '10px'; // espace entre chaque option

    const preview = document.createElement('div');
    preview.style.backgroundImage = `url('${opt.bg}')`;

    const text = document.createElement('span');
    text.textContent = opt.name;

    div.appendChild(preview);
    div.appendChild(text);

    div.addEventListener('click', () => {
      selectedBackground = opt.bg;
      document.body.style.backgroundImage = `url('${opt.bg}')`;
      localStorage.setItem('savedBackground', opt.bg);
    });

    optionsContainer.appendChild(div);
  });

  contentDiv.appendChild(bgMenu);
  inBackgroundMenu = true;
}
