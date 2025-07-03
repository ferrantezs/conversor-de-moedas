const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const resultDiv = document.getElementById('result');
const historyList = document.getElementById('history');
const loading = document.getElementById('loading');
const toggleBtn = document.getElementById('toggleTheme');
const NEWS_API_KEY = '3f978b1767c44a0fb65b100b5796350e'; // coloque sua chave aqui
const newsList = document.getElementById('news-list');

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

async function fetchMarketNews() {
  newsList.innerHTML = '<li>⏳ Carregando notícias...</li>';
  try {
    const apiUrl = `https://newsapi.org/v2/everything?q=(dólar OR euro OR mercado financeiro)&language=pt&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const articles = JSON.parse(data.contents).articles;
    newsList.innerHTML = '';
    if (articles && articles.length > 0) {
      articles.forEach(article => {
        const li = document.createElement('li');
        li.className = 'news-item';
        li.innerHTML = `
          ${article.urlToImage ? `<img src="${article.urlToImage}" alt="Imagem da notícia" class="news-img">` : ''}
          <div class="news-content">
            <a href="${article.url}" target="_blank"><strong>${article.title}</strong></a>
            <br>
            <small>${article.source.name} - ${new Date(article.publishedAt).toLocaleString('pt-BR')}</small>
          </div>
        `;
        newsList.appendChild(li);
      });
    } else {
      newsList.innerHTML = '<li>Nenhuma notícia encontrada.</li>';
    }
  } catch (error) {
    newsList.innerHTML = '<li>Erro ao carregar notícias.</li>';
  }
}

// Atualiza ao carregar e a cada 1 hora
fetchMarketNews();
setInterval(fetchMarketNews, 60 * 60 * 1000);

window.addEventListener('DOMContentLoaded', () => {
  const nome = localStorage.getItem('usuario_nome');
  if (nome) {
    const saudacao = document.getElementById('saudacao');
    if (saudacao) {
      saudacao.textContent = `Olá, ${nome}! 👋`;
    }
  }
});
