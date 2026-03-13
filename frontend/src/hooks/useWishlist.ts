import { useCallback, useState } from "react";

const STORAGE_KEY = "volcano_wishlist";

function readWishlist(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useWishlist() {
  const [items, setItems] = useState<number[]>(() => readWishlist());

  const sync = useCallback((next: number[]) => {
    setItems(next);
    writeWishlist(next);
  }, []);

  const toggle = useCallback(
    (productId: number) => {
      const current = readWishlist();
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      sync(next);
    },
    [sync]
  );

  const isInWishlist = useCallback(
    (productId: number) => items.includes(productId),
    [items]
  );

  const remove = useCallback(
    (productId: number) => {
      sync(items.filter((id) => id !== productId));
    },
    [items, sync]
  );

  return { wishlistItems: items, toggle, isInWishlist, remove } as const;
}
