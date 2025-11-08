import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import '../asserts/style/auth.css';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setName] = useState("");
  const [role, setRole] = useState('customer');
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
      await routeByRole(cred.user.uid);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setError("");
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
        role,
      });
      setEmail("");
      setPassword("");
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
    <div className="auth-page">
      <div className="auth-card surface surface--inset">
        <div className="auth-header">
          <h1>Tech Store</h1>
          <p className="text-muted">Sign in or create an account to personalize your experience.</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab${activeTab === 'login' ? ' auth-tab--active' : ''}`}
            onClick={() => handleTabClick('login')}
            role="tab"
            aria-selected={activeTab === 'login'}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab${activeTab === 'signup' ? ' auth-tab--active' : ''}`}
            onClick={() => handleTabClick('signup')}
            role="tab"
            aria-selected={activeTab === 'signup'}
          >
            Sign Up
          </button>
        </div>

        <form
          id="login-form"
          className={`auth-form${activeTab === 'login' ? ' auth-form--active' : ''}`}
          onSubmit={handleLogin}
        >
          <h2>Welcome back</h2>
          <label>
            Email
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" className="btn-primary auth-submit">Login</button>
          {error && activeTab === 'login' && <p className="form-error">{error}</p>}
        </form>

        <form
          id="signup-form"
          className={`auth-form${activeTab === 'signup' ? ' auth-form--active' : ''}`}
          onSubmit={handleSignup}
        >
          <h2>Create account</h2>
          <label>
            Full name
            <input type="text" placeholder="Enter your full name" value={displayName} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {error && activeTab === 'signup' && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Auth;
