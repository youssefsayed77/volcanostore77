import { useEffect, useRef } from "react";

type Locale = "en" | "ar";

interface SearchResult {
  id: number;
  name: { en: string; ar: string };
  image: string;
  price: number;
  category: string;
}

interface SearchDropdownProps {
  results: SearchResult[];
  locale: Locale;
  visible: boolean;
  onSelect: (productId: number) => void;
  onClose: () => void;
  formatPrice: (locale: Locale, amount: number) => string;
}

export function SearchDropdown({
  results,
  locale,
  visible,
  onSelect,
  onClose,
  formatPrice,
}: SearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [visible, onClose]);

  if (!visible || results.length === 0) return null;

  const displayed = results.slice(0, 6);

  return (
    <div
      ref={ref}
      className="search-dropdown absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-2xl border border-[var(--volcano-border)] bg-[var(--header-bg)] shadow-2xl backdrop-blur-xl"
    >
      <ul className="divide-y divide-[var(--border-subtle)]">
        {displayed.map((product) => (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => onSelect(product.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#c89a51]/8"
            >
              <img
                src={product.image}
                alt={product.name[locale]}
                className="h-10 w-10 shrink-0 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {product.name[locale]}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatPrice(locale, product.price)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[#c89a51]">→</span>
            </button>
          </li>
        ))}
      </ul>
      {results.length > 6 && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-2.5 text-center">
          <span className="text-xs text-[var(--text-muted)]">
            {locale === "ar"
              ? `+${results.length - 6} نتائج أخرى`
              : `+${results.length - 6} more results`}
          </span>
        </div>
      )}
    </div>
  );
}
