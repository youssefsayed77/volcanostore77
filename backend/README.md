# Volcano Backend API

This folder contains the Express + MongoDB API for the Volcano accessories store.

## Features

- Register
- Login
- Get all products
- Get products by category
- Add to cart
- Admin product creation

## Environment setup

1. Copy `.env.example` to `.env`
2. Update the MongoDB connection string and JWT secret

## Run locally

```bash
node backend/server.js
```

The API runs on `http://localhost:5000` by default.

## Demo admin

- Email: `admin@volcano.com`
- Password: `Admin123!`

## Important routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/category/:category`
- `POST /api/cart`
- `POST /api/products` (admin only)
