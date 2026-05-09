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

export interface WeatherState {
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  loading: boolean;
  error: string | null;
}
