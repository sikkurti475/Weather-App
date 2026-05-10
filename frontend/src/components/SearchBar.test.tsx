import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders input and button', () => {
    render(<SearchBar onSelectSuggestion={jest.fn()} onSearchText={jest.fn()} loading={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument();
  });

  it('button is enabled when not loading', () => {
    render(<SearchBar onSelectSuggestion={jest.fn()} onSearchText={jest.fn()} loading={false} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls onSearchText with trimmed value on Enter', async () => {
    const onSearchText = jest.fn();
    render(<SearchBar onSelectSuggestion={jest.fn()} onSearchText={onSearchText} loading={false} />);
    await userEvent.type(screen.getByRole('textbox'), '  Austin  ');
    await userEvent.keyboard('{Enter}');
    expect(onSearchText).toHaveBeenCalledWith('Austin');
  });

  it('disables button while loading', () => {
    render(<SearchBar onSelectSuggestion={jest.fn()} onSearchText={jest.fn()} loading={true} />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
