import React, { useEffect, useState } from "react";
import Footer from "../comp/Footer";
import Navbar from "../comp/Navbar";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
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
const API_BASE = "https://tech-store-txuf.onrender.com/api";

export default function Admin() {
  const { username } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const generateUniqueId = () => `dish_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const loadCatalog = async () => {
    try {
      const [resProducts, resCategories] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/categories`)
      ]);
      const [dataProducts, dataCategories] = await Promise.all([resProducts.json(), resCategories.json()]);
      const itemsArray = (Array.isArray(dataProducts) ? dataProducts : []).map((p) => ({ key: p.id, ...p }));
      setProducts(itemsArray);
      setCategories(Array.isArray(dataCategories) ? dataCategories : []);
    } catch (error) {
      setProducts([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleSubmitMenu = async (event) => {
    event.preventDefault();
    if (!name || !price || !image || !categoryId) {
      alert("Please provide name, price, image, and category.");
      return;
    }

    const productId = generateUniqueId();

    try {
      const storageReference = storageRef(storage, `images/${image.name}`);
      await uploadBytes(storageReference, image);
      const imageUrl = await getDownloadURL(storageReference);

      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          productId,
          imageUrl,
          categoryId,
          categoryName: categories.find((c) => c.id === categoryId)?.name || undefined
        })
      });
      if (!res.ok) throw new Error("Failed to create product");

      alert("Product published successfully");
      setName("");
      setPrice("");
      setImage(null);
      setCategoryId("");
      await loadCatalog();
    } catch (error) {
      alert("There was an issue publishing the product.");
    }
  };

  const handleRemoveProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((product) => product.key !== id));
    } catch (error) {
      alert("Unable to remove this product right now.");
    }
  };

  const beginEdit = (product) => {
    setEditingId(product.key);
    setEditName(product.name || product.dish_Name || "");
    setEditPrice(String(product.price || product.dish_Price || ""));
    setEditCategoryId(product.categoryId || "");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditName("");
    setEditPrice("");
    setEditCategoryId("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = {
        name: editName,
        price: editPrice,
        categoryId: editCategoryId || undefined,
        categoryName: categories.find((c) => c.id === editCategoryId)?.name || undefined
      };
      const res = await fetch(`${API_BASE}/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update product");
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.key === editingId ? { ...p, ...updated, key: p.key } : p)));
      cancelEdit();
      alert("Product updated");
    } catch (error) {
      alert("Unable to update product");
    }
  };

  return (
    <div className="admin-page">
      <Navbar />
      <main className="section">
        <div className="layout-container stack-lg">
          <header className="page-header">
            <div>
              <span className="page-kicker">Admin console</span>
              <h1>{username ? `Welcome back, ${username}` : "Welcome back"}</h1>
              <p className="text-muted">Curate the Tech Store catalog and keep your inventory ahead of demand.</p>
            </div>
          </header>

          <section className="surface surface--inset stack-md admin-form">
            <div className="admin-form__header">
              <h2>Publish a new product</h2>
              <p className="text-muted">Upload imagery, set pricing, and assign a category in minutes.</p>
            </div>
            <form className="form-grid form-grid--auto" onSubmit={handleSubmitMenu}>
              <label>
                Product name
                <input type="text" placeholder="Studio Display" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Price
                <input type="number" placeholder="98000" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </label>
              <label className="file-input">
                Product image
                <input type="file" onChange={(e) => setImage(e.target.files[0])} required />
              </label>
              <label>
                Category
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <button className="btn-primary admin-form__submit" type="submit">Add product</button>
            </form>
          </section>

          <section className="surface surface--inset stack-md admin-inventory">
            <div className="admin-inventory__header">
              <div>
                <h2>Catalog overview</h2>
                <p className="text-muted">{products.length} products available</p>
              </div>
              <button className="btn-secondary" type="button" onClick={loadCatalog}>Refresh list</button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state admin-empty">
                <h3>No products yet</h3>
                <p className="text-muted">Add your first product to populate the catalog.</p>
              </div>
            ) : (
              <ul className="admin-grid">
                {products.map((item) => (
                  <li key={item.key} className="admin-card">
                    {editingId === item.key ? (
                      <div className="admin-card__editing stack-md">
                        <div className="admin-card__image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name || item.dish_Name || "Product image"} />
                          ) : (
                            <div className="admin-card__placeholder">No image</div>
                          )}
                        </div>
                        <div className="form-grid">
                          <label>
                            Name
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </label>
                          <label>
                            Price
                            <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                          </label>
                          <label>
                            Category
                            <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                              <option value="">Select category</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="admin-card__actions">
                          <button className="btn-primary" type="button" onClick={saveEdit}>Save changes</button>
                          <button className="btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-card__body stack-md">
                        <div className="admin-card__image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name || item.dish_Name || "Product image"} />
                          ) : (
                            <div className="admin-card__placeholder">No image</div>
                          )}
                        </div>
                        <div className="admin-card__content">
                          <h3>{item.name || item.dish_Name}</h3>
                          {item.categoryName ? <span className="badge">{item.categoryName}</span> : null}
                          <p className="admin-card__price">₹{Number(item.price || item.dish_Price || 0).toFixed(2)}</p>
                        </div>
                        <div className="admin-card__actions">
                          <button className="btn-secondary" type="button" onClick={() => beginEdit(item)}>Edit</button>
                          <button className="btn-primary admin-card__delete" type="button" onClick={() => handleRemoveProduct(item.key)}>Remove</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
