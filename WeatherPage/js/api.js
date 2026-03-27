const API_KEY = 'e8c7cee3a1dc772dd77955d32c61bd31';
const BASE = 'https://api.openweathermap.org';

async function apiFetch(url) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error('API key not yet active. Please wait up to 2 hours.');
  if (res.status === 404) throw new Error('City not found. Please check the spelling and try again.');
  if (res.status === 429) throw new Error('Too many requests. Please wait a moment.');
  if (!res.ok) throw new Error('Unable to fetch weather data. Please try again.');
  return res.json();
}

export async function fetchCurrentWeather(city, units = 'metric') {
  return apiFetch(`${BASE}/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${units}`);
}

export async function fetchForecast(city, units = 'metric') {
  return apiFetch(`${BASE}/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${units}`);
}

export async function fetchAQI(lat, lon) {
  return apiFetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
}

export async function reverseGeocode(lat, lon) {
  const data = await apiFetch(`${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
  if (!data || data.length === 0) throw new Error('Location not found.');
  return data[0];
}
