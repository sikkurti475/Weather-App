import { render, screen } from '@testing-library/react';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { UnitsProvider } from '../utils/units';
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
  sunrise: '06:45',
  sunset: '18:30',
  observedAt: '14:00',
  heatIndex: 110,
};

describe('CurrentWeatherCard', () => {
  const renderWithProvider = (component: React.ReactElement) =>
    render(<UnitsProvider>{component}</UnitsProvider>);

  it('renders location and country', () => {
    renderWithProvider(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('Austin, US')).toBeInTheDocument();
  });

  it('renders temperature', () => {
    renderWithProvider(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('95°')).toBeInTheDocument();
  });

  it('renders heat index when present', () => {
    renderWithProvider(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('Heat Index')).toBeInTheDocument();
    expect(screen.getByText('110°F')).toBeInTheDocument();
  });

  it('does not render heat index when null', () => {
    renderWithProvider(<CurrentWeatherCard data={{ ...mockData, heatIndex: null }} />);
    expect(screen.queryByText('Heat Index')).not.toBeInTheDocument();
  });

  it('renders wind with direction', () => {
    renderWithProvider(<CurrentWeatherCard data={mockData} />);
    expect(screen.getByText('12 mph S')).toBeInTheDocument();
  });
});
