function calculateReturn() {
    // Eingaben holen
    let capital = parseFloat(document.getElementById('start-capital').value);
    const winrate = parseFloat(document.getElementById('winrate').value) / 100;
    const avgTp = parseFloat(document.getElementById('avg-tp').value) / 100; // in Dezimal
    const avgSl = parseFloat(document.getElementById('avg-sl').value) / 100; // in Dezimal
    const numTrades = parseInt(document.getElementById('num-trades').value);
    const riskPerTrade = 0.01; // 1% Risiko pro Trade (anpassbar)

    let endCapital = capital;
    let totalWins = 0;
    let totalLosses = 0;

    // Simuliere Trades (einfache deterministische Annäherung: basierend auf Winrate)
    const expectedWins = Math.round(numTrades * winrate);
    const expectedLosses = numTrades - expectedWins;

    // Für Compounding: Gewinne und Verluste sequentiell anwenden (vereinfacht)
    for (let i = 0; i < expectedWins; i++) {
        const profit = endCapital * riskPerTrade * (avgTp / riskPerTrade); // Risk-Reward anpassen
        endCapital += profit;
    }
    for (let i = 0; i < expectedLosses; i++) {
        const loss = endCapital * avgSl; // Verlust basierend auf SL
        endCapital -= loss;
    }

    const totalReturn = ((endCapital - capital) / capital) * 100;
    const evPerTrade = (winrate * avgTp * capital * riskPerTrade) - ((1 - winrate) * avgSl * capital * riskPerTrade);

    // Ergebnis anzeigen
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>Endkapital nach ${numTrades} Trades:</strong> ${endCapital.toFixed(2)} €</p>
        <p><strong>Gesamter Return:</strong> ${totalReturn.toFixed(2)} %</p>
        <p><strong>Erwarteter Wert pro Trade:</strong> ${evPerTrade.toFixed(2)} €</p>
        <p><strong>Gewinne/Verluste:</strong> ${expectedWins} Wins / ${expectedLosses} Losses</p>
    `;
}