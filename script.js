let chartInstance = null; // Globale Variable für den Chart

function calculateReturn() {
    // Eingaben holen
    const capital = parseFloat(document.getElementById('start-capital').value);
    const maxCapital = parseFloat(document.getElementById('max-capital').value);
    const winrate = parseFloat(document.getElementById('winrate').value) / 100;
    const avgTp = parseFloat(document.getElementById('avg-tp').value) / 100;
    const avgSl = parseFloat(document.getElementById('avg-sl').value) / 100;
    const breakEvenRate = parseFloat(document.getElementById('break-even-rate').value) / 100;
    const feePerTrade = parseFloat(document.getElementById('fee-per-trade').value) / 100;
    const leverage = parseFloat(document.getElementById('leverage').value);
    const numTrades = parseInt(document.getElementById('num-trades').value);
    const numSims = 100;

    let totalEndCapital = 0;
    let totalReturn = 0;
    let totalMaxDd = 0;
    let worstDd = 0;
    let capitalHistory = [capital]; // Für die erste Sim

    for (let sim = 0; sim < numSims; sim++) {
        let currentCapital = capital;
        let maxCapitalPeak = capital;
        let maxDd = 0;

        if (sim === 0) {
            capitalHistory = [capital]; // Reset für erste Sim
        }

        for (let trade = 0; trade < numTrades; trade++) {
            const effectiveTp = avgTp * leverage;
            const effectiveSl = avgSl * leverage;
            const effectiveFee = feePerTrade * leverage;
            const tradingCapital = Math.min(currentCapital, maxCapital);

            const isBreakEven = Math.random() < breakEvenRate;
            if (!isBreakEven) {
                if (Math.random() < winrate) {
                    currentCapital += tradingCapital * effectiveTp;
                } else {
                    currentCapital -= tradingCapital * effectiveSl;
                }
            } // Bei Break-Even: Keine Änderung durch TP/SL

            // Gebühr für jeden Trade abziehen
            currentCapital -= tradingCapital * effectiveFee;

            if (sim === 0) {
                capitalHistory.push(currentCapital);
            }

            if (currentCapital > maxCapitalPeak) {
                maxCapitalPeak = currentCapital;
            }

            const currentDd = (maxCapitalPeak - currentCapital) / maxCapitalPeak * 100;
            if (currentDd > maxDd) {
                maxDd = currentDd;
            }

            if (currentCapital <= 0) {
                currentCapital = 0;
                if (sim === 0) {
                    capitalHistory.push(0);
                }
                break;
            }
        }

        const simReturn = ((currentCapital - capital) / capital) * 100;
        totalEndCapital += currentCapital;
        totalReturn += simReturn;
        totalMaxDd += maxDd;
        if (maxDd > worstDd) {
            worstDd = maxDd;
        }
    }

    const avgEndCapital = totalEndCapital / numSims;
    const avgReturn = totalReturn / numSims;
    const avgMaxDd = totalMaxDd / numSims;
    const evPerTrade = maxCapital * ((1 - breakEvenRate) * (winrate * (avgTp * leverage) - (1 - winrate) * (avgSl * leverage)) - feePerTrade * leverage);

    // Ergebnis anzeigen
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>Durchschnittliches Endkapital (über ${numSims} Sims):</strong> ${avgEndCapital.toFixed(2)} €</p>
        <p><strong>Durchschnittlicher Return:</strong> ${avgReturn.toFixed(2)} %</p>
        <p><strong>Durchschnittlicher max. Drawdown:</strong> ${avgMaxDd.toFixed(2)} %</p>
        <p><strong>Schlimmster Drawdown in Sims:</strong> ${worstDd.toFixed(2)} %</p>
        <p><strong>Erwarteter Wert pro Trade (bei max ${maxCapital.toFixed(2)} €):</strong> ${evPerTrade.toFixed(2)} €</p>
    `;

    // Vorherigen Chart zerstören, falls vorhanden
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Liniengraph erstellen
    const ctx = document.getElementById('capitalChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: capitalHistory.length }, (_, i) => i),
            datasets: [{
                label: 'Kapitalverlauf (€)',
                data: capitalHistory,
                borderColor: '#4CAF50',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Trade-Nummer' }
                },
                y: {
                    title: { display: true, text: 'Kapital (€)' },
                    beginAtZero: false
                }
            }
        }
    });
}