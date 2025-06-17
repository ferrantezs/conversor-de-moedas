const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const resultDiv = document.getElementById('result');
const historyList = document.getElementById('history');
const loading = document.getElementById('loading');
const toggleBtn = document.getElementById('toggleTheme');

const API_URL = 'https://api.exchangerate-api.com/v4/latest/';
let chart;

async function loadCurrencies() {
  const res = await fetch(API_URL + 'USD');
  const data = await res.json();
  const currencies = Object.keys(data.rates);

  currencies.forEach(currency => {
    const option1 = document.createElement('option');
    option1.value = option1.textContent = currency;
    const option2 = option1.cloneNode(true);
    fromCurrency.appendChild(option1);
    toCurrency.appendChild(option2);
  });

  fromCurrency.value = 'USD';
  toCurrency.value = 'BRL';
}

loadCurrencies();

convertBtn.addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('amount').value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (isNaN(amount)) return alert('Digite um valor válido.');

  loading.style.display = 'block';
  resultDiv.textContent = '';

  const res = await fetch(API_URL + from);
  const data = await res.json();
  const rate = data.rates[to];
  const converted = (amount * rate).toFixed(2);

  const resultText = `${amount} ${from} = ${converted} ${to}`;
  resultDiv.textContent = resultText;
  loading.style.display = 'none';

  const historyItem = `${new Date().toLocaleString()}: ${resultText}`;
  addToHistory(historyItem);
  updateChart(to, rate);
});

function addToHistory(entry) {
  const li = document.createElement('li');
  li.textContent = entry;
  historyList.prepend(li);
}

function updateChart(currency, rate) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: ['Taxa de Câmbio'],
      datasets: [{
        label: `1 ${fromCurrency.value} = ? ${currency}`,
        data: [rate],
        backgroundColor: 'rgba(123, 44, 191, 0.6)',
        borderColor: '#7b2cbf',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  toggleBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});
