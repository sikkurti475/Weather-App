import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders input and button', () => {
    render(<SearchBar onSearch={jest.fn()} loading={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('disables button when input is empty', () => {
    render(<SearchBar onSearch={jest.fn()} loading={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables button when input has text', async () => {
    render(<SearchBar onSearch={jest.fn()} loading={false} />);
    await userEvent.type(screen.getByRole('textbox'), 'Austin');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls onSearch with trimmed value on submit', async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);
    await userEvent.type(screen.getByRole('textbox'), '  Austin  ');
    await userEvent.click(screen.getByRole('button'));
    expect(onSearch).toHaveBeenCalledWith('Austin');
  });

  it('disables input and shows loading text while loading', () => {
    render(<SearchBar onSearch={jest.fn()} loading={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Searching…');
  });
});
