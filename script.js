document.addEventListener('DOMContentLoaded', () => {
  const searchBox = document.querySelector('.search-box');
  const locationBtn = document.getElementById('location-btn');
  const unitToggle = document.getElementById('unit-toggle');
  const cityElement = document.querySelector('.location .city');
  const dateElement = document.querySelector('.location .date');
  const tempElement = document.querySelector('.current .temp');
  const weatherElement = document.querySelector('.current .weather');
  const hiLowElement = document.querySelector('.current .hi-low');
  const humidityElement = document.getElementById('humidity');
  const windElement = document.getElementById('wind');
  const pressureElement = document.getElementById('pressure');
  const feelsLikeElement = document.getElementById('feels-like');
  const forecastList = document.querySelector('.forecast-list');
  const mapElement = document.getElementById('map');

  let map;
  let mapInitialized = false;
  let isCelsius = true;

  const apiKey = 'b2737f44693bececbf3327d42ad0eecf'; // Your OpenWeatherMap API key
  const baseUrl = 'https://api.openweathermap.org/data/2.5';

  // Initialize the map
  function initMap(lat, lon) {
      if (!mapInitialized) {
          map = L.map(mapElement).setView([lat, lon], 10);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          mapInitialized = true;
      } else {
          map.setView([lat, lon], 10);
      }

      // Add click event to the map
      map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          try {
              const weatherData = await fetchWeatherByCoords(lat, lng, isCelsius ? 'metric' : 'imperial');
              const forecastData = await fetchForecastByCoords(lat, lng, isCelsius ? 'metric' : 'imperial');
              updateWeatherUI(weatherData);
              updateForecastUI(forecastData);
          } catch (error) {
              alert('Failed to fetch weather data for the selected location.');
          }
      });
  }

  // Fetch weather data by city name
  async function fetchWeatherData(city, units = 'metric') {
      const url = `${baseUrl}/weather?q=${city}&units=${units}&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('City not found');
      return response.json();
  }

  // Fetch weather data by coordinates
  async function fetchWeatherByCoords(lat, lon, units = 'metric') {
      const url = `${baseUrl}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
  }

  // Fetch 5-day forecast data by coordinates
  async function fetchForecastByCoords(lat, lon, units = 'metric') {
      const url = `${baseUrl}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch forecast data');
      return response.json();
  }

  // Update the DOM with weather data
  function updateWeatherUI(data) {
      const { name, sys, main, weather, wind, dt } = data;
      const date = new Date(dt * 1000).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });

      cityElement.textContent = `${name}, ${sys.country}`;
      dateElement.textContent = date;
      tempElement.innerHTML = `${Math.round(main.temp)}<span>°${isCelsius ? 'C' : 'F'}</span>`;
      weatherElement.textContent = weather[0].description;
      hiLowElement.textContent = `${Math.round(main.temp_min)}°${isCelsius ? 'C' : 'F'} / ${Math.round(main.temp_max)}°${isCelsius ? 'C' : 'F'}`;
      humidityElement.textContent = `${main.humidity}%`;
      windElement.textContent = `${wind.speed} m/s`;
      pressureElement.textContent = `${main.pressure} hPa`;
      feelsLikeElement.textContent = `${Math.round(main.feels_like)}°${isCelsius ? 'C' : 'F'}`;

      // Update map view
      initMap(data.coord.lat, data.coord.lon);
  }

  // Update the DOM with forecast data
  function updateForecastUI(forecastData) {
      forecastList.innerHTML = '';
      const dailyForecasts = forecastData.list.filter((item, index) => index % 8 === 0); // Get one forecast per day

      dailyForecasts.forEach(item => {
          const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
          const temp = Math.round(item.main.temp);
          const icon = item.weather[0].icon;

          const forecastItem = document.createElement('div');
          forecastItem.className = 'forecast-item';
          forecastItem.innerHTML = `
              <div>${date}</div>
              <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${item.weather[0].description}">
              <div>${temp}°${isCelsius ? 'C' : 'F'}</div>
          `;
          forecastList.appendChild(forecastItem);
      });
  }

  // Handle search box input
  searchBox.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
          const city = searchBox.value.trim();
          if (city) {
              try {
                  const weatherData = await fetchWeatherData(city, isCelsius ? 'metric' : 'imperial');
                  const forecastData = await fetchForecastByCoords(weatherData.coord.lat, weatherData.coord.lon, isCelsius ? 'metric' : 'imperial');
                  updateWeatherUI(weatherData);
                  updateForecastUI(forecastData);
              } catch (error) {
                  alert('City not found. Please try again.');
              }
          }
      }
  });

  // Handle location button click
  locationBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                  const weatherData = await fetchWeatherByCoords(latitude, longitude, isCelsius ? 'metric' : 'imperial');
                  const forecastData = await fetchForecastByCoords(latitude, longitude, isCelsius ? 'metric' : 'imperial');
                  updateWeatherUI(weatherData);
                  updateForecastUI(forecastData);
              } catch (error) {
                  alert('Failed to fetch weather data for your location.');
              }
          });
      } else {
          alert('Geolocation is not supported by your browser.');
      }
  });

  // Handle unit toggle button click
  unitToggle.addEventListener('click', () => {
      isCelsius = !isCelsius;
      unitToggle.textContent = isCelsius ? '°C/°F' : '°F/°C';
      const city = cityElement.textContent.split(',')[0];
      if (city) {
          searchBox.value = city;
          searchBox.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
      }
  });

  // Default city on load
  searchBox.value = 'London';
  searchBox.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
});