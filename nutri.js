let foods=[];
let overlay=document.getElementById("overlay");
let chartCalories,bigPie,chartProtein,chartSugar,chartFat,chartVitC;
let suggestIdx=0;
let totalCalories=0,totalProt=0,totalSucre=0,totalGras=0,totalVitC=0;
let currentFood=null; // sera assigné quand on ouvre le prompt

// --- Limites journalières ---
const maxProt=220, maxSucre=600, maxGras=120, maxVitC=300, maxCal=3600;
const maxMeal=1200; // max par repas

// Plugin texte au centre (pour Chart.js)
const centerText = {
  id:'centerText',
  beforeDraw(chart,args,options){
    const {ctx,chartArea:{width,height}} = chart;
    ctx.save();
    ctx.font = (options.fontSize||14)+'px Arial';
    ctx.fillStyle = options.color || '#000';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(options.text || '', width/2, height/2);
  }
};
)rawliteral";
html += R"rawliteral(

// Charger aliments depuis l'ESP32
async function loadFoods(){
  try{
    let res=await fetch("/foods");
    foods=await res.json();
  }catch(e){
    console.error("Erreur fetch /foods",e);
  }
  restoreState();
  startSuggestion();
}
)rawliteral";
html += R"rawliteral(
// Ouvre la liste d'une catégorie
function openCategory(cat,btn){
  let list=foods.filter(f=>f.category===cat && f.parent==="");
  overlay.innerHTML="";
  list.forEach(f=>{
    let div=document.createElement("div");
    div.className="foodItem";
    div.innerHTML=`<img src="${f.photo}"><span>${f.name} (${f.kcal100} kcal/100g)</span>`;
    div.onclick=()=>{ 
      let subs=foods.filter(sub=>sub.parent===f.id);
      if(subs.length>0){
        // afficher sous-éléments (remplace la liste)
        overlay.innerHTML="";
        subs.forEach(sf=>{
          let sdiv=document.createElement("div");
          sdiv.className="foodItem";
          sdiv.innerHTML=`<img src="${sf.photo}"><span>${sf.name} (${sf.kcal100} kcal/100g)</span>`;
          sdiv.onclick=()=>{ openPromptForFood(sf); };
          overlay.appendChild(sdiv);
        });
      } else {
        openPromptForFood(f);
      }
    };
    overlay.appendChild(div);
  });
  // positionner overlay sous le bouton
  let rect=btn.getBoundingClientRect();
  overlay.style.left=(rect.left+rect.width/2-200)+"px";
  overlay.style.top=(rect.bottom+10+window.scrollY)+"px";
  overlay.style.display="block";
}
)rawliteral";
html += R"rawliteral(
function closeOverlay(){ overlay.style.display="none"; }
)rawliteral";
html += R"rawliteral(
// Ouvre la boîte stylisée pour saisir le poids pour cet aliment
function openPromptForFood(food){
  currentFood = food;
  document.getElementById('promptText').textContent = "Combien de grammes de " + food.name + " ?";
  document.getElementById('promptInput').value = "";
  document.getElementById('promptBox').style.display = "block";
  closeOverlay();
  // focus input
  setTimeout(()=>{ document.getElementById('promptInput').focus(); },100);
}
)rawliteral";
html += R"rawliteral(
function hidePrompt(){
  currentFood = null;
  document.getElementById('promptBox').style.display = "none";
}

// Confirm / Cancel handlers
document.getElementById('promptOk').addEventListener('click', ()=>{ confirmPrompt(); });
document.getElementById('promptCancel').addEventListener('click', ()=>{ cancelPrompt(); });
document.getElementById('promptInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') confirmPrompt(); });
)rawliteral";
html += R"rawliteral(
function cancelPrompt(){
  hidePrompt();
}

)rawliteral";
html += R"rawliteral(
function confirmPrompt(){
  const v = parseFloat(document.getElementById('promptInput').value);
  if(!currentFood){ hidePrompt(); return; }
  if(!v || v <= 0){ alert("Entrez un poids valide en grammes."); return; }

  const grams = Math.round(v);
  // calculs
  let kcal = (currentFood.kcal100 * grams) / 100.0;
  let prot = (currentFood.prot100 * grams) / 100.0;
  let sucre = (currentFood.sucre100 * grams) / 100.0;
  let gras = (currentFood.gras100 * grams) / 100.0;
  let vitc = (currentFood.vitc100 * grams) / 100.0;

  // additionner totaux
  totalCalories += kcal;
  totalProt += prot;
  totalSucre += sucre;
  totalGras += gras;
  totalVitC += vitc;

  // mettre à jour graphiques et stockage
  addToMealChart(kcal);
  updateBigPie();
  updateMiniChart(chartProtein,totalProt,"Prot",maxProt);
  updateMiniChart(chartSugar,totalSucre,"Sucre",maxSucre);
  updateMiniChart(chartFat,totalGras,"Gras",maxGras);
  updateMiniChart(chartVitC,totalVitC,"VitC",maxVitC);
  saveState();

  hidePrompt();
}
)rawliteral";
html += R"rawliteral(
// --------- Charts initialisation ---------
function initCharts(){
  // bar chart (repas)
  let ctx=document.getElementById("chartCalories").getContext("2d");
  chartCalories=new Chart(ctx,{type:'bar',
    data:{labels:["Petit-déjeuner","Déjeuner","Dîner"],
          datasets:[{label:"Calories",data:[0,0,0],
          backgroundColor:["#4CAF50","#FF9800","#2196F3"]}]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{y:{beginAtZero:true,max:maxMeal}}
    }
  });

  // big donut
  let ctxBig=document.getElementById("bigPie").getContext("2d");
  bigPie=new Chart(ctxBig,{type:'doughnut',
    data:{labels:["Ingested","Remaining"],datasets:[{data:[0,maxCal],backgroundColor:["#8b4513","#ddd"]}]},
    options:{plugins:{legend:{display:false},centerText:{text:"0 kcal",fontSize:40,color:"#8b4513"}}},
    plugins:[centerText]
  });

  // minis (protein, sugar, fat, vitC)
  chartProtein=new Chart(document.getElementById("chartProtein").getContext("2d"),{
    type:'doughnut',
    data:{labels:["Prot","Rest"],datasets:[{data:[0,maxProt],backgroundColor:["#4CAF50","#eee"]}]},
    options:{plugins:{legend:{display:false},centerText:{text:"0g",fontSize:10,color:"#4CAF50"}}},
    plugins:[centerText]
  });
  chartSugar=new Chart(document.getElementById("chartSugar").getContext("2d"),{
    type:'doughnut',
    data:{labels:["Sucre","Rest"],datasets:[{data:[0,maxSucre],backgroundColor:["#FF9800","#eee"]}]},
    options:{plugins:{legend:{display:false},centerText:{text:"0g",fontSize:10,color:"#FF9800"}}},
    plugins:[centerText]
  });
  chartFat=new Chart(document.getElementById("chartFat").getContext("2d"),{
    type:'doughnut',
    data:{labels:["Gras","Rest"],datasets:[{data:[0,maxGras],backgroundColor:["#F44336","#eee"]}]},
    options:{plugins:{legend:{display:false},centerText:{text:"0g",fontSize:10,color:"#F44336"}}},
    plugins:[centerText]
  });
  chartVitC=new Chart(document.getElementById("chartVitC").getContext("2d"),{
    type:'doughnut',
    data:{labels:["VitC","Rest"],datasets:[{data:[0,maxVitC],backgroundColor:["#2196F3","#eee"]}]},
    options:{plugins:{legend:{display:false},centerText:{text:"0mg",fontSize:10,color:"#2196F3"}}},
    plugins:[centerText]
  });
}
)rawliteral";
html += R"rawliteral(
// Update functions
function addToMealChart(kcal){
  let h=new Date().getHours();
  let idx=0;
  if(h>=1 && h<=11) idx=0; else if(h>=12 && h<=15) idx=1; else idx=2;
  chartCalories.data.datasets[0].data[idx]+=kcal;
  if(chartCalories.data.datasets[0].data[idx]>maxMeal) chartCalories.data.datasets[0].data[idx]=maxMeal;
  chartCalories.update();
}
)rawliteral";
html += R"rawliteral(
function updateBigPie(){
  bigPie.data.datasets[0].data=[totalCalories,Math.max(maxCal-totalCalories,0)];
  bigPie.options.plugins.centerText.text=Math.round(totalCalories)+" kcal";
  bigPie.update();
}
)rawliteral";
html += R"rawliteral(
function updateMiniChart(chart,val,label,max){
  chart.data.datasets[0].data=[Math.min(val,max), Math.max(max - Math.min(val,max),0)];
  chart.options.plugins.centerText.text=(label==="VitC")? Math.round(val)+"mg" : Math.round(val)+"g";
  chart.update();
}

// Suggestions images (défilement)
let suggestImgs=["https://www.hagengrote.fr/genussmagazin/wp-content/uploads/2023/05/Apfel_FR_1.jpg",
"https://blog.mon-marche.fr/wp-content/uploads/2021/05/5300_Banane.png",
"https://cdn.pixabay.com/photo/2017/01/20/15/06/orange-1995056_1280.jpg",
"https://www.nutritionniste-paris.com/wp-content/uploads/2025/07/Carottes-un-legume-sucre-riche-en-fibres-et-en-beta-carotene-1-1.webp"];
)rawliteral";
html += R"rawliteral(
function startSuggestion(){ 
  // afficher la première tout de suite
  if(suggestImgs.length>0) document.getElementById("suggestImg").src = suggestImgs[0];
  setInterval(()=>{ 
    suggestIdx=(suggestIdx+1)%suggestImgs.length;
    let img=document.getElementById("suggestImg"); 
    img.style.transform="scale(0.9)";
    setTimeout(()=>{ img.src=suggestImgs[suggestIdx]; img.style.transform="scale(1)"; },220);
  },20000);
}
)rawliteral";
html += R"rawliteral(
// Reset
function resetAll(){ localStorage.removeItem("totals"); location.reload(); }
)rawliteral";
html += R"rawliteral(
// LocalStorage
function saveState(){
  localStorage.setItem("totals",JSON.stringify({
    cal: totalCalories,
    p: totalProt,
    s: totalSucre,
    g: totalGras,
    c: totalVitC,
    meals: chartCalories.data.datasets[0].data
  }));
}


)rawliteral";
html += R"rawliteral(
function restoreState(){
  let st = localStorage.getItem("totals");
  if(!st) return;
  try {
    let d = JSON.parse(st);
    totalCalories = d.cal||0;
    totalProt = d.p||0;
    totalSucre = d.s||0;
    totalGras = d.g||0;
    totalVitC = d.c||0;
    if(d.meals && Array.isArray(d.meals)) {
      chartCalories.data.datasets[0].data = d.meals;
      chartCalories.update();
    }
    updateBigPie();
    updateMiniChart(chartProtein,totalProt,"Prot",maxProt);
    updateMiniChart(chartSugar,totalSucre,"Sucre",maxSucre);
    updateMiniChart(chartFat,totalGras,"Gras",maxGras);
    updateMiniChart(chartVitC,totalVitC,"VitC",maxVitC);
  } catch(e){
    console.error("restoreState parse error", e);
  }
}

window.onload = ()=>{
  initCharts();
  loadFoods();
};

document.getElementById("body").addEventListener("click", function(e){
  if(!e.target.closest("#calo") && !e.target.closest("#overlay") && !e.target.closest("#promptBox")){
    closeOverlay();
  }
});
