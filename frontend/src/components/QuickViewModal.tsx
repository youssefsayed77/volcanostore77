type Locale = "en" | "ar";
type Category = "accessories" | "bags" | "rings" | "earrings" | "necklaces";

interface QuickViewProduct {
  id: number;
  category: Category;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  rating: number;
  isNew?: boolean;
  discountedPrice?: number;
}

interface QuickViewModalProps {
  product: QuickViewProduct;
  locale: Locale;
  categoryLabel: string;
  addLabel: string;
  onAddToCart: (productId: number) => void;
  onClose: () => void;
}

function formatCurrency(locale: Locale, amount: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuickViewModal({
  product,
  locale,
  categoryLabel,
  addLabel,
  onAddToCart,
  onClose,
}: QuickViewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 quick-view-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="quick-view-modal panel rounded-[2rem] w-full max-w-2xl overflow-hidden">
        <div className="grid sm:grid-cols-2">
          {/* Image */}
          <div className="relative h-72 sm:h-full min-h-[300px]">
            <img
              src={product.image}
              alt={product.name[locale]}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:bg-gradient-to-r" />
            {product.isNew && (
              <span className="absolute top-4 left-4 rounded-full bg-[#c89a51] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black">
                {locale === "ar" ? "جديد" : "New"}
              </span>
            )}
          </div>
          {/* Info */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#c89a51] mb-2">{categoryLabel}</p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{product.name[locale]}</h2>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[#f8d39a]">★ {product.rating.toFixed(1)}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                {product.description[locale]}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {product.discountedPrice != null && product.discountedPrice < product.price ? (
                  <>
                    <span className="text-2xl font-bold text-[#c89a51]">{formatCurrency(locale, product.discountedPrice)}</span>
                    <span className="text-sm line-through text-[var(--text-muted)]">{formatCurrency(locale, product.price)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#c89a51]">{formatCurrency(locale, product.price)}</span>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => { onAddToCart(product.id); onClose(); }}
                className="glow-button flex-1 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
              >
                {addLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--volcano-border)] px-5 py-3 text-sm text-[var(--text-secondary)] transition hover:border-[#c89a51] hover:text-[#c89a51]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
