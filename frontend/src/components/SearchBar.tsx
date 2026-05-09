import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { getSuggestions, GeoSuggestion } from '../services/weatherApi';

interface SearchBarProps {
  onSearch: (location: string) => void;
  loading: boolean;
  error: string | null;
}

function labelFor(s: GeoSuggestion) {
  return [s.name, s.state, s.country].filter(Boolean).join(', ');
}

// OWM /data/2.5/weather only understands "city,countrycode" — state breaks it
function queryFor(s: GeoSuggestion) {
  return `${s.name},${s.country}`;
}

export function SearchBar({ onSearch, loading, error }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const committedQueryRef = useRef<string | null>(null);
  const skipFetchRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounced suggestions fetch
  useEffect(() => {
    if (skipFetchRef.current) { skipFetchRef.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(value.trim());
      setSuggestions(results);
      setActiveIdx(-1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  function commit(s: GeoSuggestion) {
    const q = queryFor(s);
    committedQueryRef.current = q;
    skipFetchRef.current = true;
    setValue(labelFor(s));
    setSuggestions([]);
    setActiveIdx(-1);
    onSearch(q);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      commit(suggestions[activeIdx]);
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    setSuggestions([]);
    // If the user hasn't edited the input since picking a suggestion, reuse the safe query
    onSearch(committedQueryRef.current ?? trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  }

  // Autocorrect: first suggestion when city-not-found error
  const isCityNotFound = error?.toLowerCase().includes('city not found') || error?.toLowerCase().includes('not found');
  const autocorrectSuggestion = isCityNotFound && suggestions.length > 0 ? suggestions[0] : null;

  return (
    <div className="search-wrapper">
      <form onSubmit={handleSubmit} className="search-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); committedQueryRef.current = null; }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Enter city name (e.g. Austin, TX)"
            aria-label="Location search"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            disabled={loading}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list" ref={listRef} role="listbox">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={i === activeIdx ? 'suggestions-list__item suggestions-list__item--active' : 'suggestions-list__item'}
                  onMouseDown={() => commit(s)}
                >
                  {labelFor(s)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {autocorrectSuggestion && (
        <p className="autocorrect-hint">
          Did you mean{' '}
          <button className="autocorrect-hint__btn" onClick={() => commit(autocorrectSuggestion)}>
            {labelFor(autocorrectSuggestion)}
          </button>
          ?
        </p>
      )}
    </div>
  );
}
