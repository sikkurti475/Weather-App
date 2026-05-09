import { render, screen } from '@testing-library/react';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { CurrentWeather } from '../utils/types';

const mockData: CurrentWeather = {
  location: 'Austin',
  country: 'US',
  temperature: 95,
  feelsLike: 102,
  tempMin: 88,
  tempMax: 98,
  humidity: 65,
  pressure: 1010,
  windSpeed: 12,
  windDirection: 'S',
  visibility: 10,
  condition: 'Clear',
  conditionDescription: 'clear sky',
  icon: '01d',
  sunrise: '2024-01-01 06:45 UTC',
  sunset: '2024-01-01 18:30 UTC',
  observedAt: '2024-01-01 14:00 UTC',
  heatIndex: 110,
};

describe('CurrentWeatherCard', () => {
  it('renders location and country', () => {
    render(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('Austin, US')).toBeInTheDocument();
  });

  it('renders temperature', () => {
    render(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('95°F')).toBeInTheDocument();
  });

  it('renders heat index when present', () => {
    render(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('Heat Index')).toBeInTheDocument();
    expect(screen.getByText('110°F')).toBeInTheDocument();
  });

  it('does not render heat index when null', () => {
    render(<CurrentWeatherCard data={{ ...mockData, heatIndex: null }} />);
    expect(screen.queryByText('Heat Index')).not.toBeInTheDocument();
  });

  it('renders wind with direction', () => {
    render(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('12 mph S')).toBeInTheDocument();
  });
});
