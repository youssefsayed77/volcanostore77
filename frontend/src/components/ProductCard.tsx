import { cn } from "../utils/cn";
import { WishlistButton } from "./WishlistButton";

type Locale = "en" | "ar";
type Category = "accessories" | "bags" | "rings" | "earrings" | "necklaces";

interface ProductCardProps {
  product: {
    id: number;
    category: Category;
    name: { en: string; ar: string };
    description: { en: string; ar: string };
    price: number;
    image: string;
    rating: number;
    isNew?: boolean;
    inStock?: boolean;
  };
  locale: Locale;
  categoryLabel: string;
  addLabel: string;
  detailsLabel: string;
  newLabel: string;
  isAdmin?: boolean;
  isWishlisted?: boolean;
  discountedPrice?: number;
  onAddToCart: (productId: number, e?: React.MouseEvent) => void;
  onDelete?: (productId: number) => void;
  onQuickView?: (productId: number) => void;
  onWishlistToggle?: (productId: number) => void;
  onToggleStock?: (productId: number) => void;
  outOfStockLabel: string;
}

function formatCurrency(locale: Locale, amount: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductCard({
  product,
  locale,
  categoryLabel,
  addLabel,
  detailsLabel,
  newLabel,
  isAdmin,
  isWishlisted = false,
  discountedPrice,
  onAddToCart,
  onDelete,
  onQuickView,
  onWishlistToggle,
  onToggleStock,
  outOfStockLabel,
}: ProductCardProps) {
  const hasDiscount = discountedPrice != null && discountedPrice < product.price;

  return (
    <article className="panel hover-lift group overflow-hidden rounded-[2rem]" data-reveal>
      <div className="relative overflow-hidden rounded-[1.6rem]">
        <img
          src={product.image}
          alt={product.name[locale]}
          className="h-[28rem] w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Top row: badges + actions */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-200 backdrop-blur-md">
              {categoryLabel}
            </span>
            {product.isNew && (
              <span className="w-fit rounded-full bg-[#c89a51] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black">
                {newLabel}
              </span>
            )}
            {hasDiscount && (
              <span className="discount-badge w-fit">
                {locale === "ar" ? "خصم" : "SALE"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {onWishlistToggle && (
              <WishlistButton
                isActive={isWishlisted}
                onToggle={() => onWishlistToggle(product.id)}
                size="sm"
              />
            )}
            {isAdmin && onDelete && (
              <div className="flex flex-col gap-2">
                {onToggleStock && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleStock(product.id);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-lg text-white backdrop-blur-md transition hover:scale-110 ${
                      product.inStock !== false ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-stone-500/80 hover:bg-stone-500"
                    }`}
                    title="Toggle Stock Status"
                  >
                    📦
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick View overlay on hover */}
        {onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickView(product.id);
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100"
          >
            <span className="rounded-full border border-white/40 bg-black/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition hover:bg-[#c89a51] hover:text-black hover:border-[#c89a51]">
              {locale === "ar" ? "عرض سريع" : "Quick View"}
            </span>
          </button>
        )}

        {/* Bottom row: rating + price */}
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-[#f8d39a]">
              <span>★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <h3 className="text-xl font-semibold text-white">{product.name[locale]}</h3>
          </div>
          <div className="rounded-full border border-[#c89a51]/35 bg-black/60 px-4 py-2 text-sm font-semibold backdrop-blur-md">
            {hasDiscount ? (
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-xs line-through text-white/50">{formatCurrency(locale, product.price)}</span>
                <span className="text-[#f3c97b]">{formatCurrency(locale, discountedPrice!)}</span>
              </span>
            ) : (
              <span className="text-[#f3c97b]">{formatCurrency(locale, product.price)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6 text-inherit">
        <p className="line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{product.description[locale]}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={product.inStock === false}
            onClick={(e) => {
              if (product.inStock !== false) {
                onAddToCart(product.id, e);
              }
            }}
            className={cn(
              "flex-1 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em]",
              product.inStock === false
                ? "bg-stone-500/20 text-stone-400 cursor-not-allowed border border-stone-500/20"
                : "glow-button text-black"
            )}
          >
            {product.inStock === false ? outOfStockLabel : addLabel}
          </button>
          <a
            href={`#/product/${product.id}`}
            className={cn(
              "flex-1 rounded-full border border-[var(--volcano-border)] px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] transition",
              "text-[var(--text-secondary)] hover:border-[#c89a51] hover:bg-[#c89a51]/10 hover:text-[#c89a51]"
            )}
          >
            {detailsLabel}
          </a>
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(product.id);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/5 text-xl text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-500"
              title="Delete Product"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
