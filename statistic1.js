           if (!CanvasRenderingContext2D.prototype.roundRect) {
              CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.moveTo(x + r, y);
                this.lineTo(x + w - r, y);
                this.quadraticCurveTo(x + w, y, x + w, y + r);
                this.lineTo(x + w, y + h - r);
                this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                this.lineTo(x + r, y + h);
                this.quadraticCurveTo(x, y + h, x, y + h - r);
                this.lineTo(x, y + r);
                this.quadraticCurveTo(x, y, x + r, y);
                return this;
              };
            }

            const API_KEY = 'f895c56c400a48c78ecd4cd8b8b75bd5';
            let myChart = null;
            const colors = {
                eur: '#2962ff', usd: '#f0b90b', jpy: '#ff3b30', gbp: '#a331c3',
                cad: '#008d36', chf: '#b2b5be', aud: '#ff7043', nzd: '#26a69a'
            };

            async function updateData() {
                try {
                    // Ajout d'un timestamp pour contourner le cache
                    const startDate = "2025-02-11";
                    const symbols = "EUR/USD,USD/JPY,EUR/JPY,GBP/USD,USD/CAD,USD/CHF,AUD/USD,NZD/USD";
                    const url = `https://api.twelvedata.com/time_series?symbol=${symbols}&interval=1day&start_date=${startDate}&apikey=${API_KEY}&_=${Date.now()}`;
                    
                    const response = await fetch(url);
                    const data = await response.json();

                    const dates = data["EUR/USD"].values.map(v => v.datetime).reverse();
                    const getC = (s) => data[s].values.map(v => parseFloat(v.close)).reverse();

                    const eu = getC("EUR/USD"), uj = getC("USD/JPY"), ej = getC("EUR/JPY");
                    const gu = getC("GBP/USD"), uc = getC("USD/CAD"), uf = getC("USD/CHF");
                    const au = getC("AUD/USD"), nu = getC("NZD/USD");

                    const indices = { eur: [], usd: [], jpy: [], gbp: [], cad: [], chf: [], aud: [], nzd: [] };

                    for (let i = 0; i < dates.length; i++) {
                        let d = {
                            eu: (eu[i]/eu[0])-1, uj: (uj[i]/uj[0])-1, ej: (ej[i]/ej[0])-1,
                            gu: (gu[i]/gu[0])-1, uc: (uc[i]/uc[0])-1, uf: (uf[i]/uf[0])-1,
                            au: (au[i]/au[0])-1, nu: (nu[i]/nu[0])-1
                        };

                        indices.eur.push(((d.eu + d.ej) / 2) * 100 - 7.28);
                        indices.usd.push(((-d.eu + d.uj) / 2) * 100 - 0.28);
                        indices.jpy.push(((-d.ej - d.uj) / 2) * 100 - 0.04);
                        indices.gbp.push(d.gu * 100 - 7.97);
                        indices.cad.push(-d.uc * 100 - 6.73);
                        indices.chf.push(-d.uf * 100 - 4.25); 
                        indices.aud.push(d.au * 100 - 3.95);
                        indices.nzd.push(d.nu * 100 - 7.27);
                    }

                    render(dates, indices);
                } catch (e) { 
                    console.error('Erreur lors de la mise à jour des données :', e);
                }
            }

            function render(labels, indices) {
                if (myChart) myChart.destroy();

                const rightLabelPlugin = {
                    id: 'rightLabelPlugin',
                    afterDraw: (chart) => {
                        const { ctx, chartArea: { right }, scales: { y } } = chart;
                        ctx.save();
                        chart.data.datasets.forEach((dataset) => {
                            const lastVal = dataset.data[dataset.data.length - 1];
                            const yPos = y.getPixelForValue(lastVal);
                            
                            ctx.fillStyle = "#161a1e";
                            ctx.strokeStyle = dataset.borderColor;
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.roundRect(right + 10, yPos - 11, 85, 22, 4);
                            ctx.fill();
                            ctx.stroke();

                            ctx.fillStyle = dataset.borderColor;
                            ctx.font = "bold 11px sans-serif";
                            ctx.textAlign = "left";
                            ctx.fillText(`${dataset.label} ${lastVal.toFixed(2)}%`, right + 15, yPos + 4);
                        });
                        ctx.restore();
                    }
                };

                myChart = new Chart(document.getElementById('currentieschart'), {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: Object.keys(indices).map(key => ({
                            label: key.toUpperCase(),
                            data: indices[key],
                            borderColor: colors[key],
                            borderWidth: 2.5,
                            pointRadius: 0,
                            hoverRadius: 10,
                            tension: 0.1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { 
                            padding: { top: 20, left: 25, bottom: 0, right: 40 } 
                        },
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            y: {
                                position: 'right',
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { 
                                    color: '#ffffff', 
                                    font: { weight: 'bold' },
                                    padding: 10,
                                    callback: (v) => v.toFixed(1) + '%'
                                }
                            },
                            x: {
                                grid: { display: false },
                                offset: true, 
                                ticks: { 
                                    color: '#ffffff', 
                                    maxTicksLimit: 5, 
                                    maxRotation: 0,
                                    minRotation: 0,
                                    padding: 15,
                                    align: 'center',
                                    crossAlign: 'center',
                                    callback: function(value, index, ticks) {
                                        if (index === 0 || index === ticks.length - 1) {
                                            return ''; 
                                        }
                                        const dateStr = this.getLabelForValue(value);
                                        const date = new Date(dateStr);
                                        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { backgroundColor: '#1e222d', padding: 12 }
                        }
                    },
                    plugins: [rightLabelPlugin]
                });
            }

            window.addEventListener('load', updateData);
