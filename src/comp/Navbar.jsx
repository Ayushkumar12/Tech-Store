import React from 'react';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app'; 
import "../asserts/style/nav.css"; 

const firebaseConfig = {
  apiKey: "AIzaSyDlRqiS3HiU4BWyWrHvASO5VLRx5vy7Haw",
  authDomain: "online-food-order-80833.firebaseapp.com",
  databaseURL: "https://online-food-order-80833-default-rtdb.firebaseio.com",
  projectId: "online-food-order-80833",
  storageBucket: "online-food-order-80833.appspot.com",
  messagingSenderId: "980243962311",
  appId: "1:980243962311:web:e6291c722a91c712bc21e2",
  measurementId: "G-X186F4PB2Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get the Auth instance

export default function Navbar() {
  const logout = async () => {
    try {
      await auth.signOut(); // Use signOut method
      alert("Signed out successfully");
    } catch (error) {
      alert("Error signing out: " + error.message); // Corrected error handling
    }
  };

  return (
    <nav>
      <h2>Tech Store</h2>
      <ul className='side'>
        <Link to='/' className='log'>Shop</Link>
        <Link to='/cart' className='log'>Cart</Link>
        <Link to='/seller' className='log'>Seller</Link>
        <Link to='/order' className='log'>Orders</Link>
        <Link to='/admin' className='log'>Admin</Link>
        <a href='' onClick={logout} className='log' style={{ cursor: 'pointer' }}>Logout</a>
      </ul>
    </nav>
  );
}
