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
    let totalFees = 0; // Neu: Gesamte Fees über alle Sims
    let totalWins = 0;
    let totalLosses = 0;
    let totalBreakEvens = 0;
    let totalMaxLossStreak = 0;
    let ruinedSims = 0; // Neu: Anzahl ruinierten Sims
    let capitalHistory = [capital]; // Für die erste Sim

    for (let sim = 0; sim < numSims; sim++) {
        let currentCapital = capital;
        let maxCapitalPeak = capital;
        let maxDd = 0;
        let simFees = 0; // Fees pro Sim
        let simWins = 0;
        let simLosses = 0;
        let simBreakEvens = 0;
        let currentLossStreak = 0;
        let maxLossStreak = 0;

        if (sim === 0) {
            capitalHistory = [capital]; // Reset für erste Sim
        }

        for (let trade = 0; trade < numTrades; trade++) {
            const effectiveTp = avgTp * leverage;
            const effectiveSl = avgSl * leverage;
            const effectiveFee = feePerTrade * leverage;
            const tradingCapital = Math.min(currentCapital, maxCapital);

            const isBreakEven = Math.random() < breakEvenRate;
            if (isBreakEven) {
                simBreakEvens++;
                currentLossStreak = 0; // Break-Even bricht keine Streak
            } else {
                if (Math.random() < winrate) {
                    currentCapital += tradingCapital * effectiveTp;
                    simWins++;
                    currentLossStreak = 0;
                } else {
                    currentCapital -= tradingCapital * effectiveSl;
                    simLosses++;
                    currentLossStreak++;
                    if (currentLossStreak > maxLossStreak) {
                        maxLossStreak = currentLossStreak;
                    }
                }
            }

            // Gebühr für jeden Trade abziehen
            const feeThisTrade = tradingCapital * effectiveFee;
            currentCapital -= feeThisTrade;
            simFees += feeThisTrade;

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
                ruinedSims++; // Sim als ruiniert markieren
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
        totalFees += simFees;
        totalWins += simWins;
        totalLosses += simLosses;
        totalBreakEvens += simBreakEvens;
        totalMaxLossStreak += maxLossStreak;
    }

    const avgEndCapital = totalEndCapital / numSims;
    const avgReturn = totalReturn / numSims;
    const avgMaxDd = totalMaxDd / numSims;
    const avgFees = totalFees / numSims;
    const avgWins = totalWins / numSims;
    const avgLosses = totalLosses / numSims;
    const avgBreakEvens = totalBreakEvens / numSims;
    const avgMaxLossStreak = totalMaxLossStreak / numSims;
    const ruinProbability = (ruinedSims / numSims) * 100;
    const winLossRatio = avgWins / (avgLosses || 1); // Vermeide Division durch 0
    const evPerTrade = maxCapital * ((1 - breakEvenRate) * (winrate * (avgTp * leverage) - (1 - winrate) * (avgSl * leverage)) - feePerTrade * leverage);

    // Ergebnis anzeigen
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>Durchschnittliches Endkapital (über ${numSims} Sims):</strong> ${avgEndCapital.toFixed(2)} €</p>
        <p><strong>Durchschnittlicher Return:</strong> ${avgReturn.toFixed(2)} %</p>
        <p><strong>Durchschnittlicher max. Drawdown:</strong> ${avgMaxDd.toFixed(2)} %</p>
        <p><strong>Schlimmster Drawdown in Sims:</strong> ${worstDd.toFixed(2)} %</p>
        <p><strong>Erwarteter Wert pro Trade (bei max ${maxCapital.toFixed(2)} €):</strong> ${evPerTrade.toFixed(2)} €</p>
        <p><strong>Durchschnittliche Gesamtfees:</strong> ${avgFees.toFixed(2)} €</p>
        <p><strong>Durchschnittliche Anzahl Wins:</strong> ${avgWins.toFixed(0)}</p>
        <p><strong>Durchschnittliche Anzahl Losses:</strong> ${avgLosses.toFixed(0)}</p>
        <p><strong>Durchschnittliche Anzahl Break-Evens:</strong> ${avgBreakEvens.toFixed(0)}</p>
        <p><strong>Win/Loss Ratio:</strong> ${winLossRatio.toFixed(2)}</p>
        <p><strong>Durchschnittliche längste Losing-Streak:</strong> ${avgMaxLossStreak.toFixed(0)}</p>
        <p><strong>Ruin-Wahrscheinlichkeit:</strong> ${ruinProbability.toFixed(2)} %</p>
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