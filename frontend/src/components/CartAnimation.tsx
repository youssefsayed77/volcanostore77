import { useEffect, useState } from "react";

interface CartAnimationProps {
  productImage: string;
  startPos: { x: number; y: number };
  onComplete: () => void;
}

export function CartAnimation({ productImage, startPos, onComplete }: CartAnimationProps) {
  const [phase, setPhase] = useState<"flying" | "done">("flying");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (phase === "done") return null;

  // Target the cart icon in the header (approximate top-right)
  const endX = window.innerWidth - 80;
  const endY = 24;

  return (
    <div
      className="cart-fly-item"
      style={{
        position: "fixed",
        left: startPos.x,
        top: startPos.y,
        zIndex: 9999,
        pointerEvents: "none",
        ["--end-x" as string]: `${endX - startPos.x}px`,
        ["--end-y" as string]: `${endY - startPos.y}px`,
      }}
    >
      <img
        src={productImage}
        alt=""
        className="h-16 w-16 rounded-2xl object-cover shadow-xl"
      />
    </div>
  );
}
