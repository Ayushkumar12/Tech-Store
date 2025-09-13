import React, { useState, useEffect } from "react";
import Footer from "../comp/Footer";
import Navbar from "../comp/Navbar";
import { initializeApp } from "firebase/app";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useAuth } from "../Authentication/Authpro";
import "../asserts/style/admin.css";

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
const storage = getStorage(app);

export default function Admin() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");

  const [image, setImage] = useState(null);
  const { username } = useAuth();
  // Edit state
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const generateUniqueId = () => {
    return `dish_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleSubmitMenu = async (event) => {
    event.preventDefault();
    if (!name || !price || !image || !categoryId) {
      alert("Please fill out all fields and select a category.");
      return;
    }

    const productId = generateUniqueId();

    try {
      // Upload image to Storage
      const storageReference = storageRef(storage, `images/${image.name}`);
      await uploadBytes(storageReference, image);
      const imageUrl = await getDownloadURL(storageReference);

      // Create product via backend API
      const res = await fetch("https://tech-store-2.onrender.com/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, productId, imageUrl, categoryId, categoryName: (categories.find(c => c.id === categoryId)?.name) || undefined })
      });
      if (!res.ok) throw new Error("Failed to create product");

      alert("Menu submitted successfully");
      setName("");
      setPrice("");
      setImage(null);
      // refresh list
      fetchMenu();
    } catch (error) {
      console.error(error);
      alert("Error submitting menu. Please try again.");
    }
  };

  const handleRemoveMenuItem = async (id) => {
    try {
      const res = await fetch(`https://tech-store-2.onrender.com/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      alert('Menu item deleted successfully');
      fetchMenu();
    } catch (error) {
      console.error("Error deleting menu:", error);
      alert("Error deleting menu:", error);
    }
  };

  const fetchMenu = async () => {
    try {
      const [resP, resC] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const [data, dataC] = await Promise.all([resP.json(), resC.json()]);
      const itemsArray = (Array.isArray(data) ? data : []).map(p => ({ key: p.id, ...p }));
      setProducts(itemsArray);
      setCategories(Array.isArray(dataC) ? dataC : []);
    } catch (e) {
      console.error("Failed to load products", e);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <section>
      <section className="start">
        <Navbar />
        <div className="top">
          <div className="greet">
            <h2>Hello {username}, Welcome back</h2>
          </div>
          <form className="add" onSubmit={handleSubmitMenu}>
            <label>
              <h4>Enter Product Name</h4>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              <h4>Enter Price</h4>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              <h4>Upload Image</h4>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                required
              />
            </label>
            <label>
              <h4>Category</h4>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <button className="dish" type="submit">
              Add product
            </button>
          </form>
        </div>

        <section className="home collection">
          <h2>Products</h2>
          <div className="filters" style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
            {/* Simplified filters to avoid unused state variables */}
          </div>
          <ul className="menu">
            {products.map((item) => (
                <li key={item.key} className="food">
                  {editingId === item.key ? (
                    <>
                      <img className="menuimg" src={item.imageUrl} alt={item.name || item.dish_Name} />
                      <label>
                        <h4>Name</h4>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </label>
                      <label>
                        <h4>Price</h4>
                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      </label>
                      <label>
                        <h4>Category</h4>
                        <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={async () => {
                          try {
                            const payload = {
                              name: editName,
                              price: editPrice,
                              categoryId: editCategoryId,
                              categoryName: (categories.find(c => c.id === editCategoryId)?.name) || undefined,
                            };
                            const res = await fetch(`/api/products/${editingId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            });
                            if (!res.ok) throw new Error('Failed to update');
                            const updated = await res.json();
                            setProducts(prev => prev.map(p => p.key === editingId ? { ...p, ...updated, key: p.key } : p));
                            setEditingId("");
                            setEditName("");
                            setEditPrice("");
                            setEditCategoryId("");
                            alert('Updated');
                          } catch(e) {
                            console.error(e);
                            alert('Update failed');
                          }
                        }}>Save</button>
                        <button onClick={() => { setEditingId(""); setEditName(""); setEditPrice(""); setEditCategoryId(""); }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        className="menuimg"
                        src={item.imageUrl}
                        alt={item.name || item.dish_Name}
                      />
                      <h3>{item.name || item.dish_Name}</h3>
                      {item.categoryName && <p>Category: {item.categoryName}</p>}
                      <p>Price: ${item.price || item.dish_Price}</p>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={() => { setEditingId(item.key); setEditName(item.name || item.dish_Name || ""); setEditPrice(String(item.price || item.dish_Price || "")); setEditCategoryId(item.categoryId || ""); }}>Edit</button>
                        <button onClick={() => handleRemoveMenuItem(item.key)}>Remove</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
          </ul>
        </section>
      </section>
      <Footer />
    </section>
  );
}