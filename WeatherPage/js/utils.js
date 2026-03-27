export function formatTime(unixTs, timezoneOffsetSeconds) {
  const utcMs = (unixTs + timezoneOffsetSeconds) * 1000;
  const d = new Date(utcMs);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export function formatDate(unixTs, timezoneOffsetSeconds = 0) {
  const d = new Date((unixTs + timezoneOffsetSeconds) * 1000);
  return d.toUTCString().slice(0, 11);
}

export function getDayName(unixTs, timezoneOffsetSeconds = 0, short = true) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date((unixTs + timezoneOffsetSeconds) * 1000);
  const name = days[d.getUTCDay()];
  return short ? name.slice(0, 3) : name;
}

export function getLocalDateStr(unixTs, timezoneOffsetSeconds = 0) {
  const d = new Date((unixTs + timezoneOffsetSeconds) * 1000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function getWindDirection(degrees) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export function isNighttime(dt, sunrise, sunset, timezone) {
  const local = dt + timezone;
  const sr = sunrise + timezone;
  const ss = sunset + timezone;
  return local < sr || local > ss;
}

// Returns { x, y } of sun dot on the arc (SVG coords for viewBox 0 0 200 110)
export function getSunPosition(dt, sunrise, sunset, timezone) {
  const localNow = dt + timezone;
  const localSr = sunrise + timezone;
  const localSs = sunset + timezone;
  let t = (localNow - localSr) / (localSs - localSr);
  t = Math.max(0, Math.min(1, t));
  const theta = Math.PI - t * Math.PI;
  const cx = 100, cy = 100, r = 90;
  return {
    x: cx + r * Math.cos(theta),
    y: cy - r * Math.sin(theta),
    t
  };
}

export function getAQIInfo(aqi) {
  const map = {
    1: { label: 'Good',      color: '#66bb6a', bg: 'rgba(102,187,106,0.2)' },
    2: { label: 'Fair',      color: '#ffee58', bg: 'rgba(255,238,88,0.2)' },
    3: { label: 'Moderate',  color: '#ffa726', bg: 'rgba(255,167,38,0.2)' },
    4: { label: 'Poor',      color: '#ef5350', bg: 'rgba(239,83,80,0.2)' },
    5: { label: 'Very Poor', color: '#8e24aa', bg: 'rgba(142,36,170,0.2)' },
  };
  return map[aqi] || { label: 'Unknown', color: '#aaa', bg: 'rgba(170,170,170,0.2)' };
}

export function getClothingSuggestions(feelsLike, weatherId, windSpeed, units) {
  // Normalize feels-like to Celsius
  const tempC = units === 'imperial' ? (feelsLike - 32) * 5 / 9 : feelsLike;
  // Normalize wind to m/s
  const windMs = units === 'imperial' ? windSpeed * 0.44704 : windSpeed;

  const items = [];

  if (tempC > 30) {
    items.push({ icon: '🩳', label: 'Shorts' });
    items.push({ icon: '😎', label: 'Sunglasses' });
    items.push({ icon: '🧴', label: 'Sunscreen' });
    items.push({ icon: '🧢', label: 'Hat' });
  } else if (tempC > 21) {
    items.push({ icon: '👕', label: 'Light clothing' });
    items.push({ icon: '😎', label: 'Sunglasses' });
  } else if (tempC > 13) {
    items.push({ icon: '🧥', label: 'Light jacket' });
  } else if (tempC > 4) {
    items.push({ icon: '🧥', label: 'Warm jacket' });
    items.push({ icon: '👔', label: 'Layers' });
  } else {
    items.push({ icon: '🧥', label: 'Heavy coat' });
    items.push({ icon: '🧣', label: 'Scarf' });
    items.push({ icon: '🧤', label: 'Gloves' });
    items.push({ icon: '🎩', label: 'Hat' });
  }

  const isRain = (weatherId >= 200 && weatherId < 400) || (weatherId >= 500 && weatherId < 600);
  const isSnow = weatherId >= 600 && weatherId < 700;

  if (isRain) {
    items.push({ icon: '☂️', label: 'Umbrella' });
    items.push({ icon: '🧥', label: 'Waterproof jacket' });
  }
  if (isSnow) {
    items.push({ icon: '👢', label: 'Boots' });
    items.push({ icon: '🧤', label: 'Heavy layers' });
  }
  if (windMs > 9) {
    items.push({ icon: '🌬️', label: 'Windbreaker' });
  }

  // Summary
  let summary = '';
  if (isRain && isSnow) summary = 'Bundle up and stay dry ❄️☂️';
  else if (isRain) summary = 'Umbrella weather ☂️';
  else if (isSnow) summary = 'Snow gear required ❄️';
  else if (tempC > 30) summary = 'Hot day — stay cool & protected ☀️';
  else if (tempC > 21) summary = 'Nice out — light clothing works 🌤️';
  else if (tempC > 13) summary = 'Light jacket weather 🍃';
  else if (tempC > 4) summary = 'Layer up, it\'s cool 🌥️';
  else summary = 'Bundle up, it\'s freezing! 🥶';

  return { items, summary };
}

export function groupForecastByDay(list, timezone) {
  const days = {};
  const dayOrder = [];
  for (const item of list) {
    const dateKey = getLocalDateStr(item.dt, timezone);
    if (!days[dateKey]) {
      days[dateKey] = [];
      dayOrder.push(dateKey);
    }
    days[dateKey].push(item);
  }
  return dayOrder.slice(0, 5).map(key => ({
    dateKey: key,
    items: days[key],
    high: Math.max(...days[key].map(i => i.main.temp_max)),
    low: Math.min(...days[key].map(i => i.main.temp_min)),
    // Pick noon entry or first
    representative: days[key].find(i => {
      const h = new Date((i.dt + timezone) * 1000).getUTCHours();
      return h >= 11 && h <= 13;
    }) || days[key][0]
  }));
}

export function animateNumber(el, from, to, duration = 600) {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
