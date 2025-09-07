import '../asserts/style/auth.css';
import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';

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
const auth = getAuth(app);
const database = getDatabase(app);

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setName] = useState("");
  const [role, setRole] = useState('customer'); // customer | seller | admin
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const routeByRole = async (uid) => {
    const snap = await get(ref(database, `Users/${uid}`));
    const user = snap.val();
    const r = user?.role || 'customer';
    if (r === 'admin') navigate('/admin');
    else if (r === 'seller') navigate('/seller');
    else navigate('/');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("Auth Token", cred.user.refreshToken);
      alert("Login successful!");
      await routeByRole(cred.user.uid);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!displayName || !email) {
        alert("Please enter name and email");
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = ref(database, `Users/${user.uid}`);
      await set(userRef, {
        displayName,
        email,
        role, // save selected role
      });
      setEmail("");
      setPassword("");
      alert("User registered successfully");
      await routeByRole(user.uid);
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return "This email address is already in use.";
      case 'auth/invalid-email':
        return "The email address is not valid.";
      case 'auth/weak-password':
        return "The password is too weak.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="body">
      <div className="container">
        <div className="form-container">
          <div className="tabs">
            <div className={`tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => handleTabClick('login')}>Login</div>
            <div className={`tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => handleTabClick('signup')}>Sign Up</div>
          </div>

          {/* Login Form */}
          <form id="login-form" className={`form ${activeTab === 'login' ? 'active' : ''}`} onSubmit={handleLogin}>
            <h2 className="form-title">Welcome Back</h2>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input type="email" id="login-email" className="form-control" placeholder="Enter your email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input type="password" id="login-password" className="form-control" placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn">Login</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>

          {/* Signup Form */}
          <form id="signup-form" className={`form ${activeTab === 'signup' ? 'active' : ''}`} onSubmit={handleSignup}>
            <h2 className="form-title">Create Account</h2>
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <input type="text" id="signup-name" className="form-control" placeholder="Enter your full name" value={displayName}
                onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input type="email" id="signup-email" className="form-control" placeholder="Enter your email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input type="password" id="signup-password" className="form-control" placeholder="Create a password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-role">Role</label>
              <select id="signup-role" className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">Customer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn" disabled={loading}>Sign Up</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
