import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import '../asserts/style/nav.css';

const firebaseConfig = {
  apiKey: 'AIzaSyDlRqiS3HiU4BWyWrHvASO5VLRx5vy7Haw',
  authDomain: 'online-food-order-80833.firebaseapp.com',
  databaseURL: 'https://online-food-order-80833-default-rtdb.firebaseio.com',
  projectId: 'online-food-order-80833',
  storageBucket: 'online-food-order-80833.appspot.com',
  messagingSenderId: '980243962311',
  appId: '1:980243962311:web:e6291c722a91c712bc21e2',
  measurementId: 'G-X186F4PB2Q'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Navbar() {
  const location = useLocation();

  const logout = async () => {
    try {
      await auth.signOut();
      alert('Signed out successfully');
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  const links = [
    { to: '/', label: 'Shop' },
    { to: '/cart', label: 'Cart' },
    { to: '/seller', label: 'Seller' },
    { to: '/order', label: 'Orders' },
    { to: '/admin', label: 'Admin' }
  ];

  return (
    <header className="topbar">
      <div className="topbar__inner layout-container">
        <div className="topbar__brand">
          <span className="topbar__logo">TS</span>
          <span className="topbar__title">Tech Store</span>
        </div>
        <nav className="topbar__nav" aria-label="Primary navigation">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`topbar__link${isActive ? ' topbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="topbar__actions">
          <Link to="/auth" className="topbar__cta">
            Account
          </Link>
          <button type="button" onClick={logout} className="topbar__logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
