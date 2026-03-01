    let currentGdpType = 'gdp';
    let currentGdpCountry = 'usa';
    
    function changeRetail(country) {
      document.querySelectorAll('[id^="retail-"]').forEach(w => w.classList.remove('active'));
      document.getElementById('retail-' + country).classList.add('active');
    }
    
    function changeGdpType(type) {
      currentGdpType = type;
      updateGdpWidget();
    }
    
    function changeGdpCountry(country) {
      currentGdpCountry = country;
      updateGdpWidget();
    }
    
    function updateGdpWidget() {
      document.querySelectorAll('[id^="gdp-"], [id^="growth-"]').forEach(w => w.classList.remove('active'));
      const widgetId = currentGdpType + '-' + currentGdpCountry;
      document.getElementById(widgetId).classList.add('active');
    }

    function changeSymbol(symbol) {
      const wrapper = document.getElementById('widgetWrapper4');
      wrapper.innerHTML = `
        <div class="tradingview4-widget-container">
          <div class="tradingview4-widget-container__widget"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-financials.js" async>
          {
            "symbol": "${symbol}",
            "colorTheme": "dark",
            "displayMode": "regular",
            "isTransparent": false,
            "locale": "en",
            "width": 400,
            "height": 550
          }
          <\/script>
        </div>
      `;
      const script = wrapper.querySelector('script');
      const newScript = document.createElement('script');
      newScript.type = 'text/javascript';
      newScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
      newScript.async = true;
      newScript.innerHTML = script.innerHTML;
      script.parentNode.replaceChild(newScript, script);
    }

    function switchFeuille(feuilleName) {
      document.querySelectorAll('.feuille').forEach(feuille => feuille.classList.remove('active'));
      document.getElementById('feuille-' + feuilleName).classList.add('active');
      
      document.querySelectorAll('.defilement-tab').forEach(tab => tab.classList.remove('active'));
      event.target.classList.add('active');
      
      const slider = document.getElementById('defilementSlider');
      slider.className = 'defilement-slider';
      
      if (feuilleName === 'fondamental') {
        slider.classList.add('fondamental');
      } else if (feuilleName === 'fondamental1') {
        slider.classList.add('fondamental1');
      } else if (feuilleName === 'fondamental2') {
        slider.classList.add('fondamental2');
      } else if (feuilleName === 'trade') {
        slider.classList.add('trade');
      } else if (feuilleName === 'macro1') {
        slider.classList.add('macro1');
      }
    }

    window.addEventListener('load', function() {
      setTimeout(function() {
        if (window.TEWidget && window.TEWidget.init) {
          window.TEWidget.init();
        }
      }, 1000);
    });
