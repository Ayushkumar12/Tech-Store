import React, { useState, useEffect } from "react";
import Footer from '../comp/Footer';
import Navbar from "../comp/Navbar";
import "../asserts/style/home.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set } from "firebase/database";

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
const database = getDatabase(app);
function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [Table, setTable] = useState("");
  const [show, setShow] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [clickEffect, setClickEffect] = useState(false);
  
  
  const Handleclick = () => {
    setShow(!show);
  };

  useEffect(() => {
    // Load products and categories from backend API
    const load = async () => {
      try {
        const [resP, resC] = await Promise.all([
          fetch("http://localhost:3000/api/products"),
          fetch("http://localhost:3000/api/categories"),
        ]);
        const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
        setProducts(Array.isArray(dataP) ? dataP : []);
        setCategories(Array.isArray(dataC) ? dataC : []);
      } catch (e) {
        console.error("Failed to load products/categories", e);
        setProducts([]);
        setCategories([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    calculateTotalCost();
  }, [cartItems]);

  const handleAddToCart = (menuItem) => {
    setClickEffect(true);
    setCartCount(prev => prev + 1);
    setTimeout(() => setClickEffect(false), 300);
    const getId = (it) => it.productId ?? it.dish_Id;
    const existingCartItem = cartItems.find(
      (cartItem) => getId(cartItem) === getId(menuItem)
    );
    if (existingCartItem) {
      const updatedCartItems = cartItems.map((cartItem) => {
        const getId = (it) => it.productId ?? it.dish_Id;
        if (getId(cartItem) === getId(menuItem)) {
          return { ...cartItem, quantity: cartItem.quantity + 1 };
        } else {
          return cartItem;
        }
      });
      setCartItems(updatedCartItems);
    } else {
      setCartItems([...cartItems, { ...menuItem, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (menuItem) => {
    const updatedCartItems = cartItems.filter(
      (cartItem) => cartItem.id !== menuItem.id
    );
    setCartItems(updatedCartItems);
  };

  const calculateTotalCost = () => {
    const totalCost = cartItems.reduce(
      (acc, cartItem) => acc + (Number(cartItem.price ?? cartItem.dish_Price) * cartItem.quantity),
      0
    );
    setTotalCost(totalCost.toFixed(2));
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !Table) {
        alert("Please enter customer name and table number");
        return;
    }
    if (cartItems.length === 0) {
        alert("No items in the cart");
        return;
    } else {
        try {
            const res = await fetch("http://localhost:3000/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerName,
                Table,
                restaurantId: "12345",
                menuItems: cartItems,
                totalCost,
              })
            });
            if (!res.ok) throw new Error("Failed to submit order");
            alert("Order submitted successfully");
            setCartItems([]);
            setTotalCost(0);
        } catch (error) {
            console.error(error);
            alert("There was an error submitting your order. Please try again.");
        }
    }
};


  return (
    <section>
      <Navbar/>
      <main>
        <section className="first">
          <div className="herotext">
            <h1>Delightio</h1>
            <p>Discover the best food & drinks</p>
          </div>
        </section>
        <section className="home">
          <div className="collection">
            <h2>Products</h2>
            <div className="filters" style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Search products" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="">Sort by</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select>
            </div>
            <ul className="menu">
              {Array.isArray(products) && products.length > 0 ? (
                products
                  .filter((p) => !selectedCategory || p.categoryId === selectedCategory)
                  .filter((p) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (!q) return true;
                    const name = String(p.name || p.dish_Name || '').toLowerCase();
                    return name.includes(q);
                  })
                  .sort((a, b) => {
                    if (!sortOrder) return 0;
                    const pa = Number(a.price ?? a.dish_Price) || 0;
                    const pb = Number(b.price ?? b.dish_Price) || 0;
                    return sortOrder === 'asc' ? pa - pb : pb - pa;
                  })
                  .map((product) => (
                    <li key={product.productId || product.dish_Id} className="food">
                      <img
                        className="menuimg"
                        src={product.imageUrl}
                        alt={product.name || product.dish_Name}
                      />
                      <h3>{product.name || product.dish_Name}</h3>
                      {product.categoryName && <p>Category: {product.categoryName}</p>}
                      <p>Price: ${product.price || product.dish_Price}</p>
                      <button onClick={() => handleAddToCart(product)}>
                        Add to Cart
                      </button>
                    </li>
                  ))
              ) : (
                <p>No products available.</p>
              )}
            </ul>
          </div>
          <div className={`cart-head ${clickEffect ? 'click-effect' : ''}`}
            onClick={Handleclick}>
              <h1>Order Now</h1>
          </div>
            <aside className={show? 'show' : 'hide'}>
              <h2 onClick={Handleclick}>Cart</h2>
              <div className="cont">
                <form>
                  <h3>Customer Name:</h3>
                  <input
                    type="text"
                    value={customerName}
                    required
                    placeholder="Customer Name"
                    onChange={(e) => setCustomerName(e.target.value)}
                  />

                  <h3>Table:</h3>
                  <input
                    type="text"
                    value={Table}
                    placeholder="T4675"
                    required
                    onChange={(e) => setTable(e.target.value)}
                  />
                </form>
                <table className="cart">
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Price</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((cartItem) => (
                      <tr key={(cartItem.productId || cartItem.dish_Id || cartItem.id) + (cartItem.name || cartItem.dish_Name)}>
                        <td>{cartItem.name || cartItem.dish_Name}</td>
                        <td>${cartItem.price || cartItem.dish_Price}</td>
                        <td>{cartItem.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2">Total:</td>
                      <td>${totalCost}</td>
                    </tr>
                  </tfoot>
                </table>
                <div className="obut">
                  <button
                    className="sub"
                    onClick={() => handleRemoveFromCart(cartItems)}
                  >
                    Reset
                  </button>
                  <button className="sub" onClick={handleSubmitOrder}>
                    Place Order
                  </button>
                </div>
              </div>
            </aside>
        </section>
      </main>
      <Footer/>
    </section>
  );
}

export default Home;
