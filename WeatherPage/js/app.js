import { fetchCurrentWeather, fetchForecast, fetchAQI, reverseGeocode } from './api.js';
import {
  formatTime, getDayName, getLocalDateStr, getWindDirection,
  isNighttime, getSunPosition, getAQIInfo, getClothingSuggestions,
  groupForecastByDay, animateNumber
} from './utils.js';
import { WeatherEffects } from './weather-effects.js';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  units: 'metric',
  recentSearches: [],
  primaryData: null,
  compareData: null,
  compareVisible: false,
  effects: null,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const canvas = $('weather-canvas');
  state.effects = new WeatherEffects(canvas);

  $('search-btn').addEventListener('click', () => doSearch());
  $('city-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  $('locate-btn').addEventListener('click', geolocate);
  $('compare-btn').addEventListener('click', toggleCompare);
  $('close-compare-btn').addEventListener('click', closeCompare);
  $('compare-search-btn').addEventListener('click', () => doCompareSearch());
  $('compare-input').addEventListener('keydown', e => { if (e.key === 'Enter') doCompareSearch(); });

  document.querySelectorAll('input[name="units"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.units = e.target.value;
      if (state.primaryData) searchCity(state.primaryData.name, 'p');
      if (state.compareData && state.compareVisible) searchCity(state.compareData.name, 'c');
    });
  });

  // AQI expand on click
  $('p-aqi-card').addEventListener('click', () => toggleAQI('p'));
  $('c-aqi-card').addEventListener('click', () => toggleAQI('c'));

  geolocate();
}

// ─── Search ───────────────────────────────────────────────────────────────────
function doSearch() {
  const city = $('city-input').value.trim();
  if (!city) return;
  searchCity(city, 'p');
}

function doCompareSearch() {
  const city = $('compare-input').value.trim();
  if (!city) return;
  searchCity(city, 'c');
}

async function searchCity(city, panel) {
  showError(null);
  setLoading(true);

  try {
    const [weather, forecast] = await Promise.all([
      fetchCurrentWeather(city, state.units),
      fetchForecast(city, state.units),
    ]);
    const aqi = await fetchAQI(weather.coord.lat, weather.coord.lon);

    if (panel === 'p') {
      state.primaryData = weather;
      addRecentSearch(`${weather.name}, ${weather.sys.country}`);
      const night = isNighttime(weather.dt, weather.sys.sunrise, weather.sys.sunset, weather.timezone);
      state.effects.setCondition(weather.weather[0].id, night);
      showWeatherDisplay();
    } else {
      state.compareData = weather;
      $('compare-weather-content').classList.remove('hidden');
      $('compare-empty-state').classList.add('hidden');
    }

    renderWeather(weather, forecast, aqi, panel);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderWeather(weather, forecast, aqi, prefix) {
  const w = weather;
  const tz = w.timezone;
  const night = isNighttime(w.dt, w.sys.sunrise, w.sys.sunset, tz);

  // City + description
  $(`${prefix}-city-name`).textContent = `${w.name}, ${w.sys.country}`;
  $(`${prefix}-weather-desc`).textContent = capitalize(w.weather[0].description);

  // Icon
  const iconEl = $(`${prefix}-weather-icon`);
  iconEl.src = `https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;
  iconEl.alt = w.weather[0].description;
  iconEl.style.display = 'block';

  // Temperature (animated)
  const tempEl = $(`${prefix}-temperature`);
  const prevTemp = parseInt(tempEl.textContent) || 0;
  animateNumber(tempEl, prevTemp, Math.round(w.main.temp));
  $(`${prefix}-temp-unit`).textContent = state.units === 'metric' ? '°C' : '°F';

  // Feels like
  const feelsUnit = state.units === 'metric' ? '°C' : '°F';
  $(`${prefix}-feels-like`).textContent = `${Math.round(w.main.feels_like)}${feelsUnit}`;

  // Humidity
  $(`${prefix}-humidity`).textContent = w.main.humidity;
  $(`${prefix}-humidity-bar`).style.width = `${w.main.humidity}%`;

  // Wind compass
  const windUnit = state.units === 'metric' ? 'm/s' : 'mph';
  $(`${prefix}-wind-speed`).textContent = `${w.wind.speed.toFixed(1)} ${windUnit} ${getWindDirection(w.wind.deg)}`;
  animateCompass(`${prefix}-compass-needle`, w.wind.deg);

  // Sun arc
  renderSunArc(prefix, w.dt, w.sys.sunrise, w.sys.sunset, tz, night);

  // Last updated
  $(`${prefix}-last-updated`).textContent = `Updated ${formatTime(w.dt, tz)}`;

  // AQI
  if (aqi && aqi.list && aqi.list[0]) {
    renderAQI(prefix, aqi.list[0]);
  }

  // What to wear
  renderWhatToWear(prefix, w.main.feels_like, w.weather[0].id, w.wind.speed);

  // Forecast
  renderForecast(prefix, forecast, tz);
}

function animateCompass(needleId, degrees) {
  const needle = $(needleId);
  if (!needle) return;
  needle.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
  needle.setAttribute('transform', `rotate(${degrees}, 60, 60)`);
}

function renderSunArc(prefix, dt, sunrise, sunset, timezone, isNight) {
  const pos = getSunPosition(dt, sunrise, sunset, timezone);
  const dotEl = $(`${prefix}-sun-dot`);
  const fillEl = $(`${prefix}-sun-arc-fill`);
  const srEl = $(`${prefix}-sunrise-label`);
  const ssEl = $(`${prefix}-sunset-label`);

  dotEl.setAttribute('cx', pos.x.toFixed(1));
  dotEl.setAttribute('cy', pos.y.toFixed(1));

  if (isNight) {
    dotEl.setAttribute('fill', '#c5cae9');
    dotEl.setAttribute('r', '8');
  } else {
    dotEl.setAttribute('fill', '#ffb74d');
    dotEl.setAttribute('r', '7');
  }

  // Draw arc fill from sunrise point to sun position
  if (pos.t > 0 && pos.t < 1) {
    fillEl.setAttribute('d', `M 10 100 A 90 90 0 0 1 ${pos.x.toFixed(1)} ${pos.y.toFixed(1)}`);
  } else {
    fillEl.setAttribute('d', '');
  }

  srEl.textContent = formatTime(sunrise, timezone);
  ssEl.textContent = formatTime(sunset, timezone);
}

function renderAQI(prefix, aqiItem) {
  const aqi = aqiItem.main.aqi;
  const comp = aqiItem.components;
  const info = getAQIInfo(aqi);

  const badge = $(`${prefix}-aqi-badge`);
  badge.style.background = info.bg;
  badge.style.borderColor = info.color;

  $(`${prefix}-aqi-value`).textContent = aqi;
  $(`${prefix}-aqi-value`).style.color = info.color;
  $(`${prefix}-aqi-label`).textContent = info.label;

  // Pollutant bars (max values for reference)
  setPollutant(prefix, 'pm25', comp.pm2_5, 75);
  setPollutant(prefix, 'pm10', comp.pm10, 150);
  setPollutant(prefix, 'o3', comp.o3, 180);
  setPollutant(prefix, 'no2', comp.no2, 200);
}

function setPollutant(prefix, id, value, max) {
  const el = $(`${prefix}-${id}`);
  if (!el) return;
  const pct = Math.min(100, (value / max) * 100);
  el.style.width = `${pct}%`;
  const labelEl = $(`${prefix}-${id}-label`);
  if (labelEl) labelEl.textContent = `${id.toUpperCase().replace('PM25','PM2.5').replace('PM10','PM10').replace('O3','O₃').replace('NO2','NO₂')}: ${value.toFixed(1)} µg/m³`;
}

function toggleAQI(prefix) {
  const details = $(`${prefix}-aqi-details`);
  details.classList.toggle('hidden');
}

function renderWhatToWear(prefix, feelsLike, weatherId, windSpeed) {
  const { items, summary } = getClothingSuggestions(feelsLike, weatherId, windSpeed, state.units);
  const container = $(`${prefix}-wear-items`);
  container.innerHTML = items.map(item =>
    `<div class="wear-item" title="${item.label}"><span class="wear-icon">${item.icon}</span><span class="wear-label">${item.label}</span></div>`
  ).join('');
  $(`${prefix}-wear-summary`).textContent = summary;
}

function renderForecast(prefix, forecast, timezone) {
  const days = groupForecastByDay(forecast.list, timezone);
  const container = $(`${prefix}-forecast-days`);
  container.innerHTML = '';

  days.forEach((day, i) => {
    const rep = day.representative;
    const dayName = i === 0 ? 'Today' : getDayName(rep.dt, timezone);
    const date = new Date((rep.dt + timezone) * 1000);
    const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    const icon = rep.weather[0].icon;
    const desc = capitalize(rep.weather[0].description);
    const hi = Math.round(day.high);
    const lo = Math.round(day.low);
    const unit = state.units === 'metric' ? '°C' : '°F';

    const dayEl = document.createElement('div');
    dayEl.className = 'forecast-day glass-card';
    dayEl.innerHTML = `
      <div class="forecast-day-header" data-index="${i}">
        <div class="forecast-day-name">${dayName}</div>
        <div class="forecast-date">${dateStr}</div>
        <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" title="${desc}">
        <div class="forecast-temps">
          <span class="forecast-high">${hi}${unit}</span>
          <span class="forecast-low">${lo}${unit}</span>
        </div>
        <span class="expand-arrow">›</span>
      </div>
      <div class="forecast-hourly hidden" id="${prefix}-hourly-${i}">
        ${day.items.map(item => {
          const t = formatTime(item.dt, timezone);
          const temp = Math.round(item.main.temp);
          return `
            <div class="hourly-item">
              <span class="hourly-time">${t}</span>
              <img class="hourly-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="">
              <span class="hourly-temp">${temp}${unit}</span>
              <span class="hourly-desc">${capitalize(item.weather[0].description)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    dayEl.querySelector('.forecast-day-header').addEventListener('click', () => {
      const hourlyEl = $(`${prefix}-hourly-${i}`);
      const arrow = dayEl.querySelector('.expand-arrow');
      hourlyEl.classList.toggle('hidden');
      arrow.style.transform = hourlyEl.classList.contains('hidden') ? '' : 'rotate(90deg)';
    });

    container.appendChild(dayEl);
  });
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showWeatherDisplay() {
  $('empty-state').classList.add('hidden');
  $('weather-display').classList.remove('hidden');
}

function setLoading(show) {
  $('loading-state').classList.toggle('hidden', !show);
}

function showError(msg) {
  const toast = $('error-toast');
  if (!msg) { toast.classList.add('hidden'); return; }
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 5000);
}

function addRecentSearch(cityLabel) {
  state.recentSearches = [cityLabel, ...state.recentSearches.filter(c => c !== cityLabel)].slice(0, 5);
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = $('recent-searches');
  container.innerHTML = state.recentSearches.map(city =>
    `<button class="recent-pill" data-city="${city}">${city}</button>`
  ).join('');
  container.querySelectorAll('.recent-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      $('city-input').value = btn.dataset.city;
      searchCity(btn.dataset.city, 'p');
    });
  });
}

// ─── Compare ──────────────────────────────────────────────────────────────────
function toggleCompare() {
  state.compareVisible = !state.compareVisible;
  const compareCityEl = $('compare-city');
  const container = $('cities-container');
  if (state.compareVisible) {
    compareCityEl.classList.remove('hidden');
    container.classList.replace('single', 'dual');
    $('compare-btn').textContent = 'Single';
    $('compare-input').focus();
  } else {
    closeCompare();
  }
}

function closeCompare() {
  state.compareVisible = false;
  state.compareData = null;
  $('compare-city').classList.add('hidden');
  $('compare-weather-content').classList.add('hidden');
  $('compare-empty-state').classList.remove('hidden');
  $('cities-container').classList.replace('dual', 'single');
  $('compare-btn').textContent = 'Compare';
  $('compare-input').value = '';
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
function geolocate() {
  if (!navigator.geolocation) return;
  $('locate-btn').classList.add('locating');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { lat, lon } = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const geo = await reverseGeocode(lat, lon);
        const city = geo.name;
        $('city-input').value = city;
        await searchCity(city, 'p');
      } catch (err) {
        showError(err.message);
      } finally {
        $('locate-btn').classList.remove('locating');
      }
    },
    () => {
      $('locate-btn').classList.remove('locating');
      $('city-input').focus();
    }
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
