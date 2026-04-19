'use client';

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { Incidence } from '@/types';

interface GlobalSearchBarProps {
  incidences: Incidence[];
  onSelect?: (incidence: Incidence) => void;
}

export function GlobalSearchBar({ incidences, onSelect }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return incidences.filter(
      (inc) =>
        inc.title.toLowerCase().includes(term) ||
        inc.description.toLowerCase().includes(term)
    );
  }, [query, incidences]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar incidencias..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {focused && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-64 overflow-y-auto py-1">
            {results.map((inc) => (
              <li
                key={inc.id}
                className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect?.(inc);
                  setQuery('');
                  setFocused(false);
                }}
              >
                <span className="font-medium">{inc.title}</span>
                <span className="ml-2 text-xs text-slate-500">{inc.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
