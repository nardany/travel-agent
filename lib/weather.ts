import { fetchJson } from "./fetchJson";

interface GeocodingResponse {
  results?: { name: string; latitude: number; longitude: number }[];
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

const WEATHER_CODES: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "rain showers", 82: "heavy rain showers",
  95: "thunderstorm",
};

export async function getWeatherForecast(city: string, date: string) {
  const geo = await fetchJson<GeocodingResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&countryCode=AM`
  );
  if (geo.error) {
    return { error: "Weather service is unavailable" };
  }
  const place = geo.data.results?.[0];
  if (!place) {
    return { error: `City "${city}" was not found in Armenia` };
  }

  const forecast = await fetchJson<ForecastResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia/Yerevan&forecast_days=7`
  );
  if (forecast.error) {
    return { error: "Weather service is unavailable" };
  }

  const daily = forecast.data.daily;
  const index = daily.time.indexOf(date);
  if (index === -1) {
    return { error: "Forecast is available only for the next 7 days" };
  }

  return {
    city: place.name,
    date,
    maxTemperature: daily.temperature_2m_max[index],
    minTemperature: daily.temperature_2m_min[index],
    precipitationProbability: daily.precipitation_probability_max[index],
    condition: WEATHER_CODES[daily.weather_code[index]] ?? "unknown",
  };
}