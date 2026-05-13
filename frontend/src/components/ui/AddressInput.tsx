'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Suggestion {
  label: string;
  place_id?: string;
}

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AddressInput({ label, value, onChange, placeholder, hint, prefix }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/places/autocomplete?q=${encodeURIComponent(q)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 350);
  };

  const handleSelect = (s: Suggestion) => {
    onChange(s.label);
    setSuggestions([]);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className={`flex items-center border rounded-xl px-3 py-2.5 bg-white transition-all ${
        open ? 'border-taxi-500 ring-2 ring-taxi-100' : 'border-gray-200'
      }`}>
        {prefix && <span className="shrink-0 mr-2">{prefix}</span>}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? 'Digite o endereço...'}
          className="flex-1 outline-none bg-transparent text-gray-900 text-base placeholder-gray-300 min-w-0"
          style={{ width: 0 }}
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-taxi-400 border-t-transparent rounded-full animate-spin shrink-0 ml-2" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-taxi-50 transition-colors flex items-start gap-2 border-b border-gray-50 last:border-0"
              >
                <span className="mt-0.5 shrink-0 text-gray-400">📍</span>
                <span className="leading-snug">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
