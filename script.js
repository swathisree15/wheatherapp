const apiKey = '80ff6c47179657ec218c73ed4c5c02bd'; // Replace with your OpenWeatherMap API key
const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker;

// Get user's current location
navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
    const { latitude, longitude } = position.coords;
    map.setView([latitude, longitude], 13);
    marker = L.marker([latitude, longitude]).addTo(map);
    getWeatherData(latitude, longitude);
}

function error() {
    alert('Unable to retrieve your location');
}

// Search for a location
document.getElementById('search-btn').addEventListener('click', () => {
    const location = document.getElementById('search-input').value;
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            const { lat, lon } = data.coord;
            map.setView([lat, lon], 13);
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([lat, lon]).addTo(map);
            getWeatherData(lat, lon);
        })
        .catch(() => alert('Location not found'));
});

// Fetch weather data
function getWeatherData(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            displayCurrentWeather(data.current);
            displayForecast(data.daily);
        });
}

// Display current weather
function displayCurrentWeather(current) {
    const currentWeather = document.getElementById('current-weather');
    currentWeather.innerHTML = `
        <h2>Current Weather</h2>
        <p>🌡️ Temperature: ${current.temp}°C</p>
        <p>☁️ Weather: ${current.weather[0].description}</p>
        <p>💧 Humidity: ${current.humidity}%</p>
        <p>🌬️ Wind Speed: ${current.wind_speed} m/s</p>
    `;
}

// Display 5-day forecast
function displayForecast(daily) {
    const forecast = document.getElementById('forecast');
    forecast.innerHTML = '<h2>5-Day Forecast</h2>';
    daily.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString();
        forecast.innerHTML += `
            <div class="forecast-item">
                <p>📅 ${date}</p>
                <p>🌡️ Temp: ${day.temp.day}°C</p>
                <p>☁️ ${day.weather[0].description}</p>
            </div>
        `;
    });
}