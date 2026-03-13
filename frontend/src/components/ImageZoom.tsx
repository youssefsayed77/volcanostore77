import { useRef, useState } from "react";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageZoom({ src, alt, className = "" }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => setIsZoomed(false);

  // Mobile: tap to toggle
  const handleTouchStart = () => setIsZoomed((z) => !z);

  return (
    <div
      ref={containerRef}
      className={`image-zoom-container overflow-hidden cursor-zoom-in ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      <img
        src={src}
        alt={alt}
        className="image-zoom-img h-full w-full object-cover transition-transform duration-500 ease-out"
        style={{
          transform: isZoomed ? "scale(2)" : "scale(1)",
          transformOrigin,
        }}
        draggable={false}
      />
      {!isZoomed && (
        <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md pointer-events-none">
          🔍 {/* Zoom indicator */}
        </div>
      )}
    </div>
  );
}
