import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- التعديل هنا: الرابط الجديد بتاعك من مونجو أطلس ---
const MONGODB_URI = process.env.MONGODB_URI;
// --------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["accessories", "bags", "rings", "earrings", "necklaces"],
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Routes
app.get("/api/products", async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

app.get("/api/products/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch category products", error: error.message });
  }
});

app.delete("/api/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

app.post("/api/products", authMiddleware, adminMiddleware, upload.single("imageFormFile"), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!req.file) return res.status(400).json({ message: "Please upload an image" });
    const imagePath = `/uploads/${req.file.filename}`;
    const product = await Product.create({ name, description, price, category, image: imagePath });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: "Invalid credentials" });
    const token = signToken(user);
    return res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) { return res.status(500).json({ message: "Login failed" }); }
});

async function seedAdminAndProducts() {
  const existingAdmin = await User.findOne({ email: "admin@volcano.com" });
  if (!existingAdmin) {
    const password = await bcrypt.hash("Admin123!", 10);
    await User.create({ name: "Volcano Admin", email: "admin@volcano.com", password, role: "admin" });
    console.log("Admin seeded successfully!");
  }
}

async function startServer() {
  try {
    // الاتصال بمونجو أطلس
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB Atlas!");

    await seedAdminAndProducts();
    app.listen(PORT, () => {
      console.log(`Volcano backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start backend", error);
    process.exit(1);
  }
}

startServer();