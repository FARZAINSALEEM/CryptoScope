const coinsContainer = document.getElementById("coins-container");
const searchBar = document.getElementById("search-bar");

// Fetch data for the top 20 coins initially
async function fetchCoinsData() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1"
    );
    const coins = await response.json();
    displayCoins(coins);
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
    <h2>${coin.name}</h2>
    <p>$${coin.current_price.toFixed(2)}</p>
    <img src="${coin.image}" alt="${coin.name} logo" />
    <canvas id="chart-${coin.id}" class="chart"></canvas>
  `;

  coinsContainer.appendChild(coinCard);
  fetchCoinChartData(coin.id, `chart-${coin.id}`);
}

// Fetch chart data for a coin
async function fetchCoinChartData(coinId, canvasId) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
    );
    const data = await response.json();
    const chartData = data.prices.map((price) => ({
      date: new Date(price[0]).toLocaleDateString(),
      price: price[1],
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

// Handle search for specific coins
searchBar.addEventListener("input", async (event) => {
  const query = event.target.value.toLowerCase().trim();

  // If the search bar is empty, reload top 20 coins
  if (!query) {
    fetchCoinsData();
    return;
  }

  console.log("Search Query:", query);

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    
    // Log status code and response body for troubleshooting
    console.log("API Response Status:", response.status);
    console.log("API Response Text:", await response.text());  // Log response body

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      coinsContainer.innerHTML =
        '<p style="color: red;">Unable to search for coins. Please try again later.</p>';
      return;
    }

    const searchResults = await response.json();
    console.log("Search Results:", searchResults);  // Log search results

    const coins = searchResults.coins;
    if (coins.length > 0) {
      coinsContainer.innerHTML = ""; // Clear previous results
      coins.forEach((coin) => {
        fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}`)
          .then((res) => res.json())
          .then((coinData) => {
            createCoinCard({
              id: coin.id,
              name: coinData.name,
              current_price: coinData.market_data.current_price.usd,
              image: coinData.image.small,
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
