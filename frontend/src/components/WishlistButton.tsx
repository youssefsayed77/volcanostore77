interface WishlistButtonProps {
  isActive: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export function WishlistButton({ isActive, onToggle, size = "md" }: WishlistButtonProps) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-base" : "h-10 w-10 text-xl";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`wishlist-btn flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${sizeClass} ${isActive
          ? "bg-rose-500/90 text-white shadow-[0_0_16px_rgba(244,63,94,0.4)] scale-110"
          : "bg-black/50 text-white/80 hover:bg-black/70 hover:text-rose-400"
        }`}
      aria-label={isActive ? "Remove from wishlist" : "Add to wishlist"}
    >
      <span className={`wishlist-icon ${isActive ? "is-active" : ""}`}>
        {isActive ? "♥" : "♡"}
      </span>
    </button>
  );
}
