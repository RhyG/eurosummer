import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Prediction } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  onPick: (prediction: Prediction) => void;
  onFocus?: () => void;
};

export function SearchBar({ onPick, onFocus }: Props) {
  const [q, setQ] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        const { predictions } = await api.search(q);
        setPredictions(predictions);
        setOpen(true);
      } catch {
        setPredictions([]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          value={q}
          onFocus={() => {
            onFocus?.();
            if (predictions.length > 0) setOpen(true);
          }}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a place to eat or drink…"
          className="h-11 w-full rounded-full border border-ink/10 bg-white pl-10 pr-9 text-base shadow-sm focus:outline-none focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/20"
        />
        {q && (
          <button
            onClick={() => {
              setQ('');
              setPredictions([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (predictions.length > 0 || busy) && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-lg">
          {busy && predictions.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink/50">Searching…</div>
          )}
          {predictions.map((p) => (
            <button
              key={p.placeId}
              onClick={() => {
                onPick(p);
                setOpen(false);
                setQ('');
                setPredictions([]);
              }}
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-ink/5',
              )}
            >
              <span className="text-sm font-medium">{p.primaryText}</span>
              {p.secondaryText && (
                <span className="text-xs text-ink/50">{p.secondaryText}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
