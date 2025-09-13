# Tech Store — E-Commerce App

A Create React App project for a simple restaurant ordering system using Firebase (Auth, Realtime Database, and Storage).

## Features
- **Public menu**: Fetches menu items from Firebase Realtime Database under `menu`.
- **Cart and checkout**: Add items to cart and place orders; orders are saved under `orders`.
- **Authentication**: Email/password sign-up and login with Firebase Auth.
- **Protected admin panel**: Add new dishes (with image upload to Firebase Storage) and remove existing ones.
- **Orders management**: View and mark orders as done (deletes order).

## Tech Stack
- **React 18** + **React Router v6** (Create React App)
- **Firebase**: Auth, Realtime Database, Storage
- **MUI** (installed; not heavily used in UI yet)
- **Express (experimental)**: A draft server exists at `src/back/server.js` but is not wired into the app

## Project Structure
```
.
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── page/
│   │   ├── Home.jsx        # Menu, cart, place order
│   │   ├── Admin.jsx       # Protected: add/remove menu items
│   │   └── Order.jsx       # View/delete orders
│   ├── Authentication/
│   │   ├── Auth.jsx        # Login/Signup UI + flows
│   │   ├── Authpro.jsx     # Auth context/provider
│   │   └── Protectroute.jsx# Route guard
│   ├── comp/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── asserts/            # Images/icons/styles
│   └── back/
│       └── server.js       # Experimental/unused Node server
├── package.json
└── README.md
```

## Prerequisites
- Node.js 18+ and npm
- A Firebase project with:
  - Authentication (Email/Password)
  - Realtime Database
  - Storage

## Configuration
Firebase config is currently hard-coded in multiple files. Replace the `firebaseConfig` values with your own from the Firebase console in these files:
- `src/Authentication/Auth.jsx`
- `src/Authentication/Authpro.jsx`
- `src/page/Home.jsx`
- `src/page/Admin.jsx`
- `src/page/Order.jsx`
- `src/comp/Navbar.jsx`

Suggested improvement (optional): centralize config in one file, e.g. `src/firebaseConfig.js`, or use environment variables (`REACT_APP_*`).

Example config placeholder:
```js
// src/firebaseConfig.js
export const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "<YOUR_PROJECT>.firebaseapp.com",
  databaseURL: "https://<YOUR_PROJECT>-default-rtdb.firebaseio.com",
  projectId: "<YOUR_PROJECT>",
  storageBucket: "<YOUR_PROJECT>.appspot.com",
  messagingSenderId: "<SENDER_ID>",
  appId: "<APP_ID>",
  measurementId: "<MEASUREMENT_ID>"
};
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Update Firebase configuration as described above.
3. Start the development server:
   ```bash
   npm start
   ```
4. Open the app at:
   - https://tech-store-2.onrender.com/

## Available Scripts
- `npm start` — start CRA dev server
- `npm run build` — production build
- `npm test` — run tests (Jest/React Testing Library)
- `npm run eject` — eject CRA (irreversible)

## App Routes
- `/` — Home (public menu and cart)
- `/auth` — Login/Sign Up
- `/admin` — Admin panel (protected)
- `/order` — Orders list (view and mark done)

## Data Model (Realtime Database)
- **Menu item (under `menu/`)**
  ```json
  {
    "<firebaseKey>": {
      "dish_Name": "Margherita Pizza",
      "dish_Price": 12.5,
      "dish_Id": "dish_1699900000000_123",
      "imageUrl": "https://..."
    }
  }
  ```
- **Order (under `orders/`)**
  ```json
  {
    "<orderKey>": {
      "orderid": "<orderKey>",
      "customerName": "Alice",
      "Table": "T1",
      "restaurantId": "12345",
      "menuItems": [
        { "dish_Id": "dish_...", "dish_Name": "Margherita", "dish_Price": 12.5, "quantity": 2 }
      ],
      "totalCost": "25.00"
    }
  }
  ```
- **User profile (under `Users/<uid>`)**
  ```json
  {
    "displayName": "Admin User",
    "email": "admin@example.com"
  }
  ```

## How It Works
- **Home.jsx**: Subscribes to `menu`, displays dishes, manages cart, and writes orders to `orders` using `push` + `set`.
- **Admin.jsx**: Creates a unique `dish_Id`, uploads an image to Storage, saves the dish to `menu`. Lists `menu` items and allows removal.
- **Auth.jsx / Authpro.jsx**: Handles signup/login and auth state; stores user profiles under `Users/<uid>`.
- **Order.jsx**: Subscribes to `orders`, displays each order, and deletes on completion.

## Notes and Known Issues
- **Firebase config duplication**: Config is duplicated across multiple files; consider centralizing.
- **Experimental server**: `src/back/server.js` is not used by the React app and mixes client SDK usage on the server. If you plan to use a backend, move it out of `src/`, use `firebase-admin`, and add proper scripts (e.g., `node server.js`).
- **Unused dependencies**: Some packages (e.g., `axios`, `mongoose`, `multer`, `firebase-admin`, `@mui/material`) appear unused. Consider pruning to reduce bundle size and install time.
- **Security rules**: Configure Firebase Realtime Database and Storage rules to protect data appropriately for your use case.

## License
MIT (or choose a license appropriate for your project)

---

Tip: A repository info file `.zencoder/rules/repo.md` was not found. If you want, I can generate it to improve future automated assistance.