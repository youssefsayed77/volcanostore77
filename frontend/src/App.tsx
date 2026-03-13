import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "./components/BrandLogo";
import { CartAnimation } from "./components/CartAnimation";
import { ImageZoom } from "./components/ImageZoom";
import { ProductCard } from "./components/ProductCard";
import { QuickViewModal } from "./components/QuickViewModal";
import { SearchDropdown } from "./components/SearchDropdown";
import { SkeletonCard } from "./components/SkeletonCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { WishlistButton } from "./components/WishlistButton";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useTheme } from "./hooks/useTheme";
import { useWishlist } from "./hooks/useWishlist";
import { cn } from "./utils/cn";

/* ──────────────────────────────────── Splash Screen ────────────────────── */
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"en" | "ar" | "exit">("en");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ar"), 1400);
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    const t3 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={cn("splash-overlay", phase === "exit" && "exiting")}>
      {/* Gold ring decoration */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full border border-[#c89a51]/15 blur-sm" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full border border-[#c89a51]/25" />
      {/* Brand name at top */}
      <p className="absolute top-10 text-xs uppercase tracking-[0.4em] text-[#c89a51]">Volcano</p>
      {/* Animated headline */}
      <div className="relative flex flex-col items-center gap-2">
        <h1
          className={cn(
            "splash-text text-center",
            phase === "en" && "visible",
            phase === "ar" && "fading"
          )}
        >
          Welcome to Volcano
        </h1>
        <h1
          className={cn(
            "splash-text text-center",
            phase === "ar" && "visible",
            phase === "exit" && "fading"
          )}
          dir="rtl"
          style={{ position: "absolute" }}
        >
          أهلاً بك في ڤولكانو
        </h1>
      </div>
      {/* Gold bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[2px] w-20 rounded-full bg-[#c89a51]/60" />
    </div>
  );
}

type Locale = "en" | "ar";
type Category = "accessories" | "bags" | "rings" | "earrings" | "necklaces";
type FilterCategory = Category | "all";

type Product = {
  id: number;
  _id?: string;
  category: Category;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  rating: number;
  isNew?: boolean;
  inStock?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
};

type CartItem = {
  productId: number;
  quantity: number;
};

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: "pending" | "shipped" | "delivered";
}

interface StoredUser {
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "customer";
  orders?: Order[];
}

type SessionUser = {
  name: string;
  email: string;
  role: "customer" | "admin";
  token?: string;
  orders?: Order[];
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const API_BASE = "/api";
const DEMO_ADMIN = { email: "admin@volcano.com", password: "Admin123!" };
const storageKeys = {
  locale: "volcano_locale",
  cart: "volcano_cart",
  session: "volcano_session",
  users: "volcano_users",
  products: "volcano_products",
  discounts: "volcano_discounts",
};

type DiscountConfig = {
  enabled: boolean;
  type: "percentage" | "fixed";
  value: number;
  scope: "global" | "product";
  productIds: number[];
};

const defaultDiscount: DiscountConfig = {
  enabled: false,
  type: "percentage",
  value: 0,
  scope: "global",
  productIds: [],
};

const categories: {
  key: Category;
  icon: string;
  label: { en: string; ar: string };
  blurb: { en: string; ar: string };
}[] = [
    {
      key: "accessories",
      icon: "✦",
      label: { en: "Accessories", ar: "إكسسوارات" },
      blurb: {
        en: "Polished finishing touches for every day and every gift box.",
        ar: "لمسات أنيقة تكمل كل إطلالة وكل هدية.",
      },
    },
    {
      key: "bags",
      icon: "⏢",
      label: { en: "Bags", ar: "حقائب" },
      blurb: {
        en: "Modern silhouettes designed for style, travel, and gifting.",
        ar: "تصاميم عصرية للأناقة والسفر والهدايا.",
      },
    },
    {
      key: "rings",
      icon: "◎",
      label: { en: "Rings", ar: "خواتم" },
      blurb: {
        en: "Signature rings with sculpted lines and luxurious details.",
        ar: "خواتم مميزة بخطوط منحوتة وتفاصيل فاخرة.",
      },
    },
    {
      key: "earrings",
      icon: "◐",
      label: { en: "Earrings", ar: "أقراط" },
      blurb: {
        en: "Elegant earrings that move beautifully from day to night.",
        ar: "أقراط أنيقة تناسب الإطلالات النهارية والمسائية.",
      },
    },
    {
      key: "necklaces",
      icon: "❂",
      label: { en: "Necklaces", ar: "قلائد" },
      blurb: {
        en: "Layered and statement necklaces inspired by golden light.",
        ar: "قلائد بطابع مميز مستوحاة من الوهج الذهبي.",
      },
    },
  ];

const categoryLookup = Object.fromEntries(categories.map((category) => [category.key, category])) as Record<
  Category,
  (typeof categories)[number]
>;

const seedProducts: Product[] = [];

const copy = {
  en: {
    home: "Home",
    products: "Products",
    categories: "Categories",
    login: "Login",
    register: "Register",
    cart: "Cart",
    logout: "Logout",
    heroBadge: "Volcano Accessories & Gifts",
    heroTitle: "Luxury accessories shaped by golden detail.",
    heroText:
      "Accessories designed specifically to add a touch of elegance to your look; VOLCANO enhances your beauty.",
    shopNow: "Shop now",
    discoverCollections: "Discover collections",
    searchPlaceholder: "Search accessories, bags, rings, earrings, necklaces...",
    featured: "Featured products",
    allCollections: "All collections",
    exploreCategories: "Explore our categories",
    popular: "Popular right now",
    whyVolcano: "Why customers love Volcano",
    premiumCraft: "Premium craft",
    premiumCraftText: "Curated textures, polished finishes, and premium gift-ready styling.",
    fastDelivery: "Fast delivery",
    fastDeliveryText: "Fast delivery across all Egyptian governorates — from Cairo to every corner of Egypt.",
    bilingual: "Material quality",
    bilingualText: "Every piece is crafted from consistent high-grade materials to ensure lasting quality and beauty.",
    trustStat: "Customers trust us",
    all: "All",
    filterBy: "Filter by category",
    addToCart: "Add to cart",
    viewDetails: "View details",
    newTag: "New",
    productDetails: "Product details",
    quantity: "Quantity",
    summary: "Summary",
    subtotal: "Subtotal",
    checkout: "Secure checkout",
    emptyCart: "Your cart is waiting for a signature piece.",
    continueShopping: "Continue shopping",
    noProducts: "No products matched your search.",
    orders: "Orders",
    orderHistory: "Order History",
    orderNo: "Order #",
    orderDate: "Date",
    orderStatus: "Status",
    orderTotal: "Total",
    statusPending: "Pending",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",
    noOrders: "You haven't placed any orders yet.",
    bestSellers: "Best Sellers",
    bestSellersDesc: "Our most loved pieces.",
    newArrivals: "New Arrivals",
    newArrivalsDesc: "Discover the latest additions to our collection.",
    outOfStock: "Out of stock",
    adminBestSeller: "Show in Best Sellers",
    adminNewArrival: "Show in New Arrivals",
    loginTitle: "Welcome back",
    registerTitle: "Create your Volcano account",
    authDescription: "Sign in securely or continue in demo mode while the backend is offline.",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    haveAccount: "Already have an account?",
    noAccount: "Need an account?",
    demoAdmin: "Demo admin: admin@volcano.com / Admin123!",
    authNote:
      "When the backend is running, credentials are sent to the secure API. Offline demo mode stores hashed credentials locally so raw passwords are never saved.",
    categoryIntro: "Elegant pieces curated for gifting, occasion styling, and modern daily wear.",
    related: "You may also love",
    added: "Added to cart",
    removed: "Removed from cart",
    updated: "Cart updated",
    deleted: "Product deleted",
    deleteError: "Failed to delete product",
    loginSuccess: "Logged in successfully",
    registerSuccess: "Account created successfully",
    logoutSuccess: "Signed out successfully",
    invalidLogin: "Invalid email or password",
    mismatchPasswords: "Passwords do not match",
    productSaved: "Product added successfully",
    whatsappCheckout: "Order via WhatsApp",
    orderName: "Full Name",
    orderAddress: "Shipping Address",
    orderPhone: "Primary Phone",
    orderPhone2: "Alternative Phone",
    confirmOrder: "Confirm Order",
    checkoutTitle: "Complete Your Order",
    adminPanel: "Admin product manager",
    addProduct: "Add product",
    description: "Description",
    image: "Image URL",
    price: "Price",
    category: "Category",
    saveProduct: "Save product",
    footerText: "Luxury accessories, gifts, and distinctive pieces for complete elegance.",
    account: "Account",
    welcome: "Welcome",
    items: "items",
    secure: "SSL Ensured",
    artisan: "Curated design",
    shipping: "All over Egypt",
    featuredCart: "Your bag",
    emptyStateTitle: "Nothing here yet",
    backHome: "Back to home",
    pageNotFound: "Page not found",
    startShopping: "Start shopping",
    searchResults: "Search results",
    adminHint: "Use the demo admin account or your backend admin token to add products instantly.",
  },
  ar: {
    home: "الرئيسية",
    products: "المنتجات",
    categories: "الفئات",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    cart: "السلة",
    logout: "تسجيل الخروج",
    heroBadge: "فولكانو للإكسسوارات والهدايا",
    heroTitle: "إكسسوارات فاخرة بتفاصيل ذهبية راقية.",
    heroText:
      "اكسسوارات صممت خصيصاً لجعل اناقتك ذات لمسة جمالية, فولكانو يعمل على جمالك.",
    shopNow: "تسوق الآن",
    discoverCollections: "اكتشف المجموعات",
    searchPlaceholder: "ابحث عن إكسسوارات، حقائب، خواتم، أقراط، قلائد...",
    featured: "منتجات مميزة",
    allCollections: "كل المجموعات",
    exploreCategories: "استكشف الفئات",
    popular: "الأكثر رواجاً",
    whyVolcano: "لماذا يحب العملاء فولكانو",
    premiumCraft: "جودة فاخرة",
    premiumCraftText: "خامات مختارة بعناية ولمسات نهائية راقية وتغليف مناسب للهدايا.",
    fastDelivery: "توصيل سريع",
    fastDeliveryText: "توصيل سريع لجميع محافظات مصر — من القاهرة لكل أرجاء الجمهورية.",
    bilingual: "جودة الخامات",
    bilingualText: "كل قطعة مصنوعة من خامات عالية الجودة لضمان جمال دائم ومتانة تدوم.",
    all: "الكل",
    filterBy: "تصفية حسب الفئة",
    addToCart: "أضف إلى السلة",
    viewDetails: "عرض التفاصيل",
    newTag: "جديد",
    productDetails: "تفاصيل المنتج",
    quantity: "الكمية",
    summary: "الملخص",
    subtotal: "الإجمالي الفرعي",
    checkout: "إتمام الشراء الآمن",
    emptyCart: "سلتك بانتظار قطعة مميزة.",
    continueShopping: "متابعة التسوق",
    noProducts: "لا توجد منتجات مطابقة لبحثك.",
    loginTitle: "مرحباً بعودتك",
    registerTitle: "أنشئ حساب فولكانو",
    authDescription: "سجل الدخول بأمان أو استخدم الوضع التجريبي عند عدم تشغيل الخادم.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    haveAccount: "هل لديك حساب بالفعل؟",
    noAccount: "تحتاج إلى حساب؟",
    demoAdmin: "حساب المدير التجريبي: admin@volcano.com / Admin123!",
    authNote:
      "عند تشغيل الخادم يتم إرسال البيانات إلى واجهة API آمنة. وفي الوضع التجريبي يتم حفظ نسخة مشفرة من كلمة المرور محلياً دون تخزينها كنص صريح.",
    categoryIntro: "قطع أنيقة مناسبة للهدايا والإطلالات الخاصة والاستخدام اليومي العصري.",
    related: "قد يعجبك أيضاً",
    added: "تمت الإضافة إلى السلة",
    removed: "تمت إزالة المنتج من السلة",
    updated: "تم تحديث السلة",
    deleted: "تم حذف المنتج بنجاح",
    deleteError: "فشل حذف المنتج",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    registerSuccess: "تم إنشاء الحساب بنجاح",
    logoutSuccess: "تم تسجيل الخروج بنجاح",
    invalidLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    mismatchPasswords: "كلمتا المرور غير متطابقتين",
    productSaved: "تمت إضافة المنتج بنجاح",
    whatsappCheckout: "اطلب عبر واتساب",
    orderName: "الاسم الكامل",
    orderAddress: "عنوان الشحن",
    orderPhone: "رقم الهاتف الأساسي",
    orderPhone2: "رقم هاتف بديل",
    confirmOrder: "تأكيد الطلب",
    checkoutTitle: "أتمم طلبك",
    adminPanel: "لوحة إدارة المنتجات",
    addProduct: "إضافة منتج",
    description: "الوصف",
    image: "رابط الصورة",
    price: "السعر",
    category: "الفئة",
    saveProduct: "حفظ المنتج",
    footerText: "إكسسوارات فاخرة وهدايا وقطع مميزة لأناقة مكتملة.",
    account: "الحساب",
    welcome: "مرحباً",
    items: "منتجات",
    secure: "حماية SSL",
    artisan: "تصميم منتقى",
    shipping: "في جميع أنحاء مصر",
    featuredCart: "حقيبتك",
    emptyStateTitle: "لا يوجد محتوى هنا بعد",
    backHome: "العودة للرئيسية",
    pageNotFound: "الصفحة غير موجودة",
    startShopping: "ابدأ التسوق",
    searchResults: "نتائج البحث",
    adminHint: "استخدم حساب المدير التجريبي أو رمز المدير من الخادم لإضافة المنتجات فوراً.",
    orders: "تاريخ الطلبات",
    orderHistory: "سجل الطلبات",
    orderNo: "رقم الطلب",
    orderDate: "التاريخ",
    orderStatus: "الحالة",
    orderTotal: "الإجمالي",
    statusPending: "قيد المراجعة",
    statusShipped: "تم الشحن",
    statusDelivered: "تم التوصيل",
    noOrders: "لم تقم بإجراء أي طلبات حتى الآن.",
    bestSellers: "الأكثر مبيعاً",
    bestSellersDesc: "القطع المفضلة لدى عملائنا.",
    newArrivals: "أحدث المنتجات",
    newArrivalsDesc: "اكتشف أحدث الإضافات لمجموعتنا.",
    outOfStock: "غير متوفر في المخزن",
    adminBestSeller: "عرض في الأكثر مبيعاً",
    adminNewArrival: "عرض في أحدث المنتجات",
  },
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.hash.replace(/^#/, "") || "/";
}

function formatCurrency(locale: Locale, amount: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function hashPassword(password: string) {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => null)) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 space-y-3 fade-in">
      <p className="text-xs uppercase tracking-[0.32em] text-[#c89a51]">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{description}</p>
    </div>
  );
}

function EmptyState({ title, actionLabel }: { title: string; actionLabel: string }) {
  return (
    <div className="panel fade-in rounded-[2rem] px-6 py-16 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#c89a51]">Volcano</p>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
        Browse our premium edit of accessories, bags, rings, earrings, and necklaces.
      </p>
      <a
        href="#/products"
        className="glow-button mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
      >
        {actionLabel}
      </a>
    </div>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => readStorage(storageKeys.locale, "en"));
  const [route, setRoute] = useState<string>(() => getRoute());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(storageKeys.cart, []));
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>(() => readStorage(storageKeys.users, []));
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => readStorage(storageKeys.session, null));
  const [customProducts, setCustomProducts] = useState<Product[]>(() => readStorage(storageKeys.products, []));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", address: "", phone: "", phone2: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [adminForm, setAdminForm] = useState<{
    name: string;
    description: string;
    price: string;
    imageFile: File | null;
    category: Category;
    isBestSeller: boolean;
    isNewArrival: boolean;
  }>({
    name: "",
    description: "",
    price: "",
    imageFile: null,
    category: "accessories",
    isBestSeller: false,
    isNewArrival: false,
  });

  // New feature states
  const { isDark, toggleTheme } = useTheme();
  const { wishlistItems, toggle: toggleWishlist, isInWishlist } = useWishlist();
  useScrollReveal();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartAnim, setCartAnim] = useState<{ image: string; pos: { x: number; y: number } } | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig>(() => readStorage(storageKeys.discounts, defaultDiscount));
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [formCounter, setFormCounter] = useState(0);

  const t = copy[locale];
  const isArabic = locale === "ar";

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/";
    }

    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);


  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    writeStorage(storageKeys.locale, locale);
  }, [isArabic, locale]);

  useEffect(() => writeStorage(storageKeys.cart, cart), [cart]);
  useEffect(() => writeStorage(storageKeys.session, sessionUser), [sessionUser]);
  useEffect(() => writeStorage(storageKeys.users, storedUsers), [storedUsers]);
  useEffect(() => writeStorage(storageKeys.products, customProducts), [customProducts]);
  useEffect(() => writeStorage(storageKeys.discounts, discountConfig), [discountConfig]);

  // Simulate loading for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileMenuOpen(false), [route]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const allProducts = useMemo(() => [...customProducts, ...seedProducts], [customProducts]);

  const newArrivals = useMemo(() => {
    const manual = allProducts.filter(p => p.isNewArrival);
    const others = allProducts.filter(p => !p.isNewArrival).reverse();
    return [...manual, ...others].slice(0, 4);
  }, [allProducts]);

  const bestSellers = useMemo(() => {
    const manual = allProducts.filter(p => p.isBestSeller);
    const others = allProducts.filter(p => !p.isBestSeller).sort((a, b) => b.rating - a.rating);
    return [...manual, ...others].slice(0, 4);
  }, [allProducts]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return allProducts.filter(
      (p) =>
        p.name.en.toLowerCase().includes(q) ||
        p.name.ar.includes(q)
    );
  }, [search, allProducts]);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const categoryFromRoute = route.startsWith("/category/") ? (route.split("/")[2] as Category) : null;
  const productIdFromRoute = route.startsWith("/product/") ? Number(route.split("/")[2]) : null;
  const currentProduct = productIdFromRoute
    ? allProducts.find((product) => product.id === productIdFromRoute) || null
    : null;

  const effectiveCategory = categoryFromRoute ?? (selectedCategory === "all" ? null : selectedCategory);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allProducts.filter((product) => {
      const categoryMatch = !effectiveCategory || product.category === effectiveCategory;
      if (!categoryMatch) return false;
      if (!query) return true;

      const haystack = [
        product.name.en,
        product.name.ar,
        product.description.en,
        product.description.ar,
        product.category,
        categoryLookup[product.category].label.en,
        categoryLookup[product.category].label.ar,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allProducts, effectiveCategory, search]);

  const featuredProducts = allProducts.slice(0, 4);
  const popularProducts = allProducts.slice(4, 8);
  const relatedProducts = currentProduct
    ? allProducts.filter((product) => product.category === currentProduct.category && product.id !== currentProduct.id).slice(0, 3)
    : [];

  const getDiscountedPrice = useCallback((product: Product): number | undefined => {
    if (!discountConfig.enabled || discountConfig.value <= 0) return undefined;
    if (discountConfig.scope === "product" && !discountConfig.productIds.includes(product.id)) return undefined;
    if (discountConfig.type === "percentage") {
      return Math.round(product.price * (1 - discountConfig.value / 100));
    }
    return Math.max(0, product.price - discountConfig.value);
  }, [discountConfig]);

  const cartLines = cart
    .map((item) => {
      const product = allProducts.find((entry) => entry.id === item.productId);
      if (!product) return null;
      const effectivePrice = getDiscountedPrice(product) ?? product.price;
      return {
        ...item,
        product,
        lineTotal: effectivePrice * item.quantity,
        effectivePrice,
      };
    })
    .filter(Boolean) as Array<CartItem & { product: Product; lineTotal: number; effectivePrice: number }>;

  const cartSubtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const showNotice = (type: Notice["type"], message: string) => setNotice({ type, message });

  const navigate = (path: string) => {
    window.location.hash = path === "/" ? "#/" : `#${path}`;
    setRoute(path);
  };

  const addToCart = async (productId: number, e?: React.MouseEvent) => {
    // Cart fly animation
    if (e) {
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setCartAnim({ image: product.image, pos: { x: rect.left, y: rect.top } });
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 600);
      }
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { productId, quantity: 1 }];
    });

    if (sessionUser?.token) {
      try {
        await apiRequest("/cart", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionUser.token}` },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
      } catch {
        // Demo mode continues locally when backend is unavailable.
      }
    }

    showNotice("success", t.added);
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    setCart((current) => {
      if (nextQuantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }
      return current.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item));
    });
    showNotice("success", t.updated);
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
    showNotice("success", t.removed);
  };

  const toggleLocale = () => setLocale((current) => (current === "en" ? "ar" : "en"));

  const logout = () => {
    setSessionUser(null);
    showNotice("success", t.logoutSuccess);
    navigate("/");
  };

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      showNotice("error", t.mismatchPasswords);
      return;
    }

    const payload = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      password: registerForm.password,
    };

    try {
      const result = await apiRequest<{ user: SessionUser; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSessionUser({ ...result.user, token: result.token });
    } catch {
      const existing = storedUsers.find((user) => user.email === payload.email);
      if (existing) {
        showNotice("error", t.invalidLogin);
        return;
      }
      const passwordHash = await hashPassword(payload.password);
      setStoredUsers((current) => [
        ...current,
        { name: payload.name, email: payload.email, passwordHash, role: "customer" },
      ]);
      setSessionUser({ name: payload.name, email: payload.email, role: "customer", token: crypto.randomUUID() });
    }

    setRegisterForm({ name: "", email: "", password: "", confirmPassword: "" });
    showNotice("success", t.registerSuccess);
    navigate("/");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    try {
      const result = await apiRequest<{ user: SessionUser; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSessionUser({ ...result.user, token: result.token });
      setLoginForm({ email: "", password: "" });
      showNotice("success", t.loginSuccess);
      navigate("/");
      return;
    } catch {
      // Fallback below for demo mode.
    }

    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      setSessionUser({ name: "Volcano Admin", email, role: "admin", token: "demo-admin-token" });
      setLoginForm({ email: "", password: "" });
      showNotice("success", t.loginSuccess);
      navigate("/products");
      return;
    }

    const passwordHash = await hashPassword(password);
    const match = storedUsers.find((user) => user.email === email && user.passwordHash === passwordHash);

    if (!match) {
      showNotice("error", t.invalidLogin);
      return;
    }

    setSessionUser({ name: match.name, email: match.email, role: match.role, token: crypto.randomUUID() });
    setLoginForm({ email: "", password: "" });
    showNotice("success", t.loginSuccess);
    navigate("/");
  }

  async function handleAddProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionUser || sessionUser.role !== "admin") return;

    let imageUrl = "";

    try {
      const formData = new FormData();
      formData.append("name", adminForm.name.trim());
      formData.append("description", adminForm.description.trim());
      formData.append("price", adminForm.price);
      formData.append("category", adminForm.category);
      if (adminForm.imageFile) {
        formData.append("imageFormFile", adminForm.imageFile);
      }

      const response = await apiRequest<Product>("/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionUser.token || ""}` },
        body: formData,
      });
      imageUrl = response.image;
    } catch {
      // Local admin mode - create a virtual URL for the file
      if (adminForm.imageFile) {
        imageUrl = URL.createObjectURL(adminForm.imageFile);
      }
    }

    const productPayload = {
      id: Date.now(),
      category: adminForm.category,
      name: { en: adminForm.name.trim(), ar: adminForm.name.trim() },
      description: { en: adminForm.description.trim(), ar: adminForm.description.trim() },
      price: Number(adminForm.price),
      image: imageUrl,
      rating: 4.8,
      isNew: true,
      isBestSeller: adminForm.isBestSeller,
      isNewArrival: adminForm.isNewArrival,
    } satisfies Product;

    setCustomProducts((current) => [productPayload, ...current]);
    setAdminForm({
      name: "",
      description: "",
      price: "",
      imageFile: null,
      category: "accessories",
      isBestSeller: false,
      isNewArrival: false
    });
    setFormCounter(prev => prev + 1);
    showNotice("success", t.productSaved);
  }

  async function handleDeleteProduct(productId: number) {
    if (!sessionUser || sessionUser.role !== "admin") return;

    const productToDelete = allProducts.find((p) => p.id === productId);
    if (!productToDelete) return;

    const apiId = productToDelete._id || productId;
    const productName = productToDelete.name[locale];

    try {
      await apiRequest(`/products/${apiId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionUser.token || ""}` },
      });
      setCustomProducts((current) => current.filter((p) => p.id !== productId && p._id !== (productToDelete._id || "")));
      showNotice("success", `${productName} ${t.deleted}`);
      if (route.startsWith("/product/") && productIdFromRoute === productId) {
        navigate("/products");
      }
    } catch {
      // Offline fallback: delete from local custom products array
      setCustomProducts((current) => current.filter((p) => p.id !== productId && p._id !== (productToDelete._id || "")));
      showNotice("success", `${productName} ${t.deleted}`);
      if (route.startsWith("/product/") && productIdFromRoute === productId) {
        navigate("/products");
      }
    }
  }

  const navLinks = [
    { href: "#/", label: t.home },
    { href: "#/products", label: t.products },
    { href: "#/category/accessories", label: categoryLookup.accessories.label[locale] },
    { href: "#/category/bags", label: categoryLookup.bags.label[locale] },
    { href: "#/category/rings", label: categoryLookup.rings.label[locale] },
    { href: "#/category/earrings", label: categoryLookup.earrings.label[locale] },
    { href: "#/category/necklaces", label: categoryLookup.necklaces.label[locale] },
  ];

  const renderCatalog = (pageTitle: string, eyebrow: string) => (
    <section className="space-y-8 fade-in">
      <PageHeader eyebrow={eyebrow} title={pageTitle} description={t.categoryIntro} />

      <div className="panel rounded-[2rem] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.28em] text-[#c89a51]">{t.filterBy}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              navigate("/products");
            }}
            className={`rounded-full px-4 py-2 text-sm transition ${!effectiveCategory ? "bg-[#c89a51] text-black" : "border border-[#c89a51]/20 text-[var(--text-secondary)] hover:border-[#c89a51]/60"
              }`}
          >
            {t.all}
          </button>
          {categories.map((category) => {
            const active = effectiveCategory === category.key;
            return (
              <a
                key={category.key}
                href={`#/category/${category.key}`}
                className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-[#c89a51] text-black" : "border border-[#c89a51]/20 text-[var(--text-secondary)] hover:border-[#c89a51]/60"
                  }`}
              >
                {category.label[locale]}
              </a>
            );
          })}
        </div>

        {sessionUser?.role === "admin" && route === "/products" ? (
          <form onSubmit={handleAddProduct} className="mb-8 grid gap-4 rounded-[1.6rem] border border-[#c89a51]/15 bg-white/[0.02] p-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-1">
              <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.name}</label>
              <input
                value={adminForm.name}
                onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
              />
            </div>
            <div className="space-y-2 xl:col-span-1">
              <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.description}</label>
              <input
                value={adminForm.description}
                onChange={(event) => setAdminForm((current) => ({ ...current, description: event.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.price}</label>
              <input
                type="number"
                min="1"
                value={adminForm.price}
                onChange={(event) => setAdminForm((current) => ({ ...current, price: event.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.category}</label>
              <select
                value={adminForm.category}
                onChange={(event) => setAdminForm((current) => ({ ...current, category: event.target.value as Category }))}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 xl:col-span-1">
              <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.image}</label>
              <input
                key={formCounter}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setAdminForm((current) => ({ ...current, imageFile: file }));
                }}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#c89a51]/10 file:px-4 file:py-1.5 file:text-[#c89a51] file:transition hover:file:bg-[#c89a51]/20 focus:border-[#c89a51]"
              />
            </div>

            <div className="xl:col-span-5 flex flex-wrap items-center gap-6 px-2 py-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={adminForm.isBestSeller}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAdminForm(prev => ({
                        ...prev,
                        isBestSeller: checked,
                        isNewArrival: checked ? false : prev.isNewArrival
                      }));
                    }}
                    className="peer appearance-none w-5 h-5 rounded-md border border-[#c89a51]/30 bg-black/40 checked:bg-[#c89a51] checked:border-[#c89a51] transition-all duration-200"
                  />
                  <svg className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[#c89a51] transition-colors">{t.adminBestSeller}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={adminForm.isNewArrival}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAdminForm(prev => ({
                        ...prev,
                        isNewArrival: checked,
                        isBestSeller: checked ? false : prev.isBestSeller
                      }));
                    }}
                    className="peer appearance-none w-5 h-5 rounded-md border border-[#c89a51]/30 bg-black/40 checked:bg-[#c89a51] checked:border-[#c89a51] transition-all duration-200"
                  />
                  <svg className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[#c89a51] transition-colors">{t.adminNewArrival}</span>
              </label>
            </div>

            <div className="xl:col-span-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.adminPanel}</p>
                <p className="text-sm text-[var(--text-muted)]">{t.adminHint}</p>
              </div>
              <button type="submit" className="glow-button rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black">
                {t.saveProduct}
              </button>
            </div>
          </form>
        ) : null}

        {/* Global Discount Settings Panel */}
        {sessionUser ? (
          <div className="mb-8 panel rounded-[2rem] p-6 sm:p-8 relative z-20">
            <h2 className="text-xl font-semibold mb-6 text-[#c89a51]">Offers & Discounts Configuration</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discountConfig.enabled}
                  onChange={(e) => setDiscountConfig(c => ({ ...c, enabled: e.target.checked }))}
                  className="w-5 h-5 accent-[#c89a51]"
                />
                <span className="text-sm font-medium">Enable Active Discount</span>
              </label>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">Type</label>
                <select
                  value={discountConfig.type}
                  onChange={(e) => setDiscountConfig(c => ({ ...c, type: e.target.value as "percentage" | "fixed" }))}
                  className="w-full rounded-2xl border border-[var(--volcano-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">Value</label>
                <input
                  type="number"
                  min="0"
                  value={discountConfig.value || ""}
                  onChange={(e) => setDiscountConfig(c => ({ ...c, value: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-[var(--volcano-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#c89a51]"
                  placeholder="e.g. 15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">Scope</label>
                <select
                  value={discountConfig.scope}
                  onChange={(e) => setDiscountConfig(c => ({ ...c, scope: e.target.value as "global" | "product" }))}
                  disabled
                  className="w-full rounded-2xl border border-[var(--volcano-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#c89a51] opacity-60 cursor-not-allowed"
                >
                  <option value="global">All Products (Global)</option>
                </select>
              </div>
            </div>
            {discountConfig.enabled && (
              <p className="mt-4 text-xs text-[#c89a51]">
                Note: Active discounts are clearly displayed in the product catalog and automatically applied at checkout.
              </p>
            )}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredProducts.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                categoryLabel={categoryLookup[product.category].label[locale]}
                addLabel={t.addToCart}
                detailsLabel={t.viewDetails}
                newLabel={t.newTag}
                isAdmin={!!sessionUser}
                onAddToCart={addToCart}
                onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                outOfStockLabel={t.outOfStock}
                isWishlisted={isInWishlist(product.id)}
                onWishlistToggle={toggleWishlist}
                onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                discountedPrice={getDiscountedPrice(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] py-20 text-center">
            <div className="mb-4 text-4xl opacity-50">🔍</div>
            <h3 className="mb-2 text-xl font-medium text-[var(--text-primary)]">{t.noProducts}</h3>
            <p className="text-[var(--text-muted)]">{t.startShopping}</p>
          </div>
        )}
      </div>
    </section>
  );

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) {
      showNotice("error", locale === "ar" ? "السلة فارغة" : "Cart is empty");
      return;
    }

    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    let message = `*VOLCANO ORDER - ${orderId}*\n\n`;

    cartLines.forEach((line) => {
      message += `• ${line.product.name.en} / ${line.product.name.ar}\n`;
      message += `  Qty: ${line.quantity} | Total: ${formatCurrency("en", line.lineTotal)}\n\n`;
    });

    const total = cartSubtotal > 0 ? cartSubtotal + 45 : 0;
    message += `*Subtotal:* ${formatCurrency("en", cartSubtotal)}\n`;
    message += `*Shipping:* ${formatCurrency("en", 45)}\n`;
    message += `*TOTAL:* ${formatCurrency("en", total)}\n\n`;
    message += `Please provide your Name, Address, and Phone Number below to confirm this order.`;

    const encodedMessage = encodeURIComponent(message);
    const waNumber = "201015694389";

    if (sessionUser) {
      const newOrder: Order = {
        id: orderId,
        date: new Date().toISOString(),
        items: [...cart],
        total,
        status: "pending"
      };

      const updatedUser: SessionUser = {
        ...sessionUser,
        orders: [newOrder, ...(sessionUser.orders || [])]
      };

      setSessionUser(updatedUser);
      setStoredUsers((prev) =>
        prev.map(u => u.email === updatedUser.email ? { ...u, orders: updatedUser.orders } : u)
      );
    }

    setCart([]);
    window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, "_blank");
  };
  const handleToggleStock = (productId: number) => {
    setCustomProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: p.inStock === false ? true : false } : p))
    );
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div className={cn("min-h-screen transition-colors duration-300", "bg-[var(--volcano-bg)] text-[var(--text-primary)]")} dir={isArabic ? "rtl" : "ltr"}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-12 h-72 w-72 rounded-full bg-[#c89a51]/10 blur-3xl" />
          <div className="absolute bottom-0 right-[8%] h-80 w-80 rounded-full bg-[#8f622f]/12 blur-3xl" />
        </div>

        <header className="relative z-50 border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-xl sticky top-0">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <a href="#/" aria-label="Volcano home" className="shrink-0">
                <BrandLogo locale={locale} compact />
              </a>

              {/* Search — hidden on mobile, shown on md+ */}
              <div className="hidden flex-1 md:block md:max-w-md lg:max-w-xl relative">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-full border border-[var(--volcano-border)] bg-[var(--input-bg)] px-5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[#c89a51]"
                  />
                  <span className="absolute inset-y-0 right-5 flex items-center text-sm text-[var(--text-muted)]">⌕</span>
                </div>
                <SearchDropdown
                  results={searchResults}
                  locale={locale}
                  visible={searchFocused && search.trim().length >= 2}
                  onSelect={(id) => {
                    setSearchFocused(false);
                    setSearch("");
                    navigate(`/product/${id}`);
                  }}
                  onClose={() => setSearchFocused(false)}
                  formatPrice={formatCurrency}
                />
              </div>

              {/* Desktop actions */}
              <div className="hidden items-center gap-2 md:flex">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="rounded-full border border-[var(--volcano-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f1ce8a] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10"
                >
                  {locale === "en" ? "AR" : "EN"}
                </button>
                <a href="#/wishlist" className="rounded-full border border-[var(--volcano-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10">
                  ♥ {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                </a>
                {sessionUser ? (
                  <button
                    type="button"
                    onClick={() => { logout(); }}
                    className="rounded-full border border-[var(--input-border)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition hover:border-[#c89a51]/70 hover:text-[#f1ce8a]"
                  >
                    {t.logout}
                  </button>
                ) : (
                  <a
                    href="#/login"
                    className="rounded-full border border-[var(--input-border)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition hover:border-[#c89a51]/70 hover:text-[#f1ce8a]"
                  >
                    {t.login}
                  </a>
                )}
                <a
                  href="#/cart"
                  className={cn("rounded-full border border-[var(--volcano-border)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10", cartBounce && "cart-bounce")}
                >
                  {t.cart} ({totalItems})
                </a>
              </div>

              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="rounded-full border border-[#c89a51]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f1ce8a] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10"
                >
                  {locale === "en" ? "AR" : "EN"}
                </button>
                <a
                  href="#/cart"
                  className={cn("relative p-2 text-[var(--text-primary)]", cartBounce && "cart-bounce")}
                >
                  <span className="text-xl">🛒</span>
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c89a51] text-[10px] font-bold text-black">
                      {totalItems}
                    </span>
                  )}
                </a>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((o) => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--volcano-border)] text-[var(--text-primary)] transition hover:bg-[#c89a51]/10"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? "✕" : "☰"}
                </button>
              </div>
            </div>

            {/* Mobile search bar */}
            <div className="mt-3 md:hidden relative">
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-full border border-[var(--volcano-border)] bg-[var(--input-bg)] px-5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[#c89a51]"
                />
                <span className="absolute inset-y-0 right-5 flex items-center text-sm text-[var(--text-muted)]">⌕</span>
              </div>
              <SearchDropdown
                results={searchResults}
                locale={locale}
                visible={searchFocused && search.trim().length >= 2}
                onSelect={(id) => {
                  setSearchFocused(false);
                  setSearch("");
                  navigate(`/product/${id}`);
                }}
                onClose={() => setSearchFocused(false)}
                formatPrice={formatCurrency}
              />
            </div>

            {/* Desktop Navigation */}
            <div className="mt-3 hidden md:flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-transparent px-4 py-1.5 text-xs font-medium uppercase tracking-wider opacity-70 transition hover:border-[#c89a51]/30 hover:bg-[#c89a51]/8 hover:opacity-100 hover:text-[#c89a51]"
                >
                  {link.label}
                </a>
              ))}
              {sessionUser ? (
                <span className="ml-auto rounded-full border border-[#c89a51]/20 bg-[#c89a51]/10 px-4 py-1.5 text-xs uppercase tracking-wider text-[#f3d49a]">
                  {t.welcome} · {sessionUser.name}
                </span>
              ) : null}
            </div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
              <div className="mobile-menu-overlay mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-3 md:hidden">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-[#c89a51]/10 hover:text-[#c89a51]"
                  >
                    {link.label}
                  </a>
                ))}
                <a href="#/wishlist" className="block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-[#c89a51]/10 hover:text-[#c89a51]">
                  ♥ {locale === "ar" ? "المفضلة" : "Wishlist"}
                </a>
                {sessionUser ? (
                  <button type="button" onClick={logout} className="block w-full text-left rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-rose-500/10 hover:text-rose-400">
                    {t.logout}
                  </button>
                ) : (
                  <a href="#/login" className="block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-[#c89a51]/10 hover:text-[#c89a51]">
                    {t.login}
                  </a>
                )}
                <div className="flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm font-medium">{isDark ? (locale === "ar" ? "الوضع الداكن" : "Dark Mode") : (locale === "ar" ? "الوضع الفاتح" : "Light Mode")}</span>
                  <ThemeToggle isDark={isDark} onToggle={toggleTheme} compact />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {notice ? (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm fade-in ${notice.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
                }`}
            >
              {notice.message}
            </div>
          ) : null}

          {route === "/" ? (
            <section className="space-y-16 fade-in">
              <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
                <div className="panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                  <div className="mb-5 inline-flex rounded-full border border-[#c89a51]/20 bg-[#c89a51]/8 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#f1ce8a]">
                    {t.heroBadge}
                  </div>
                  <div className="mb-6 float-slow inline-block">
                    <BrandLogo locale={locale} />
                  </div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl text-inherit">
                    {t.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 opacity-80">{t.heroText}</p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <a
                      href="#/products"
                      className="glow-button inline-flex justify-center rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black"
                    >
                      {t.shopNow}
                    </a>
                    <a
                      href="#/category/accessories"
                      className="inline-flex justify-center rounded-full border border-[#c89a51]/30 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10 text-inherit"
                    >
                      {t.discoverCollections}
                    </a>
                  </div>
                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {[
                      { value: "05", label: t.categories },
                      { value: "🚚", label: t.fastDelivery },
                      { value: "+20K", label: locale === "ar" ? "شخص يثق في منتجاتنا" : "Customers trust us" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1.5rem] border border-[#c89a51]/20 bg-[#c89a51]/[0.05] p-4">
                        <div className="text-2xl font-semibold text-gold-gradient">{item.value}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.24em] opacity-60">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {popularProducts.slice(0, 3).map((product) => (
                    <a
                      key={product.id}
                      href={`#/product/${product.id}`}
                      className="panel hover-lift flex items-center gap-4 rounded-[1.8rem] p-4"
                    >
                      <img src={product.image} alt={product.name[locale]} className="h-24 w-24 rounded-[1.2rem] object-cover" />
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">
                          {categoryLookup[product.category].label[locale]}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-inherit">{product.name[locale]}</h3>
                        <p className="mt-2 text-sm opacity-60">{formatCurrency(locale, product.price)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <section className="space-y-6" data-reveal="true">
                <PageHeader eyebrow={t.popular} title={t.featured} description={t.categoryIntro} />
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      categoryLabel={categoryLookup[product.category].label[locale]}
                      addLabel={t.addToCart}
                      detailsLabel={t.viewDetails}
                      newLabel={t.newTag}
                      isAdmin={!!sessionUser}
                      onAddToCart={addToCart}
                      onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                      onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                      outOfStockLabel={t.outOfStock}
                      isWishlisted={isInWishlist(product.id)}
                      onWishlistToggle={toggleWishlist}
                      onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                      discountedPrice={getDiscountedPrice(product)}
                    />
                  ))}
                </div>
              </section>

              {/* Best Sellers Section */}
              <section className="space-y-6" data-reveal="true">
                <PageHeader eyebrow="Top Rated" title={t.bestSellers} description={t.bestSellersDesc} />
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {bestSellers.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      categoryLabel={categoryLookup[product.category].label[locale]}
                      addLabel={t.addToCart}
                      detailsLabel={t.viewDetails}
                      newLabel={t.newTag}
                      isAdmin={!!sessionUser}
                      onAddToCart={addToCart}
                      onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                      onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                      outOfStockLabel={t.outOfStock}
                      isWishlisted={isInWishlist(product.id)}
                      onWishlistToggle={toggleWishlist}
                      onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                      discountedPrice={getDiscountedPrice(product)}
                    />
                  ))}
                </div>
              </section>

              {/* New Arrivals Section */}
              <section className="space-y-6" data-reveal="true">
                <PageHeader eyebrow="Just Dropped" title={t.newArrivals} description={t.newArrivalsDesc} />
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {newArrivals.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      categoryLabel={categoryLookup[product.category].label[locale]}
                      addLabel={t.addToCart}
                      detailsLabel={t.viewDetails}
                      newLabel={t.newTag}
                      isAdmin={!!sessionUser}
                      onAddToCart={addToCart}
                      onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                      onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                      outOfStockLabel={t.outOfStock}
                      isWishlisted={isInWishlist(product.id)}
                      onWishlistToggle={toggleWishlist}
                      onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                      discountedPrice={getDiscountedPrice(product)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-6" data-reveal="true">
                <PageHeader eyebrow={t.categories} title={t.exploreCategories} description={t.categoryIntro} />
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                  {categories.map((category, index) => (
                    <a
                      key={category.key}
                      href={`#/category/${category.key}`}
                      className="panel hover-lift rounded-[1.8rem] p-6"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c89a51]/25 bg-[#c89a51]/10 text-2xl text-[#f3d49a]">
                        {category.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{category.label[locale]}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{category.blurb[locale]}</p>
                    </a>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <PageHeader eyebrow="Volcano" title={t.whyVolcano} description={t.footerText} />
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { title: t.premiumCraft, text: t.premiumCraftText },
                    { title: t.fastDelivery, text: t.fastDeliveryText },
                    { title: t.bilingual, text: t.bilingualText },
                  ].map((item) => (
                    <div key={item.title} className="panel rounded-[1.8rem] p-6">
                      <div className="mb-4 inline-flex rounded-full border border-[#c89a51]/20 bg-[#c89a51]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#f3d49a]">
                        Volcano
                      </div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 opacity-75">{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : null}

          {route === "/products" ? renderCatalog(t.allCollections, t.products) : null}

          {categoryFromRoute ? renderCatalog(categoryLookup[categoryFromRoute].label[locale], t.categories) : null}

          {route === "/categories" ? (
            <section className="space-y-8 fade-in">
              <PageHeader
                eyebrow={t.categories}
                title={locale === "ar" ? "استكشف الأقسام" : "Browse Categories"}
                description={t.categoryIntro}
              />
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4" style={{ scrollPaddingLeft: "1rem" }}>
                {categories.map((cat, index) => {
                  const catProducts = allProducts.filter((p) => p.category === cat.key);
                  const preview = catProducts[0];
                  return (
                    <a
                      key={cat.key}
                      href={`#/category/${cat.key}`}
                      className="panel hover-lift group snap-start shrink-0 flex flex-col overflow-hidden rounded-[2rem] w-[80vw] sm:w-[45vw] lg:w-[32%] xl:w-[28%] transition"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="relative h-52 overflow-hidden rounded-t-[2rem] bg-[#c89a51]/10">
                        {preview ? (
                          <img
                            src={preview.image}
                            alt={cat.label[locale]}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">{cat.icon}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <span className="absolute bottom-4 left-4 text-3xl font-bold text-white">{cat.icon}</span>
                        <span className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-[#f3d49a] backdrop-blur-md">
                          {catProducts.length} {locale === "ar" ? "منتج" : "items"}
                        </span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{cat.label[locale]}</h3>
                          <p className="mt-2 text-sm opacity-70 leading-6">{cat.blurb[locale]}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-[#c89a51] font-semibold uppercase tracking-widest">
                          <span>{locale === "ar" ? "تصفح" : "Browse"}</span>
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          {route === "/cart" ? (
            <section className="space-y-8 fade-in">
              <PageHeader eyebrow={t.featuredCart} title={t.cart} description={t.emptyCart} />
              <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  {cartLines.length ? (
                    cartLines.map((line) => (
                      <div key={line.productId} className="panel flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center">
                        <img src={line.product.image} alt={line.product.name[locale]} className="h-28 w-full rounded-[1.5rem] object-cover sm:w-28" />
                        <div className="flex-1 space-y-2">
                          <p className="text-xs uppercase tracking-[0.26em] text-[#c89a51]">
                            {categoryLookup[line.product.category].label[locale]}
                          </p>
                          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{line.product.name[locale]}</h3>
                          <p className="text-sm text-[var(--text-muted)]">{formatCurrency(locale, line.product.price)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                            className="h-10 w-10 rounded-full border border-[var(--input-border)] text-lg text-[var(--text-primary)] transition hover:border-[#c89a51]/60"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-[var(--text-primary)]">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                            className="h-10 w-10 rounded-full border border-[var(--input-border)] text-lg text-[var(--text-primary)] transition hover:border-[#c89a51]/60"
                          >
                            +
                          </button>
                        </div>
                        <div className="space-y-3 text-right">
                          <p className="text-base font-semibold text-[#f3d49a]">{formatCurrency(locale, line.lineTotal)}</p>
                          <button
                            type="button"
                            onClick={() => removeFromCart(line.productId)}
                            className="text-sm text-rose-300 transition hover:text-rose-200"
                          >
                            {t.removed}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title={t.emptyCart} actionLabel={t.continueShopping} />
                  )}
                </div>

                <aside className="panel h-fit rounded-[2rem] p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c89a51]">{t.summary}</p>
                  <div className="mt-6 space-y-4 border-t border-white/8 pt-6 text-sm opacity-80">
                    <div className="flex items-center justify-between">
                      <span>{t.items}</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.subtotal}</span>
                      <span>{formatCurrency(locale, cartSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.shipping}</span>
                      <span>{formatCurrency(locale, cartSubtotal > 0 ? 45 : 0)}</span>
                    </div>
                  </div>
                  <div className="mt-6 rounded-[1.5rem] border border-[#c89a51]/18 bg-[#c89a51]/10 p-4">
                    <div className="flex items-center justify-between text-base font-semibold text-inherit">
                      <span>{t.checkout}</span>
                      <span>{formatCurrency(locale, cartSubtotal > 0 ? cartSubtotal + 45 : 0)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="glow-button mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black"
                  >
                    {t.whatsappCheckout} 💬
                  </button>
                </aside>
              </div>
            </section>
          ) : null}

          {route === "/login" ? (
            <section className="mx-auto max-w-3xl fade-in">
              <div className="panel rounded-[2rem] p-6 sm:p-8">
                <PageHeader eyebrow={t.account} title={t.loginTitle} description={t.authDescription} />
                <form onSubmit={handleLogin} className="grid gap-5">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.email}</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.password}</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <button type="submit" className="glow-button rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black">
                    {t.login}
                  </button>
                </form>
                <p className="mt-6 text-sm opacity-60">
                  {t.noAccount} <a href="#/register" className="text-[#c89a51] hover:underline">{t.register}</a>
                </p>
              </div>
            </section>
          ) : null}

          {route === "/register" ? (
            <section className="mx-auto max-w-3xl fade-in">
              <div className="panel rounded-[2rem] p-6 sm:p-8">
                <PageHeader eyebrow={t.account} title={t.registerTitle} description={t.authDescription} />
                <form onSubmit={handleRegister} className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.name}</label>
                    <input
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.email}</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.password}</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.24em] text-[#c89a51]">{t.confirmPassword}</label>
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      required
                      className="w-full rounded-[1.4rem] border border-white/10 bg-black/35 px-4 py-4 text-sm outline-none transition focus:border-[#c89a51]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="glow-button w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black">
                      {t.register}
                    </button>
                  </div>
                </form>
                <div className="mt-6 rounded-[1.5rem] border border-[#c89a51]/20 bg-[#c89a51]/10 p-4 text-sm text-inherit">
                  <p className="leading-7 opacity-80">{t.authNote}</p>
                </div>
                <p className="mt-6 text-sm opacity-60">
                  {t.haveAccount} <a href="#/login" className="text-[#c89a51] hover:underline">{t.login}</a>
                </p>
              </div>
            </section>
          ) : null}

          {route === "/orders" ? (
            <section className="mx-auto max-w-4xl fade-in space-y-8">
              <PageHeader eyebrow={t.account} title={t.orderHistory} description={t.orders} />

              {!sessionUser ? (
                <div className="panel rounded-[2rem] p-8 text-center">
                  <p className="text-lg text-[var(--text-primary)]">{t.loginTitle}</p>
                  <a href="#/login" className="glow-button mt-6 inline-block rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-widest text-black">
                    {t.login}
                  </a>
                </div>
              ) : !sessionUser.orders || sessionUser.orders.length === 0 ? (
                <EmptyState title={t.noOrders} actionLabel={t.startShopping} />
              ) : (
                <div className="grid gap-6">
                  {sessionUser.orders.map((order) => (
                    <div key={order.id} className="panel flex flex-col gap-4 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{t.orderNo} {order.id}</span>
                          <span className="rounded-full bg-[#c89a51]/20 px-3 py-1 text-xs font-medium text-[#c89a51]">
                            {order.status === "pending" ? t.statusPending : order.status === "shipped" ? t.statusShipped : t.statusDelivered}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">{t.orderDate}: {new Date(order.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{t.orderTotal}: {formatCurrency(locale, order.total)}</p>
                      </div>

                      <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <img
                            key={`${order.id}-${item.productId}-${idx}`}
                            src={categoryLookup[allProducts.find(p => p.id === item.productId)?.category as keyof typeof categoryLookup]?.icon ? "" : allProducts.find(p => p.id === item.productId)?.image}
                            className="h-12 w-12 rounded-full border-2 border-[var(--panel-bg)] object-cover bg-black"
                            alt="product thumbnail"
                          />
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--panel-bg)] bg-[#c89a51]/20 text-xs font-bold text-[#c89a51]">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {route.startsWith("/product/") ? (
            currentProduct ? (
              <section className="space-y-10 fade-in">
                <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
                  <div className="panel overflow-hidden rounded-[2rem] p-4 sm:p-6 relative group">
                    <ImageZoom src={currentProduct.image} alt={currentProduct.name[locale]} />
                    <div className="absolute right-8 top-8 z-10">
                      <WishlistButton
                        isActive={isInWishlist(currentProduct.id)}
                        onToggle={() => toggleWishlist(currentProduct.id)}
                        size="md"
                      />
                    </div>
                  </div>
                  <div className="panel rounded-[2rem] p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#c89a51]">
                      {categoryLookup[currentProduct.category].label[locale]}
                    </p>
                    <h1 className="mt-4 text-4xl font-semibold text-inherit">{currentProduct.name[locale]}</h1>
                    <p className="mt-5 text-base leading-8 opacity-80">{currentProduct.description[locale]}</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      {getDiscountedPrice(currentProduct) != null && getDiscountedPrice(currentProduct)! < currentProduct.price ? (
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-[#c89a51]/22 bg-[#c89a51]/10 px-5 py-3 text-lg font-semibold text-[#c89a51]">
                            {formatCurrency(locale, getDiscountedPrice(currentProduct)!)}
                          </span>
                          <span className="text-sm line-through opacity-50">{formatCurrency(locale, currentProduct.price)}</span>
                          <span className="discount-badge">{locale === "ar" ? "خصم" : "SALE"}</span>
                        </div>
                      ) : (
                        <span className="rounded-full border border-[var(--volcano-border)] bg-[#c89a51]/10 px-5 py-3 text-lg font-semibold text-[#c89a51]">
                          {formatCurrency(locale, currentProduct.price)}
                        </span>
                      )}
                      <span className="rounded-full border border-[var(--border-subtle)] px-4 py-3 text-sm opacity-80">★ {currentProduct.rating.toFixed(1)}</span>
                    </div>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                      <button
                        type="button"
                        disabled={currentProduct.inStock === false}
                        onClick={(e) => {
                          if (currentProduct.inStock !== false) {
                            addToCart(currentProduct.id, e);
                          }
                        }}
                        className={`flex-1 rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition ${currentProduct.inStock === false
                            ? "bg-stone-500/20 text-stone-400 cursor-not-allowed border border-stone-500/20"
                            : "glow-button text-black"
                          }`}
                      >
                        {currentProduct.inStock === false ? t.outOfStock : t.addToCart}
                      </button>
                      {sessionUser?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(currentProduct.id)}
                          className="flex-1 rounded-full border border-rose-500/30 bg-rose-500/5 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500"
                        >
                          {locale === "ar" ? "حذف المنتج" : "Delete Product"}
                        </button>
                      )}
                      <a
                        href="#/cart"
                        className="flex-1 rounded-full border border-[var(--volcano-border)] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-[#c89a51] hover:bg-[#c89a51]/10 text-inherit"
                      >
                        {t.cart}
                      </a>
                    </div>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                      {[
                        { label: t.artisan, value: "Curated" },
                        { label: t.shipping, value: "24-72h" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                          <p className="text-sm opacity-60">{item.label}</p>
                          <p className="mt-2 text-lg font-semibold text-inherit">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <section className="space-y-6">
                  <PageHeader eyebrow={t.related} title={t.related} description={t.categoryIntro} />
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {relatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        categoryLabel={categoryLookup[product.category].label[locale]}
                        addLabel={t.addToCart}
                        detailsLabel={t.viewDetails}
                        newLabel={t.newTag}
                        isAdmin={!!sessionUser}
                        onAddToCart={addToCart}
                        onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                        onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                        outOfStockLabel={t.outOfStock}
                        isWishlisted={isInWishlist(product.id)}
                        onWishlistToggle={toggleWishlist}
                        onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                        discountedPrice={getDiscountedPrice(product)}
                      />
                    ))}
                  </div>
                </section>
                {/* Sticky Mobile CTA */}
                <div className="sticky-mobile-cta">
                  <button
                    type="button"
                    disabled={currentProduct.inStock === false}
                    onClick={(e) => {
                      if (currentProduct.inStock !== false) {
                        addToCart(currentProduct.id, e);
                      }
                    }}
                    className={`flex-1 rounded-full px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${currentProduct.inStock === false
                        ? "bg-stone-500/20 text-stone-400 cursor-not-allowed border border-stone-500/20"
                        : "glow-button text-black"
                      }`}
                  >
                    {currentProduct.inStock === false ? t.outOfStock : t.addToCart}
                  </button>
                  <WishlistButton
                    isActive={isInWishlist(currentProduct.id)}
                    onToggle={() => toggleWishlist(currentProduct.id)}
                    size="md"
                  />
                </div>
              </section>
            ) : (
              <EmptyState title={t.pageNotFound} actionLabel={t.backHome} />
            )
          ) : null}

          {route === "/wishlist" ? (
            <section className="space-y-8 fade-in">
              <PageHeader
                eyebrow={locale === "ar" ? "المفضلة" : "Wishlist"}
                title={locale === "ar" ? "منتجاتك المفضلة" : "Your Saved Items"}
                description=""
              />
              {wishlistItems.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {wishlistItems.map((id) => {
                    const product = allProducts.find(p => p.id === id);
                    if (!product) return null;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        categoryLabel={categoryLookup[product.category].label[locale]}
                        addLabel={t.addToCart}
                        detailsLabel={t.viewDetails}
                        newLabel={t.newTag}
                        isAdmin={!!sessionUser}
                        onAddToCart={addToCart}
                        onDelete={sessionUser?.role === "admin" ? handleDeleteProduct : undefined}
                        onToggleStock={sessionUser?.role === "admin" ? handleToggleStock : undefined}
                        outOfStockLabel={t.outOfStock}
                        isWishlisted={true}
                        onWishlistToggle={toggleWishlist}
                        onQuickView={(id) => setQuickViewProduct(allProducts.find(p => p.id === id) || null)}
                        discountedPrice={getDiscountedPrice(product)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState title={locale === "ar" ? "المفضلة فارغة" : "Your Wishlist is Empty"} actionLabel={t.startShopping} />
              )}
            </section>
          ) : null}

          {![
            "/",
            "/products",
            "/cart",
            "/login",
            "/register",
            "/wishlist"
          ].includes(route) && !route.startsWith("/category/") && !route.startsWith("/product/") ? (
            <EmptyState title={t.pageNotFound} actionLabel={t.backHome} />
          ) : null}
        </main>

        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            locale={locale}
            categoryLabel={categoryLookup[quickViewProduct.category].label[locale]}
            addLabel={t.addToCart}
            onAddToCart={(id) => {
              addToCart(id);
              setQuickViewProduct(null);
            }}
            onClose={() => setQuickViewProduct(null)}
          />
        )}

        {cartAnim && (
          <CartAnimation
            productImage={cartAnim.image}
            startPos={cartAnim.pos}
            onComplete={() => setCartAnim(null)}
          />
        )}

        <footer className="relative z-10 border-t border-white/6 bg-black/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_0.4fr_0.4fr_0.4fr] lg:px-8">
            <div>
              <BrandLogo locale={locale} compact={false} withTagline />
              <p className="mt-4 max-w-xl text-sm leading-7 opacity-60">{t.footerText}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c89a51]">{t.categories}</p>
              <div className="mt-4 space-y-3 text-sm opacity-80">
                {categories.map((category) => (
                  <a key={category.key} href={`#/category/${category.key}`} className="block transition hover:text-[#f3d49a]">
                    {category.label[locale]}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c89a51]">Volcano</p>
              <div className="mt-4 space-y-3 text-sm opacity-80">
                <a href="#/products" className="block transition hover:text-[#f3d49a]">{t.products}</a>
                <a href="#/cart" className="block transition hover:text-[#f3d49a]">{t.cart}</a>
                <a href="#/login" className="block transition hover:text-[#f3d49a]">{t.login}</a>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c89a51]">{locale === "en" ? "Social Media" : "تواصل معنا"}</p>
              <div className="mt-4 space-y-3 text-sm opacity-80">
                <a href="https://www.facebook.com/profile.php?id=61566429900041" target="_blank" rel="noopener noreferrer" className="block transition hover:text-[#f3d49a]">فيسبوك / Facebook</a>
                <a href="https://www.instagram.com/volcanostore.v/" target="_blank" rel="noopener noreferrer" className="block transition hover:text-[#f3d49a]">انستاجرام / Instagram</a>
                <a href="https://www.tiktok.com/@volcano_store369?fbclid=IwY2xjawQcX4JleHRuA2FlbQIxMABicmlkETFBWkx6d3lKd2xUYm1qaGxOc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHnah_22eZ4b728-d0h1OQwOXSKp6NtjBJdTs7h27qDqD2E48Bd63Jbyb8Pd__aem_Ji3hEbUBrwHoNf_DcFNZjQ" target="_blank" rel="noopener noreferrer" className="block transition hover:text-[#f3d49a]">تيك توك / TikTok</a>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 border-t border-white/5">
            <p className="text-center text-[0.7rem] tracking-[0.15em] text-[var(--text-secondary)] opacity-40">
              Made with <span className="text-[#c89a51]">♥</span> by Youssef Helmy
            </p>
          </div>
        </footer>

        {/* WhatsApp Order Form Modal */}
        {showOrderForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="panel rounded-[2rem] w-full max-w-lg p-6 sm:p-8 fade-in">
              <h2 className="text-xl font-semibold text-[#c89a51] mb-6">{t.checkoutTitle}</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const orderLines = cart.map((item) => {
                    const p = allProducts.find((x) => x.id === item.productId);
                    if (!p) return null;
                    const lineTotal = p.price * item.quantity;
                    return `%E2%80%A2 ${p.name[locale]} x${item.quantity} = ${formatCurrency(locale, lineTotal)}`;
                  }).filter(Boolean).join("%0A");
                  const total = formatCurrency(locale, cartSubtotal + (cartSubtotal > 0 ? 45 : 0));
                  const msg = [
                    "New Order from Volcano Store! %F0%9F%94%A5",
                    `Customer: ${orderForm.name}`,
                    `Address: ${orderForm.address}`,
                    `Phones: ${orderForm.phone} / ${orderForm.phone2}`,
                    `Items:%0A${orderLines}`,
                    `Total: ${total} EGP`,
                  ].join("%0A");
                  window.open(`https://wa.me/201005246318?text=${msg}`, "_blank");
                  setShowOrderForm(false);
                }}
                className="grid gap-4"
              >
                {[
                  { key: "name" as const, label: t.orderName },
                  { key: "address" as const, label: t.orderAddress },
                  { key: "phone" as const, label: t.orderPhone },
                  { key: "phone2" as const, label: t.orderPhone2 },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-[#c89a51]">{label}</label>
                    <input
                      required
                      value={orderForm[key]}
                      onChange={(e) => setOrderForm((cur) => ({ ...cur, [key]: e.target.value }))}
                      className="theme-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none transition"
                    />
                  </div>
                ))}
                <div className="mt-2 flex gap-3">
                  <button type="submit" className="glow-button flex-1 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-widest">
                    {t.confirmOrder} 💬
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="flex-1 rounded-full border border-[#c89a51]/30 px-5 py-3 text-sm opacity-70 hover:opacity-100 transition"
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
