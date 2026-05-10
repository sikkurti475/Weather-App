import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { fetchSuggestions, Suggestion } from '../services/weatherApi';

interface Props {
  onSelectSuggestion: (lat: number, lon: number, label: string) => void;
  onSearchText: (q: string) => void;
  loading: boolean;
}

export function SearchBar({ onSelectSuggestion, onSearchText, loading }: Props) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef(false);

  useEffect(() => {
    if (skipRef.current) { skipRef.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(value.trim());
      setSuggestions(results);
      setActiveIdx(-1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  function commit(s: Suggestion) {
    skipRef.current = true;
    setValue(s.label);
    setSuggestions([]);
    onSelectSuggestion(s.lat, s.lon, s.label);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setSuggestions([]); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) { commit(suggestions[activeIdx]); }
      else if (value.trim()) { setSuggestions([]); onSearchText(value.trim()); }
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) { setLocateError('Geolocation not supported'); return; }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onSelectSuggestion(coords.latitude, coords.longitude, '');
        setLocating(false);
      },
      () => { setLocateError('Location access denied'); setLocating(false); }
    );
  }

  return (
    <div className="search-wrapper">
      <div className="search-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Search city… (e.g. Villanova, Pennsylvania, US)"
            aria-label="Location search"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list" role="listbox">
              {suggestions.map((s, i) => (
                <li
                  key={`${s.lat}-${s.lon}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={`suggestions-list__item${i === activeIdx ? ' suggestions-list__item--active' : ''}`}
                  onMouseDown={() => commit(s)}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          className="locate-btn"
          onClick={handleLocate}
          disabled={locating || loading}
          title="Use my location"
          aria-label="Use my location"
        >
          {locating ? '…' : '📍'}
        </button>
      </div>
      {locateError && <p className="hint hint--error">{locateError}</p>}
    </div>
  );
}
