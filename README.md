# Tech Store — React + Firebase Marketplace

## Overview
Tech Store is a full-stack e-commerce playground that combines a React 18 front-end with a lightweight Express API backed by Firebase Realtime Database and Firebase Storage. It supports multiple user roles (customers, sellers, and admins), real-time catalog management, order processing, and role-aware dashboards. The project is currently optimized for rapid prototyping and can be deployed as a static front-end (Create React App) plus a serverless Express API.

## Feature Highlights
- **Omnichannel product catalog**: Customers can browse, search, filter, and sort curated tech products with cached responses for faster loads.
- **Shopping cart & order workflow**: End-to-end cart management with quantity updates, order placement, and automatic total calculation.
- **Role-based access control**: Authentication via Firebase Auth with contextual routing for admins, sellers, and customers.
- **Seller workspace**: Sellers can upload images to Firebase Storage, manage personal inventory, and edit or remove listings.
- **Admin command center**: Admins can enrich the global catalog, categorize items, and moderate orders directly from the dashboard.
- **Comprehensive REST API**: Express endpoints expose CRUD operations for products, categories, carts, and orders with server-side caching.

## Tech Stack
- **React 18** with **React Router v6** for SPA routing and role-aware navigation
- **Firebase** (Auth, Realtime Database, Storage) for identity and data persistence
- **Express 4** hosted as a Serverless Function (Vercel-compatible) for REST APIs
- **Create React App** toolchain with `react-scripts`
- **Cross-env** for portable build variables (e.g., disabling CRA ESLint in production builds)

## Architecture at a Glance
```
┌────────────────────────────────────────┐
│                 Client                 │
│  React SPA (CRA)                       │
│  • Role-aware routes                   │
│  • Fetches data from Express API       │
│  • Firebase Auth state via context     │
└───────────────▲────────────────────────┘
                │ REST + HTTPS
┌───────────────┴────────────────────────┐
│              Express API                │
│  Location: src/back/server.js           │
│  • Products, categories, cart, orders   │
│  • Firebase SDK (client SDK)            │
│  • Simple in-memory caching             │
└───────────────▲────────────────────────┘
                │ Firebase SDK
┌───────────────┴────────────────────────┐
│            Firebase Services            │
│  • Realtime Database (data)             │
│  • Storage (product images)             │
│  • Auth (email & password)              │
└─────────────────────────────────────────┘
```

## Project Structure
```text
.
├── api/
│   └── index.js                # Serverless entry (e.g., Vercel) -> Express app
├── public/                     # CRA public assets
├── src/
│   ├── App.js                  # Route definitions
│   ├── Authentication/         # Auth flows, context, protected routes
│   ├── back/server.js          # Express API (runs via `npm run server`)
│   ├── comp/                   # Shared UI components
│   ├── page/                   # Feature pages (Home, Cart, Admin, Seller, Order)
│   ├── asserts/                # Static images & styles (CSS)
│   ├── index.js                # CRA bootstrap
│   └── reportWebVitals.js
├── package.json
└── README.md
```

## Getting Started

### 1. Prerequisites
- **Node.js 18** or newer and **npm**
- A Firebase project with:
  - **Email/Password Authentication** enabled
  - **Realtime Database** (in **Realtime Database** mode, not Firestore) with read/write rules configured for your use case
  - **Firebase Storage** for product image uploads

### 2. Configure Firebase credentials
Firebase configuration values are currently duplicated across several files. Replace the placeholder configuration with your project-specific values in **all** of the following files:
- `src/Authentication/Auth.jsx`
- `src/Authentication/Authpro.jsx`
- `src/comp/Navbar.jsx`
- `src/page/Admin.jsx`
- `src/page/Home.jsx`
- `src/page/Order.jsx`
- `src/page/Seller.jsx`

> **Recommendation**: Centralize the configuration in a dedicated module (e.g., `src/firebaseConfig.js`) or load values from environment variables (`REACT_APP_FIREBASE_*`) to avoid drift.

Example centralized module:
```javascript
// src/firebaseConfig.js
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run the development servers
1. **Front-end (React)**
   ```bash
   npm start
   ```
   This launches CRA at `http://localhost:3000`.

2. **Express API (optional local run)**
   ```bash
   npm run server
   ```
   The API listens on `http://localhost:5000` by default (see `src/back/server.js`). When deployed to Vercel, the same server is exposed via `api/index.js`.

> **Note**: The front-end currently targets the deployed base URL `https://tech-store-txuf.onrender.com` for many requests. If you run the API locally, update the fetch base URLs or introduce an environment variable to switch between environments.

### 5. Build for production
```bash
npm run build
```
Artifacts are output to the `build/` directory and can be hosted on any static site provider.

### 6. Testing
```bash
npm test
```
Runs Jest + React Testing Library in watch mode (no custom tests included yet).

## Backend API Reference
Base URL (production): `https://tech-store-txuf.onrender.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/initial-data` | Fetch products and categories in a single request (with caching).
| GET | `/api/products` | List products (arrays normalized with shared shape).
| POST | `/api/products` | Create a product (requires `name`, `price`, `categoryId`; optional `sellerId`, `imageUrl`).
| PUT | `/api/products/:id` | Update product fields.
| DELETE | `/api/products/:id` | Remove a product.
| GET | `/api/categories` | Retrieve all categories.
| POST | `/api/categories` | Create a new category (`name` required).
| PUT | `/api/categories/:id` | Update category metadata.
| DELETE | `/api/categories/:id` | Delete a category.
| GET | `/api/cart/:cartId` | Fetch cart contents.
| POST | `/api/cart/:cartId/add` | Add an item to a cart.
| PUT | `/api/cart/:cartId/items/:productId` | Update item quantity.
| DELETE | `/api/cart/:cartId/items/:productId` | Remove an item.
| DELETE | `/api/cart/:cartId` | Clear cart contents.
| POST | `/api/orders` | Place an order from a cart (`cartId`, `customerName`, `table`, `restaurantId`).
| GET | `/api/orders` | List all orders (admins see every order; sellers filtered by sellerId).
| PUT | `/api/orders/:orderId/status` | Update order status (e.g., mark as `done`).

Sample cart request:
```bash
curl -X POST "https://tech-store-txuf.onrender.com/api/cart/my-cart/add" \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod_123","name":"Wireless Earbuds","price":2499,"quantity":1}'
```

## Authentication & Roles
- **Auth provider**: Firebase email/password authentication.
- **Role persistence**: Role is stored under `Users/<uid>` in the Realtime Database.
- **Route protection**: `Protectroute` checks the authenticated user and restricts access based on the `roles` prop.
- **Default routing**: After login/sign-up, users are redirected according to their role (`/admin`, `/seller`, or `/`).

## Deployment Notes
- **Front-end**: Deploy the contents of `build/` to platforms like Vercel, Netlify, or Render static hosting.
- **API**: The Express app is Vercel-ready through `api/index.js`. Make sure to configure Firebase credentials via environment variables if you centralize configuration.
- **Firebase security**: Update Realtime Database and Storage security rules to restrict access based on authenticated users and roles.

## Troubleshooting & Known Issues
- **Firebase config duplication**: Multiple hard-coded config blocks risk drift—centralization is highly recommended.
- **Mixed API origins**: Some fetches use relative paths (`/api/...`) while others use absolute URLs pointing to the deployed API. Align strategy per environment to avoid CORS issues.
- **Server location**: The Express server currently lives under `src/back/`. For large-scale production use, consider moving server code outside `src/` and using the Firebase Admin SDK for privileged operations.
- **Error messaging**: Alerts are used for UX feedback; consider replacing with toasts or inline messaging for a smoother experience.

## Roadmap Ideas
- **Environment-driven configuration** to swap between local and production APIs automatically.
- **Centralized Firebase client** to eliminate duplication and simplify maintenance.
- **Unit/integration tests** for API endpoints and React hooks.
- **Design polish** leveraging a component system like Material UI (currently unused dependency).

## License
MIT — feel free to adapt, extend, and experiment with this codebase.
