import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../Authentication/Authpro";
import Navbar from "../comp/Navbar";
import "../asserts/style/admin.css";
const { getDatabase } = require('firebase/database');


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
const storage = getStorage(app);

export default function Seller() {
  const { currentUser, username } = useAuth();
  const uid = currentUser?.uid;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  // Editing state
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImage, setEditImage] = useState(null);

  const generateUniqueId = () => `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !image || !uid || !categoryId) {
      alert("Please fill all fields, including category");
      return;
    }
    try {
      const storageReference = storageRef(storage, `seller/${uid}/images/${image.name}`);
      await uploadBytes(storageReference, image);
      const imageUrl = await getDownloadURL(storageReference);

      // Create product via backend API
      await fetch("https://tech-store-2.onrender.com/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          productId: generateUniqueId(),
          imageUrl,
          sellerId: uid,
          sellerName: username || "Seller",
          categoryId: categoryId || undefined,
          categoryName: (categories.find(c => c.id === categoryId)?.name) || undefined,
        })
      });

      alert("Product added");
      setName("");
      setPrice("");
      setImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  const handleRemove = async (id) => {
    try {
      const item = myProducts.find((p) => p.key === id);
      if (!item || item.sellerId !== uid) {
        alert("You can only remove your own products");
        return;
      }
      const res = await fetch(`https://tech-store-2.onrender.com/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      alert("Product removed");
      // Refresh
      const refreshed = myProducts.filter(p => p.key !== id);
      setMyProducts(refreshed);
    } catch (err) {
      console.error(err);
      alert("Failed to remove product");
    }
  };

  const beginEdit = (p) => {
    setEditingId(p.key);
    setEditName(p.name || p.dish_Name || "");
    setEditPrice(String(p.price || p.dish_Price || ""));
    setEditCategoryId(p.categoryId || "");
    setEditImage(null);
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditName("");
    setEditPrice("");
    setEditCategoryId("");
    setEditImage(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const item = myProducts.find(p => p.key === editingId);
    if (!item || item.sellerId !== uid) {
      alert("You can only edit your own products");
      return;
    }
    try {
      let imageUrl = item.imageUrl;
      if (editImage) {
        const storageReference = storageRef(storage, `seller/${uid}/images/${editImage.name}`);
        await uploadBytes(storageReference, editImage);
        imageUrl = await getDownloadURL(storageReference);
      }
      const payload = {
        name: editName,
        price: editPrice,
        categoryId: editCategoryId,
        categoryName: (categories.find(c => c.id === editCategoryId)?.name) || undefined,
        imageUrl,
      };
      const res = await fetch(`https://tech-store-2.onrender.com/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setMyProducts(prev => prev.map(p => p.key === editingId ? { ...p, ...updated, key: p.key } : p));
      cancelEdit();
      alert('Product updated');
    } catch (e) {
      console.error(e);
      alert('Failed to update product');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [resP, resC] = await Promise.all([
          fetch("https://tech-store-2.onrender.com/api/products"),
          fetch("https://tech-store-2.onrender.com/api/categories"),
        ]);
        const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
        const items = (Array.isArray(dataP) ? dataP : []).map(p => ({ key: p.id, ...p }));
        const mine = uid ? items.filter(i => i.sellerId === uid) : [];
        setMyProducts(mine);
        setCategories(Array.isArray(dataC) ? dataC : []);
      } catch (e) {
        console.error("Failed to load products/categories", e);
        setMyProducts([]);
        setCategories([]);
      }
    };
    load();
  }, [uid]);

  return (
    <section className="start">
      <Navbar/>
      <div className="top">
        <div className="greet">
          <h2>Hello {username || "Seller"}, manage your products</h2>
        </div>
        <form className="add" onSubmit={handleSubmit}>
          <label>
            <h4>Product Name</h4>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            <h4>Price</h4>
            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </label>
          <label>
            <h4>Image</h4>
            <input type="file" onChange={(e) => setImage(e.target.files[0])} required />
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
          <button className="dish" type="submit">Add product</button>
        </form>
      </div>

      <section className="home collection">
        <h2>My Products</h2>
        <ul className="menu">
          {myProducts.map((p) => (
            <li key={p.key} className="food">
              {editingId === p.key ? (
                <>
                  <img className="menuimg" src={p.imageUrl} alt={p.name || p.dish_Name} />
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
                  <label>
                    <h4>Change Image</h4>
                    <input type="file" onChange={(e) => setEditImage(e.target.files[0])} />
                  </label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <img className="menuimg" src={p.imageUrl} alt={p.name || p.dish_Name} />
                  <h3>{p.name || p.dish_Name}</h3>
                  <p>Price: ${p.price || p.dish_Price}</p>
                  {p.categoryName && <p>Category: {p.categoryName}</p>}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => beginEdit(p)}>Edit</button>
                    <button onClick={() => handleRemove(p.key)}>Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}