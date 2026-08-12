// Weather for CrossPoint. Looks up a city with Open-Meteo's free geocoding
// API, saves its coordinates to /.crosspoint/weather.json, and shows current
// conditions from Open-Meteo's forecast API — no API key needed, so nothing
// secret ever has to live in this plugin folder. https://open-meteo.com
CrossPoint.registerPlugin(async (container, api) => {
  const CONFIG_PATH = '/.crosspoint/weather.json';

  const WMO = {
    0: ['☀️', 'Clear sky'],
    1: ['🌤️', 'Mainly clear'],
    2: ['⛅', 'Partly cloudy'],
    3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'],
    48: ['🌫️', 'Depositing rime fog'],
    51: ['🌦️', 'Light drizzle'],
    53: ['🌦️', 'Moderate drizzle'],
    55: ['🌧️', 'Dense drizzle'],
    56: ['🌧️', 'Light freezing drizzle'],
    57: ['🌧️', 'Dense freezing drizzle'],
    61: ['🌦️', 'Slight rain'],
    63: ['🌧️', 'Moderate rain'],
    65: ['🌧️', 'Heavy rain'],
    66: ['🌧️', 'Light freezing rain'],
    67: ['🌧️', 'Heavy freezing rain'],
    71: ['🌨️', 'Slight snow fall'],
    73: ['🌨️', 'Moderate snow fall'],
    75: ['❄️', 'Heavy snow fall'],
    77: ['❄️', 'Snow grains'],
    80: ['🌦️', 'Slight rain showers'],
    81: ['🌧️', 'Moderate rain showers'],
    82: ['⛈️', 'Violent rain showers'],
    85: ['🌨️', 'Slight snow showers'],
    86: ['❄️', 'Heavy snow showers'],
    95: ['⛈️', 'Thunderstorm'],
    96: ['⛈️', 'Thunderstorm with slight hail'],
    99: ['⛈️', 'Thunderstorm with heavy hail'],
  };
  function wmoDescription(code) {
    return WMO[code] || ['🌡️', 'Unknown'];
  }

  container.innerHTML =
    '<h2>Weather</h2>' +
    '<p id="wx-status">Checking configuration…</p>' +
    '<div class="setting-row"><span class="setting-name">City</span>' +
    '<span class="setting-control"><input type="text" id="wx-city" placeholder="Berlin"></span></div>' +
    '<div class="setting-row"><span class="setting-name">Units</span>' +
    '<span class="setting-control"><select id="wx-unit">' +
    '<option value="celsius">Celsius, km/h</option>' +
    '<option value="fahrenheit">Fahrenheit, mph</option>' +
    '</select></span></div>' +
    '<div class="setting-row">' +
    '<button type="button" class="btn-small btn-add" id="wx-search">Search &amp; Save</button> ' +
    '<button type="button" class="btn-small" id="wx-refresh" style="display:none">Refresh</button> ' +
    '<button type="button" class="btn-small" id="wx-clear" style="display:none">Clear</button>' +
    '</div>' +
    '<div id="wx-result"></div>' +
    '<p style="color:#666">Weather data from <a href="https://open-meteo.com" target="_blank">Open-Meteo</a>, no account needed.</p>';

  const el = (id) => document.getElementById(id);
  const status = (t) => { el('wx-status').textContent = t; };
  const refreshBtn = el('wx-refresh');
  const clearBtn = el('wx-clear');

  function writeConfig(cfg) {
    return api.writeFile(CONFIG_PATH, btoa(JSON.stringify(cfg)));
  }

  async function loadConfig() {
    try {
      const r = await fetch('/download?path=' + encodeURIComponent(CONFIG_PATH));
      if (!r.ok) return null;
      return JSON.parse(await r.text());
    } catch (e) {
      return null;
    }
  }

  async function geocode(city) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(city) + '&count=1&format=json';
    const r = await api.relay('GET', url, {}, '');
    let parsed = null;
    try { parsed = JSON.parse(r.body); } catch (e) {}
    if (!parsed || !parsed.results || !parsed.results.length) {
      throw new Error('no location found for "' + city + '"');
    }
    const hit = parsed.results[0];
    return {
      name: hit.name,
      admin1: hit.admin1 || '',
      country: hit.country || '',
      lat: hit.latitude,
      lon: hit.longitude,
    };
  }

  async function fetchWeather(cfg) {
    const unit = cfg.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnit = unit === 'fahrenheit' ? 'mph' : 'kmh';
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + cfg.lat +
      '&longitude=' + cfg.lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&timezone=auto&temperature_unit=' + unit + '&wind_speed_unit=' + windUnit;
    const r = await api.relay('GET', url, {}, '');
    let parsed = null;
    try { parsed = JSON.parse(r.body); } catch (e) {}
    if (!parsed || !parsed.current) {
      throw new Error('unexpected forecast response (HTTP ' + (r.status || r.error) + ')');
    }
    return parsed;
  }

  function renderWeather(forecast, cfg) {
    const c = forecast.current;
    const units = forecast.current_units || {};
    const description = wmoDescription(c.weather_code);
    const emoji = description[0];
    const text = description[1];
    const place = [cfg.name, cfg.admin1, cfg.country].filter(Boolean).join(', ');
    el('wx-result').innerHTML =
      '<div class="setting-row"><span class="setting-name">' + emoji + ' ' + text + '</span>' +
      '<span class="setting-control">' + place + '</span></div>' +
      '<div class="setting-row"><span class="setting-name">Temperature</span>' +
      '<span class="setting-control">' + c.temperature_2m + (units.temperature_2m || '') +
      ' (feels like ' + c.apparent_temperature + (units.apparent_temperature || '') + ')</span></div>' +
      '<div class="setting-row"><span class="setting-name">Humidity</span>' +
      '<span class="setting-control">' + c.relative_humidity_2m + (units.relative_humidity_2m || '') + '</span></div>' +
      '<div class="setting-row"><span class="setting-name">Wind</span>' +
      '<span class="setting-control">' + c.wind_speed_10m + ' ' + (units.wind_speed_10m || '') + '</span></div>' +
      '<p style="color:#666">Updated ' + c.time + '</p>';
  }

  async function refresh(cfg) {
    status('Loading weather…');
    try {
      const forecast = await fetchWeather(cfg);
      renderWeather(forecast, cfg);
      status('Configured. Showing ' + [cfg.name, cfg.country].filter(Boolean).join(', ') + '.');
    } catch (e) {
      status('Error: ' + e.message);
    }
  }

  el('wx-search').onclick = async () => {
    const city = el('wx-city').value.trim();
    if (!city) { status('Error: city is required'); return; }
    status('Looking up "' + city + '"…');
    try {
      const hit = await geocode(city);
      const cfg = {
        name: hit.name,
        admin1: hit.admin1,
        country: hit.country,
        lat: hit.lat,
        lon: hit.lon,
        unit: el('wx-unit').value,
      };
      await writeConfig(cfg);
      el('wx-city').value = cfg.name;
      refreshBtn.style.display = '';
      clearBtn.style.display = '';
      await refresh(cfg);
    } catch (e) {
      status('Error: ' + e.message);
    }
  };

  refreshBtn.onclick = async () => {
    const cfg = await loadConfig();
    if (!cfg || cfg.lat === undefined) { status('Not configured yet.'); return; }
    await refresh(cfg);
  };

  el('wx-unit').onchange = async () => {
    const cfg = await loadConfig();
    if (!cfg || cfg.lat === undefined) return;
    cfg.unit = el('wx-unit').value;
    await writeConfig(cfg);
    await refresh(cfg);
  };

  clearBtn.onclick = async () => {
    try {
      await writeConfig({});
      el('wx-city').value = '';
      el('wx-result').innerHTML = '';
      refreshBtn.style.display = 'none';
      clearBtn.style.display = 'none';
      status('Configuration cleared.');
    } catch (e) {
      status('Error: ' + e.message);
    }
  };

  const existing = await loadConfig();
  if (existing && existing.lat !== undefined) {
    el('wx-city').value = existing.name || '';
    el('wx-unit').value = existing.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    refreshBtn.style.display = '';
    clearBtn.style.display = '';
    await refresh(existing);
  } else {
    status('Not configured yet.');
  }
});
