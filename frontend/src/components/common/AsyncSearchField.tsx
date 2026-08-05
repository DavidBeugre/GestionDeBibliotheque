import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';

interface AsyncSearchFieldProps<T> {
  placeholder: string;
  search: (query: string) => Promise<T[]>;
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  renderSelected: (item: T) => React.ReactNode;
  selected: T | null;
  onSelect: (item: T | null) => void;
  disabled?: boolean;
}

export function AsyncSearchField<T>({
  placeholder,
  search,
  getKey,
  renderItem,
  renderSelected,
  selected,
  onSelect,
  disabled,
}: AsyncSearchFieldProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    search(debouncedQuery)
      .then((items) => !cancelled && setResults(items))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
        {renderSelected(selected)}
        {!disabled && (
          <button type="button" onClick={() => onSelect(null)} aria-label="Retirer la sélection">
            <X className="size-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {results.length === 0 && !isLoading && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">Aucun résultat</p>
          )}
          {results.map((item) => (
            <button
              key={getKey(item)}
              type="button"
              onClick={() => {
                onSelect(item);
                setQuery('');
                setIsOpen(false);
              }}
              className={cn('flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted')}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
