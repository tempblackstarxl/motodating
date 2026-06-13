import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { CitySuggestion } from "../types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Автодоповнення населених пунктів України.
 * Підказки приходять з backend (/api/cities → OSM/Photon) із затримкою (debounce).
 */
export function CityAutocomplete({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const { items } = await api.searchCities(q);
        if (!cancelled) setSuggestions(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [query]);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="autocomplete">
      <input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery(value);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && (loading || suggestions.length > 0) && (
        <ul
          className="autocomplete-list"
          onMouseDown={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {loading && suggestions.length === 0 && <li className="ac-loading">Пошук…</li>}
          {suggestions.map((c) => (
            <li key={`${c.name}|${c.region}|${c.lat}`} onClick={() => pick(c.name)}>
              <span className="ac-name">{c.name}</span>
              <span className="ac-oblast">{c.region}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
