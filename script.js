const coinsContainer = document.getElementById("coins-container");
const searchBar = document.getElementById("search-bar");

// Base URLs for APIs
const COINCAP_API = "https://api.coincap.io/v2";
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Fetch data for the top 20 coins initially
async function fetchCoinsData() {
  try {
    const response = await fetch(`${COINCAP_API}/assets?limit=20`);
    const data = await response.json();
    displayCoins(data.data);
  } catch (error) {
    console.error("Error fetching coin data:", error);
    coinsContainer.innerHTML =
      '<p style="color: red;">Unable to load data. Please try again later.</p>';
  }
}

// Display coins in the container
function displayCoins(coins) {
  coinsContainer.innerHTML = ""; // Clear the container
  coins.forEach((coin) => createCoinCard(coin));
}

// Create a coin card
function createCoinCard(coin) {
  const coinCard = document.createElement("div");
  coinCard.className = "coin-card";

  coinCard.innerHTML = `
    <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
    <p>Price: $${parseFloat(coin.priceUsd).toFixed(2)}</p>
    <canvas id="chart-${coin.id}" class="chart"></canvas>
    <div class="exchange-links">
      <a href="https://www.binance.com/en/trade/${coin.symbol}_USDT" target="_blank">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/Binance_Logo.png" alt="Binance" class="exchange-logo" />
      </a>
      <a href="https://www.bitget.com/en/spot/${coin.symbol}USDT" target="_blank">
        <img src="https://www.bitget.com/favicon.ico" alt="Bitget" class="exchange-logo" />
      </a>
      <a href="https://www.bybit.com/en-US/trade/${coin.symbol}USDT" target="_blank">
        <img src="https://www.bybit.com/favicon.ico" alt="Bybit" class="exchange-logo" />
      </a>
    </div>
  `;

  coinsContainer.appendChild(coinCard);
  fetchCoinChartData(coin.id, `chart-${coin.id}`);
}

// Fetch chart data for a coin
async function fetchCoinChartData(coinId, canvasId) {
  try {
    const response = await fetch(
      `${COINCAP_API}/assets/${coinId}/history?interval=d1`
    );
    const data = await response.json();
    const chartData = data.data.map((entry) => ({
      date: new Date(entry.time).toLocaleDateString(),
      price: parseFloat(entry.priceUsd),
    }));
    setupChart(canvasId, chartData);
  } catch (error) {
    console.error(`Error fetching chart data for ${coinId}:`, error);
  }
}

// Create a chart using Chart.js
function setupChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((point) => point.date),
      datasets: [
        {
          label: "Price (USD)",
          data: data.map((point) => point.price),
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          pointBackgroundColor: "#4caf50",
          borderWidth: 2,
          tension: 0.4, // Smooth curve
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: "#bbb" }, grid: { display: false } },
        y: { ticks: { color: "#bbb" }, grid: { color: "#444", borderDash: [5, 5] } },
      },
    },
  });
}

// Handle search with fallback to CoinGecko
searchBar.addEventListener("input", async (event) => {
  const query = event.target.value.toLowerCase().trim();

  // If the search bar is empty, reload top 20 coins
  if (!query) {
    fetchCoinsData();
    return;
  }

  try {
    // Search using CoinCap
    const coinCapResponse = await fetch(`${COINCAP_API}/assets?search=${query}`);
    const coinCapData = await coinCapResponse.json();

    if (coinCapData.data && coinCapData.data.length > 0) {
      displayCoins(coinCapData.data);
      return;
    }

    // Fallback to CoinGecko for broader search
    const coinGeckoResponse = await fetch(`${COINGECKO_API}/search?query=${query}`);
    const coinGeckoData = await coinGeckoResponse.json();
    const coins = coinGeckoData.coins;

    if (coins.length > 0) {
      coinsContainer.innerHTML = ""; // Clear previous results
      coins.forEach((coin) => {
        fetch(`${COINGECKO_API}/coins/${coin.id}`)
          .then((res) => res.json())
          .then((coinData) => {
            createCoinCard({
              id: coin.id,
              name: coinData.name,
              symbol: coinData.symbol,
              priceUsd: coinData.market_data.current_price.usd,
            });
          })
          .catch((error) => {
            console.error(`Error fetching coin data for ${coin.id}:`, error);
          });
      });
    } else {
      coinsContainer.innerHTML =
        '<p style="color: yellow;">No matching coins found. Try another search.</p>';
    }
  } catch (error) {
    console.error("Error searching for coins:", error);
    coinsContainer.innerHTML =
      '<p style="color: red;">Unable to search for coins. Please try again later.</p>';
  }
});

// Initial load
fetchCoinsData();
