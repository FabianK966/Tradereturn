let chartInstance = null; // Globale Variable für den Chart

function calculateReturn() {
    // Eingaben holen
    const capital = parseFloat(document.getElementById('start-capital').value);
    const maxCapital = parseFloat(document.getElementById('max-capital').value);
    const winrate = parseFloat(document.getElementById('winrate').value) / 100;
    const avgTp = parseFloat(document.getElementById('avg-tp').value) / 100;
    const avgSl = parseFloat(document.getElementById('avg-sl').value) / 100;
    const breakEvenRate = parseFloat(document.getElementById('break-even-rate').value) / 100;
    const baseFee = parseFloat(document.getElementById('fee-per-trade').value) / 100;
    const leverage = parseFloat(document.getElementById('leverage').value);
    const numTrades = parseInt(document.getElementById('num-trades').value);
    const numSims = 1; // Nur eine Simulation
    const profitTrigger = parseFloat(document.getElementById('profit-trigger').value);
    const profitTakePercentage = parseFloat(document.getElementById('profit-take-percentage').value) / 100;

    let totalEndCapital = 0;
    let totalReturn = 0;
    let totalMaxDd = 0;
    let worstDd = 0;
    let totalFees = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalBreakEvens = 0;
    let totalMaxLossStreak = 0;
    let totalMaxWinStreak = 0;
    let totalMaxDdDuration = 0;
    let totalAvgRecoveryTime = 0;
    let totalCumulativeProfit = 0; // Nur Profit-Takings
    let capitalHistory = [capital]; // Für die erste Sim

    for (let sim = 0; sim < numSims; sim++) {
        let currentCapital = capital;
        let baseCapital = capital; // Startkapital als Basis für den ersten Trigger
        let maxCapitalPeak = capital; // Peak nur bei realen Zuwächsen aktualisieren
        let maxDd = 0;
        let simFees = 0;
        let simWins = 0;
        let simLosses = 0;
        let simBreakEvens = 0;
        let currentLossStreak = 0;
        let maxLossStreak = 0;
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentDdDuration = 0;
        let maxDdDuration = 0;
        let recoveryTrades = 0;
        let totalRecoveryTrades = 0;
        let recoveryCount = 0;
        let simCumulativeProfit = 0; // Nur Profit-Takings

        if (sim === 0) {
            capitalHistory = [capital]; // Reset für erste Sim
        }

        for (let trade = 0; trade < numTrades; trade++) {
            const effectiveTp = avgTp * leverage;
            const effectiveSl = avgSl * leverage;
            const tradingCapital = Math.min(currentCapital, maxCapital);
            const effectiveFee = baseFee * leverage;

            // Break-Even-Stop-Loss anpassen, um Gebühren zu decken
            const adjustedBreakEvenSl = effectiveFee; // SL = Gebühr, damit Break-Even ±0 ist

            const isBreakEven = Math.random() < breakEvenRate;
            if (isBreakEven) {
                simBreakEvens++;
                currentCapital -= tradingCapital * adjustedBreakEvenSl; // Nur Gebühr abziehen
                currentLossStreak = 0;
                currentWinStreak = 0;
            } else {
                if (Math.random() < winrate) {
                    const profitThisTrade = tradingCapital * effectiveTp;
                    currentCapital += profitThisTrade;
                    simWins++;
                    currentWinStreak++;
                    currentLossStreak = 0;
                    if (currentWinStreak > maxWinStreak) {
                        maxWinStreak = currentWinStreak;
                    }
                    // Nur bei realem Gewinn Peak aktualisieren
                    if (currentCapital > maxCapitalPeak) {
                        maxCapitalPeak = currentCapital;
                    }
                } else {
                    const lossThisTrade = tradingCapital * effectiveSl;
                    currentCapital -= lossThisTrade;
                    simLosses++;
                    currentLossStreak++;
                    currentWinStreak = 0;
                    if (currentLossStreak > maxLossStreak) {
                        maxLossStreak = currentLossStreak;
                    }
                }
            }

            // Gebühr abziehen (bereits bei Break-Even abgezogen)
            const feeThisTrade = tradingCapital * effectiveFee;
            currentCapital -= feeThisTrade * (isBreakEven ? 0 : 1); // Nur bei Win/Loss Gebühr nochmal abziehen
            simFees += feeThisTrade;

            // Dynamisches Profit-Taking
            if (currentCapital >= baseCapital * profitTrigger) { // Nur Trigger-Check, ohne Peak-Bedingung
                const profitBase = baseCapital;
                const profit = Math.round((currentCapital - profitBase) * profitTakePercentage); // Rundung auf ganze Euro
                if (profit > 0) {
                    currentCapital -= profit;
                    simCumulativeProfit += profit; // Nur Profit-Taking zum kumulativen Profit hinzufügen
                    console.log(`Trade ${trade}: Profit-Taking ausgelöst, Base: ${profitBase}, Current: ${currentCapital + profit}, Abgezogen: ${profit}, Kumulativ: ${simCumulativeProfit}`);
                    baseCapital = currentCapital; // Aktualisiere Basis nach Profit-Taking
                }
            }

            if (sim === 0) {
                capitalHistory.push(currentCapital);
            }

            // Drawdown tracken
            if (currentCapital > maxCapitalPeak) {
                maxCapitalPeak = currentCapital;
                currentDdDuration = 0; // Reset DD-Dauer
                if (recoveryCount > 0) {
                    totalRecoveryTrades += recoveryTrades;
                    recoveryCount++;
                    recoveryTrades = 0;
                }
            } else {
                currentDdDuration++;
                recoveryTrades++;
                if (currentDdDuration > maxDdDuration) {
                    maxDdDuration = currentDdDuration;
                }
            }

            const currentDd = (maxCapitalPeak > 0 ? (maxCapitalPeak - currentCapital) / maxCapitalPeak * 100 : 100);
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
        totalFees += simFees;
        totalWins += simWins;
        totalLosses += simLosses;
        totalBreakEvens += simBreakEvens;
        totalMaxLossStreak += maxLossStreak;
        totalMaxWinStreak += maxWinStreak;
        totalMaxDdDuration += maxDdDuration;
        totalAvgRecoveryTime += (recoveryCount > 0 ? totalRecoveryTrades / recoveryCount : 0);
        totalCumulativeProfit += simCumulativeProfit; // Nur Profit-Takings
    }

    const avgEndCapital = totalEndCapital / numSims;
    const avgReturn = totalReturn / numSims;
    const avgMaxDd = totalMaxDd / numSims;
    const avgFees = totalFees / numSims;
    const avgWins = totalWins / numSims;
    const avgLosses = totalLosses / numSims;
    const avgBreakEvens = totalBreakEvens / numSims;
    const avgMaxLossStreak = totalMaxLossStreak / numSims;
    const avgMaxWinStreak = totalMaxWinStreak / numSims;
    const winLossRatio = avgWins / (avgLosses || 1);
    const avgMaxDdDuration = totalMaxDdDuration / numSims;
    const avgRecoveryTime = totalAvgRecoveryTime / numSims;
    const avgCumulativeProfit = Math.round(totalCumulativeProfit / numSims); // Rundung auf ganze Euro für Durchschnitt
    const evPerTrade = maxCapital * ((1 - breakEvenRate) * (winrate * (avgTp * leverage) - (1 - winrate) * (avgSl * leverage)) - baseFee * leverage);

    // Ergebnis anzeigen
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>Endkapital (1 Sim):</strong> ${avgEndCapital.toFixed(2)} €</p>
        <p><strong>Return:</strong> ${avgReturn.toFixed(2)} %</p>
        <p><strong>Max. Drawdown:</strong> ${avgMaxDd.toFixed(2)} %</p>
        <p><strong>Schlimmster Drawdown in Sim:</strong> ${worstDd.toFixed(2)} %</p>
        <p><strong>Erwarteter Wert pro Trade (bei max ${maxCapital.toFixed(2)} €):</strong> ${evPerTrade.toFixed(2)} €</p>
        <p><strong>Gesamtfees:</strong> ${avgFees.toFixed(2)} €</p>
        <p><strong>Anzahl Wins:</strong> ${avgWins.toFixed(0)}</p>
        <p><strong>Anzahl Losses:</strong> ${avgLosses.toFixed(0)}</p>
        <p><strong>Anzahl Break-Evens:</strong> ${avgBreakEvens.toFixed(0)}</p>
        <p><strong>Win/Loss Ratio:</strong> ${winLossRatio.toFixed(2)}</p>
        <p><strong>Längste Losing-Streak:</strong> ${avgMaxLossStreak.toFixed(0)}</p>
        <p><strong>Längste Winning-Streak:</strong> ${avgMaxWinStreak.toFixed(0)}</p>
        <p><strong>Max. Drawdown-Dauer (Trades):</strong> ${avgMaxDdDuration.toFixed(0)}</p>
        <p><strong>Recovery-Zeit (Trades):</strong> ${avgRecoveryTime.toFixed(0)}</p>
        <p><strong>Kumulativer Profit (nur Profit-Takings):</strong> ${avgCumulativeProfit.toFixed(0)} €</p>
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