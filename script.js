function calculateReturn() {
    // Eingaben holen
    const capital = parseFloat(document.getElementById('start-capital').value);
    const maxCapital = parseFloat(document.getElementById('max-capital').value);
    const winrate = parseFloat(document.getElementById('winrate').value) / 100;
    const avgTp = parseFloat(document.getElementById('avg-tp').value) / 100;
    const avgSl = parseFloat(document.getElementById('avg-sl').value) / 100;
    const leverage = parseFloat(document.getElementById('leverage').value);
    const numTrades = parseInt(document.getElementById('num-trades').value);
    const numSims = 100; // Anzahl Simulationen für Average

    let totalEndCapital = 0;
    let totalReturn = 0;
    let totalMaxDd = 0;
    let worstDd = 0;

    for (let sim = 0; sim < numSims; sim++) {
        let currentCapital = capital;
        let maxCapitalPeak = capital;
        let maxDd = 0;

        for (let trade = 0; trade < numTrades; trade++) {
            const effectiveTp = avgTp * leverage;
            const effectiveSl = avgSl * leverage;
            // Begrenze das Kapital für die Trade-Berechnung
            const tradingCapital = Math.min(currentCapital, maxCapital);

            if (Math.random() < winrate) {
                // Gewinn basierend auf begrenztem Kapital
                currentCapital += tradingCapital * effectiveTp;
            } else {
                // Verlust basierend auf begrenztem Kapital
                currentCapital -= tradingCapital * effectiveSl;
            }

            if (currentCapital > maxCapitalPeak) {
                maxCapitalPeak = currentCapital;
            }

            const currentDd = (maxCapitalPeak - currentCapital) / maxCapitalPeak * 100;
            if (currentDd > maxDd) {
                maxDd = currentDd;
            }

            if (currentCapital <= 0) {
                currentCapital = 0; // Verhindere Negativ, Account ruined
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
    const evPerTrade = maxCapital * (winrate * (avgTp * leverage) - (1 - winrate) * (avgSl * leverage));

    // Ergebnis anzeigen
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>Durchschnittliches Endkapital (über ${numSims} Sims):</strong> ${avgEndCapital.toFixed(2)} €</p>
        <p><strong>Durchschnittlicher Return:</strong> ${avgReturn.toFixed(2)} %</p>
        <p><strong>Durchschnittlicher max. Drawdown:</strong> ${avgMaxDd.toFixed(2)} %</p>
        <p><strong>Schlimmster Drawdown in Sims:</strong> ${worstDd.toFixed(2)} %</p>
        <p><strong>Erwarteter Wert pro Trade (bei max ${maxCapital.toFixed(2)} €):</strong> ${evPerTrade.toFixed(2)} €</p>
    `;
}