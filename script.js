const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const resultText = document.getElementById('resultText');
const resultArea = document.getElementById('resultArea');
const rateInfo = document.getElementById('rateInfo');
const historyList = document.getElementById('history');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const multiResultSection = document.getElementById('multiResultSection');
const multiGrid = document.getElementById('multiGrid');
const newsList = document.getElementById('news-list');

const RSS_FEEDS = [
  'https://www.infomoney.com.br/feed/',
  'https://g1.globo.com/rss/g1/economia/',
  'https://www.cnnbrasil.com.br/economia/feed/',
];
const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

const TOP_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'AUD', 'CAD', 'CHF'];
const FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  BRL: '🇧🇷', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭',
  CNY: '🇨🇳', ARS: '🇦🇷', MXN: '🇲🇽', INR: '🇮🇳',
};

let chart;

async function loadCurrencies() {
  const res = await fetch(API_URL + 'USD');
  const data = await res.json();
  Object.keys(data.rates).forEach(currency => {
    const opt1 = document.createElement('option');
    opt1.value = opt1.textContent = currency;
    const opt2 = opt1.cloneNode(true);
    fromCurrency.appendChild(opt1);
    toCurrency.appendChild(opt2);
  });
  fromCurrency.value = 'USD';
  toCurrency.value = 'BRL';
}

loadCurrencies();

swapBtn.addEventListener('click', () => {
  const tmp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = tmp;
  swapBtn.classList.add('rotating');
  setTimeout(() => swapBtn.classList.remove('rotating'), 300);
});

convertBtn.addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('amount').value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (isNaN(amount) || amount <= 0) return alert('Digite um valor válido.');

  convertBtn.disabled = true;
  convertBtn.textContent = '⏳ Convertendo...';

  const res = await fetch(API_URL + from);
  const data = await res.json();
  const rates = data.rates;
  const rate = rates[to];
  const converted = fmtAmount(amount * rate, to);
  const text = `${amount} ${from} = ${converted} ${to}`;

  resultText.textContent = text;
  rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
  resultArea.classList.remove('hidden');

  const targets = TOP_CURRENCIES.filter(c => c !== from);
  multiGrid.innerHTML = '';
  targets.forEach(currency => {
    const r = rates[currency];
    if (!r) return;
    const div = document.createElement('div');
    div.className = 'multi-item glass';
    div.innerHTML = `
      <span class="multi-flag">${FLAGS[currency] || ''}</span>
      <span class="multi-code">${currency}</span>
      <span class="multi-val">${fmtAmount(amount * r, currency)}</span>
    `;
    multiGrid.appendChild(div);
  });
  multiResultSection.classList.remove('hidden');

  addToHistory(text);
  updateChart(from, rates);

  convertBtn.disabled = false;
  convertBtn.textContent = 'Converter';
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(resultText.textContent).then(() => {
    copyBtn.textContent = '✅';
    setTimeout(() => (copyBtn.textContent = '📋'), 1500);
  });
});

clearHistoryBtn.addEventListener('click', () => {
  historyList.innerHTML = '<li class="history-empty">Nenhuma conversão ainda.</li>';
});

function fmtAmount(val, currency) {
  const noDecimals = ['JPY', 'KRW', 'IDR', 'VND', 'CLP'];
  return noDecimals.includes(currency)
    ? Math.round(val).toLocaleString('pt-BR')
    : val.toFixed(2);
}

function addToHistory(entry) {
  const empty = historyList.querySelector('.history-empty');
  if (empty) empty.remove();
  const li = document.createElement('li');
  li.className = 'history-item';
  const span = document.createElement('span');
  span.textContent = entry;
  const small = document.createElement('small');
  small.textContent = new Date().toLocaleString('pt-BR');
  li.appendChild(span);
  li.appendChild(small);
  historyList.prepend(li);
}

function updateChart(from, rates) {
  const labels = TOP_CURRENCIES.filter(c => c !== from);
  const values = labels.map(c => rates[c] || 0);
  const flagLabels = labels.map(c => `${FLAGS[c] || ''} ${c}`);
  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#ede9fe' : '#1e1b4b';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: flagLabels,
      datasets: [{
        label: `1 ${from} →`,
        data: values,
        backgroundColor: 'rgba(124, 58, 237, 0.45)',
        borderColor: '#7c3aed',
        borderWidth: 2,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: textColor } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });
}

async function fetchMarketNews() {
  newsList.innerHTML = '<li>⏳ Carregando notícias...</li>';

  for (const feedUrl of RSS_FEEDS) {
    try {
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'ok' || !data.items?.length) continue;

      newsList.innerHTML = '';
      data.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'news-item';

        if (item.thumbnail) {
          const img = document.createElement('img');
          img.src = item.thumbnail;
          img.alt = '';
          img.className = 'news-img';
          li.appendChild(img);
        }

        const div = document.createElement('div');
        div.className = 'news-content';

        const a = document.createElement('a');
        if (item.link?.startsWith('http')) a.href = item.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = item.title;

        const small = document.createElement('small');
        const date = item.pubDate ? new Date(item.pubDate).toLocaleDateString('pt-BR') : '';
        small.textContent = `${data.feed.title}${date ? ' · ' + date : ''}`;

        div.appendChild(a);
        div.appendChild(small);
        li.appendChild(div);
        newsList.appendChild(li);
      });
      return;
    } catch {
      continue;
    }
  }

  newsList.innerHTML = '<li>Erro ao carregar notícias.</li>';
}

fetchMarketNews();
setInterval(fetchMarketNews, 60 * 60 * 1000);

const nome = localStorage.getItem('usuario_nome');
if (nome) {
  const saudacao = document.getElementById('saudacao');
  if (saudacao) saudacao.textContent = `Olá, ${nome}!`;
}
