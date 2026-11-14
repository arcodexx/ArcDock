import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface HourlyPoint {
  time: string;
  temp: number;
  code: number;
}

export interface DailyPoint {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
}

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  lastUpdated: number;
}

const STORAGE_KEY_CACHE = 'arcdock_weather_cache';
const STORAGE_KEY_CONFIG = 'arcdock_weather_config';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// WMO Weather Interpretation Codes (WW)
export function getWeatherDescription(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: 'Sun' };
  if (code === 1) return { text: 'Mainly Clear', icon: 'SunMedium' };
  if (code === 2) return { text: 'Partly Cloudy', icon: 'CloudSun' };
  if (code === 3) return { text: 'Overcast', icon: 'Cloud' };
  if (code === 45 || code === 48) return { text: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { text: 'Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: 'CloudSnow' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: 'CloudRain' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: 'CloudLightning' };
  return { text: 'Partly Cloudy', icon: 'CloudSun' };
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}

async function resolveCityCoordinates(cityName: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const q = cityName.trim();
  if (q.length < 2) return null;

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          lat: Number(item.latitude.toFixed(4)),
          lon: Number(item.longitude.toFixed(4)),
          name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}`,
        };
      }
    }
  } catch (e) {
    console.warn('[Weather] Geocoding lookup failed:', e);
  }

  return null;
}

const loadWeatherConfig = (): { city: string; lat: number; lon: number; useGeo: boolean } => {
  const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
  try {
    return raw ? JSON.parse(raw) : { city: 'Jodhpur', lat: 26.2868, lon: 73.0300, useGeo: false };
  } catch {
    return { city: 'Jodhpur', lat: 26.2868, lon: 73.0300, useGeo: false };
  }
};

const loadWeatherCache = (): WeatherData | null => {
  const raw = localStorage.getItem(STORAGE_KEY_CACHE);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useWeatherStore = defineStore('weather', () => {
  // Default fallback: New Delhi
  const config = ref(loadWeatherConfig());

  const weather = ref<WeatherData | null>(loadWeatherCache());

  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  let pollInterval: number | null = null;

  const currentCondition = computed(() => {
    if (!weather.value) return { text: 'Loading...', icon: 'CloudSun' };
    return getWeatherDescription(weather.value.weatherCode);
  });

  const saveConfig = async (newConfig: Partial<typeof config.value>) => {
    config.value = { ...config.value, ...newConfig };

    // If city name is provided, resolve coordinates and default useGeo to false
    if (newConfig.city) {
      config.value.useGeo = false;
      const resolved = await resolveCityCoordinates(newConfig.city);
      if (resolved) {
        config.value.lat = resolved.lat;
        config.value.lon = resolved.lon;
        config.value.city = resolved.name;
      }
    }

    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config.value));
    fetchWeather(true);
  };

  const fetchWeather = async (force: boolean = false) => {
    if (!force && weather.value && Date.now() - weather.value.lastUpdated < CACHE_TTL_MS) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    let latitude = config.value.lat;
    let longitude = config.value.lon;
    let cityName = config.value.city;

    // If using GPS geolocation, attempt HTML5 Geolocation
    if (config.value.useGeo && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = Number(pos.coords.latitude.toFixed(4));
        longitude = Number(pos.coords.longitude.toFixed(4));
        cityName = 'Current Location';
      } catch (e) {
        // Fall back gracefully to configured city coords
      }
    } else if (!latitude || !longitude) {
      // If coordinates are missing, resolve from city name
      const resolved = await resolveCityCoordinates(config.value.city);
      if (resolved) {
        latitude = resolved.lat;
        longitude = resolved.lon;
        cityName = resolved.name;
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);

      const data = await res.json();
      
      const hourly: HourlyPoint[] = [];
      const hTimes: string[] = data.hourly?.time || [];
      const hTemps: number[] = data.hourly?.temperature_2m || [];
      const hCodes: number[] = data.hourly?.weather_code || [];

      // Extract next 24 hours starting from current hour
      const nowIso = new Date().toISOString().slice(0, 13);
      let startIndex = hTimes.findIndex((t: string) => t.startsWith(nowIso));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 24, hTimes.length); i++) {
        hourly.push({
          time: hTimes[i],
          temp: Math.round(hTemps[i]),
          code: hCodes[i],
        });
      }

      const daily: DailyPoint[] = [];
      const dTimes: string[] = data.daily?.time || [];
      const dMax: number[] = data.daily?.temperature_2m_max || [];
      const dMin: number[] = data.daily?.temperature_2m_min || [];
      const dCodes: number[] = data.daily?.weather_code || [];

      for (let i = 0; i < dTimes.length; i++) {
        daily.push({
          date: dTimes[i],
          maxTemp: Math.round(dMax[i]),
          minTemp: Math.round(dMin[i]),
          code: dCodes[i],
        });
      }

      weather.value = {
        city: cityName,
        latitude,
        longitude,
        currentTemp: Math.round(data.current?.temperature_2m ?? 25),
        feelsLike: Math.round(data.current?.apparent_temperature ?? 26),
        humidity: data.current?.relative_humidity_2m ?? 50,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        weatherCode: data.current?.weather_code ?? 0,
        hourly,
        daily,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(weather.value));
    } catch (err: any) {
      console.warn('[Weather] API fetch failed:', err);
      error.value = 'Could not update weather.';
    } finally {
      isLoading.value = false;
    }
  };

  const startPolling = () => {
    fetchWeather();
    if (!pollInterval) {
      pollInterval = window.setInterval(() => fetchWeather(), CACHE_TTL_MS);
    }
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  const searchCities = async (query: string): Promise<GeocodingResult[]> => {
    const q = query.trim();
    if (q.length < 2) return [];
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          latitude: Number(item.latitude.toFixed(4)),
          longitude: Number(item.longitude.toFixed(4)),
          country: item.country || '',
          admin1: item.admin1 || '',
          timezone: item.timezone || 'auto',
        }));
      }
    } catch (e) {
      console.warn('[Weather] City search failed:', e);
    }
    return [];
  };

  const selectCity = (city: GeocodingResult) => {
    const displayName = city.admin1 ? `${city.name}, ${city.admin1}` : city.name;
    config.value = {
      city: displayName,
      lat: city.latitude,
      lon: city.longitude,
      useGeo: false,
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config.value));
    fetchWeather(true);
  };

  return {
    config,
    weather,
    isLoading,
    error,
    currentCondition,
    saveConfig,
    searchCities,
    selectCity,
    fetchWeather,
    startPolling,
    stopPolling,
  };
});
