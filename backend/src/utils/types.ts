// Raw OpenWeatherMap shapes (only fields we use)
export interface OWMWeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface OWMCurrentResponse {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  visibility: number;
  weather: OWMWeatherCondition[];
  dt: number;
  timezone: number;
}

export interface OWMForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: OWMWeatherCondition[];
  wind: { speed: number; deg: number };
  dt_txt: string;
}

export interface OWMForecastResponse {
  city: { name: string; country: string; timezone: number };
  list: OWMForecastItem[];
}

// Formatted shapes returned by our API
export interface CurrentWeather {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  condition: string;
  conditionDescription: string;
  icon: string;
  sunrise: string;
  sunset: string;
  observedAt: string;
  heatIndex: number | null;
}

export interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  conditionDescription: string;
  icon: string;
}
