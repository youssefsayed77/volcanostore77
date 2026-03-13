interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function ThemeToggle({ isDark, onToggle, compact }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`theme-toggle-btn rounded-full border border-[var(--volcano-border)] bg-[var(--input-bg)] transition-all duration-300 hover:border-[#c89a51] hover:bg-[#c89a51]/10 ${compact ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
        }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className={`theme-toggle-icon ${isDark ? "is-dark" : "is-light"}`}>
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
