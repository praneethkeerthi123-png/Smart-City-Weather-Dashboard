const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortSelect");
const currentWeather = document.getElementById("currentWeather");
const forecastContainer = document.getElementById("forecastContainer");
const statusBox = document.getElementById("status");
const themeToggle = document.getElementById("themeToggle");

const previewCity = document.getElementById("previewCity");
const previewIcon = document.getElementById("previewIcon");
const previewTemp = document.getElementById("previewTemp");
const previewCondition = document.getElementById("previewCondition");
const previewHumidity = document.getElementById("previewHumidity");
const previewWind = document.getElementById("previewWind");

let forecastData = [];

const weatherCodes = {
  0: { label: "Clear Sky", icon: "☀️" },
  1: { label: "Mainly Clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Moderate Drizzle", icon: "🌦️" },
  55: { label: "Dense Drizzle", icon: "🌧️" },
  61: { label: "Slight Rain", icon: "🌦️" },
  63: { label: "Moderate Rain", icon: "🌧️" },
  65: { label: "Heavy Rain", icon: "🌧️" },
  71: { label: "Slight Snow", icon: "🌨️" },
  73: { label: "Moderate Snow", icon: "❄️" },
  75: { label: "Heavy Snow", icon: "❄️" },
  80: { label: "Rain Showers", icon: "🌦️" },
  81: { label: "Moderate Showers", icon: "🌧️" },
  82: { label: "Violent Showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" }
};

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? "#f87171" : "";
}

function getWeatherDetails(code) {
  return weatherCodes[code] || { label: "Unknown", icon: "🌍" };
}

function getAdvice(maxTemp, minTemp, code) {
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return "Carry an umbrella. Rain is likely today.";
  }
  if ([71, 73, 75].includes(code)) {
    return "Wear warm clothes. Snowy conditions expected.";
  }
  if (code === 95) {
    return "Thunderstorm chances are high. Stay careful outdoors.";
  }
  if (maxTemp >= 35) {
    return "Stay hydrated and avoid peak afternoon heat.";
  }
  if (minTemp <= 12) {
    return "It may feel chilly. Carry a jacket when stepping out.";
  }
  if (maxTemp >= 28 && maxTemp < 35) {
    return "Warm weather ahead. Light clothing should feel comfortable.";
  }
  return "Pleasant weather overall. A good day to be outside.";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

async function getCoordinates(city) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(geoUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch city data.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Try another city name.");
  }

  return data.results[0];
}

async function getWeather(latitude, longitude) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch weather data.");
  }

  return response.json();
}

function updatePreview(cityName, country, currentData) {
  const details = getWeatherDetails(currentData.weather_code);

  previewCity.textContent = `${cityName}${country ? `, ${country}` : ""}`;
  previewIcon.textContent = details.icon;
  previewTemp.textContent = `${currentData.temperature_2m}°C`;
  previewCondition.textContent = details.label;
  previewHumidity.textContent = `${currentData.relative_humidity_2m}%`;
  previewWind.textContent = `${currentData.wind_speed_10m} km/h`;
}

function renderCurrentWeather(cityName, country, weatherData) {
  const current = weatherData.current;
  const daily = weatherData.daily;
  const details = getWeatherDetails(current.weather_code);
  const advice = getAdvice(
    daily.temperature_2m_max[0],
    daily.temperature_2m_min[0],
    daily.weather_code[0]
  );

  currentWeather.innerHTML = `
    <div class="current-card">
      <div class="current-left">
        <p class="section-tag">Current conditions</p>
        <h2>${cityName}${country ? `, ${country}` : ""}</h2>
        <p class="current-condition">${details.label}</p>

        <div class="temp-row">
          <div class="current-icon">${details.icon}</div>
          <div class="current-temp">${current.temperature_2m}°C</div>
        </div>

        <div class="smart-tip">
          <span>✨</span>
          <span>${advice}</span>
        </div>
      </div>

      <div class="current-right">
        <div class="info-tile">
          <span>Humidity</span>
          <strong>${current.relative_humidity_2m}%</strong>
        </div>
        <div class="info-tile">
          <span>Wind Speed</span>
          <strong>${current.wind_speed_10m} km/h</strong>
        </div>
        <div class="info-tile">
          <span>Today Max</span>
          <strong>${daily.temperature_2m_max[0]}°C</strong>
        </div>
        <div class="info-tile">
          <span>Today Min</span>
          <strong>${daily.temperature_2m_min[0]}°C</strong>
        </div>
      </div>
    </div>
  `;
}

function buildForecastArray(daily) {
  return daily.time
    .map((date, index) => ({
      date,
      maxTemp: daily.temperature_2m_max[index],
      minTemp: daily.temperature_2m_min[index],
      weatherCode: daily.weather_code[index]
    }))
    .filter((day) => day.maxTemp !== null && day.minTemp !== null);
}

function renderForecast(data) {
  const cards = data.map((day) => {
    const details = getWeatherDetails(day.weatherCode);

    return `
      <article class="forecast-card">
        <p class="forecast-day">${formatDate(day.date)}</p>
        <div class="forecast-icon">${details.icon}</div>
        <p class="forecast-condition">${details.label}</p>
        <p class="forecast-temp">${day.maxTemp}°C</p>
        <p class="forecast-minmax">Min ${day.minTemp}°C • Max ${day.maxTemp}°C</p>
        <p class="advice">${getAdvice(day.maxTemp, day.minTemp, day.weatherCode)}</p>
      </article>
    `;
  });

  forecastContainer.innerHTML = cards.join("");
}

function sortForecast(type) {
  const sortedForecast = [...forecastData];

  if (type === "asc") {
    sortedForecast.sort((a, b) => a.maxTemp - b.maxTemp);
  } else if (type === "desc") {
    sortedForecast.sort((a, b) => b.maxTemp - a.maxTemp);
  }

  renderForecast(sortedForecast);
}

async function fetchWeather(city) {
  try {
    setStatus("Loading live weather data...");
    currentWeather.innerHTML = "";
    forecastContainer.innerHTML = "";

    const location = await getCoordinates(city);
    const weatherData = await getWeather(location.latitude, location.longitude);

    renderCurrentWeather(location.name, location.country, weatherData);

    forecastData = buildForecastArray(weatherData.daily);
    renderForecast(forecastData);

    updatePreview(location.name, location.country, weatherData.current);
    setStatus(`Showing weather for ${location.name}`);
  } catch (error) {
    setStatus(error.message, true);
    currentWeather.innerHTML = "";
    forecastContainer.innerHTML = "";
  }
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter a city name.", true);
    return;
  }
  fetchWeather(city);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

sortSelect.addEventListener("change", () => {
  sortForecast(sortSelect.value);
});

themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("weatherTheme", isLight ? "light" : "dark");
  document.querySelector(".theme-icon").textContent = isLight ? "☀️" : "🌙";
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("weatherTheme");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    document.querySelector(".theme-icon").textContent = "☀️";
  } else {
    document.querySelector(".theme-icon").textContent = "🌙";
  }

  fetchWeather("Pune");
});