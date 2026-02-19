(function () {
  const TOKEN_PRICE_RUB = 0.33;

  function formatRuNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  function calculateTokenPackage(priceRub) {
    return Math.floor(priceRub / TOKEN_PRICE_RUB);
  }

  function renderTokenCalculation(selector, priceRub) {
    const target = document.querySelector(selector);
    if (!target) {
      return;
    }

    const tokenCount = calculateTokenPackage(priceRub);
    const formattedTokens = formatRuNumber(tokenCount);
    target.textContent = `${formatRuNumber(priceRub)} ₽ ÷ ${TOKEN_PRICE_RUB} ₽ = ${formattedTokens} токенов`;
  }

  window.MVPBotUtils = {
    TOKEN_PRICE_RUB,
    calculateTokenPackage,
    formatRuNumber,
    renderTokenCalculation,
  };
})();
