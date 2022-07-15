//腳本出處：https://kinta.ma/surge/scripts/crypto_currency_price.js
const baseUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=';
const symbols = [
  'BTC',
  'ETH',
  'BNB',
  'XMR',
  'MATIC',
];
let count = 0;

let message = {
  title: '最新幣價',
  content: '',
  icon: 'bitcoinsign.circle',
  'icon-color': '#ef8f1c',
};

fetchPrice(0);

function fetchPrice(index) {
  if (index > symbols.length - 1) {
    return;
  }

  const symbol = symbols[index];
  $httpClient.get(baseUrl + symbol + 'USDT', function (error, response, data) {
    if (error) {
      return;
    }
    const price = JSON.parse(data).price;
    message.content = message.content + symbol + ': $' + Number(price).toFixed(2) + '\n';
    count += 1;
    showMessage();
    fetchPrice(index + 1);
  });
}

function showMessage() {
  if (count == symbols.length) {
    $done(message);
  }
}
