import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../Authentication/Authpro";
import Navbar from "../comp/Navbar";
import Footer from "../comp/Footer";
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

export default function Seller() {
  const { currentUser, username } = useAuth();
  const uid = currentUser?.uid;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");

  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImage, setEditImage] = useState(null);

  const generateUniqueId = () => `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const loadProducts = async () => {
    try {
      const [resProducts, resCategories] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/categories`)
      ]);
      const [dataProducts, dataCategories] = await Promise.all([resProducts.json(), resCategories.json()]);
      const items = (Array.isArray(dataProducts) ? dataProducts : []).map((p) => ({ key: p.id, ...p }));
      const mine = uid ? items.filter((item) => item.sellerId === uid) : [];
      setMyProducts(mine);
      setCategories(Array.isArray(dataCategories) ? dataCategories : []);
    } catch (error) {
      setMyProducts([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [uid]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !price || !image || !uid || !categoryId) {
      alert("Please fill out name, price, image, and category");
      return;
    }
    try {
      const storageReference = storageRef(storage, `seller/${uid}/images/${image.name}`);
      await uploadBytes(storageReference, image);
      const imageUrl = await getDownloadURL(storageReference);

      await fetch(`${API_BASE}/products`, {
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
          categoryName: categories.find((c) => c.id === categoryId)?.name || undefined
        })
      });

      alert("Product added");
      setName("");
      setPrice("");
      setImage(null);
      setCategoryId("");
      await loadProducts();
    } catch (error) {
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
      const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMyProducts((prev) => prev.filter((product) => product.key !== id));
    } catch (error) {
      alert("Failed to remove product");
    }
  };

  const beginEdit = (product) => {
    setEditingId(product.key);
    setEditName(product.name || product.dish_Name || "");
    setEditPrice(String(product.price || product.dish_Price || ""));
    setEditCategoryId(product.categoryId || "");
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
    const item = myProducts.find((p) => p.key === editingId);
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
        categoryId: editCategoryId || undefined,
        categoryName: categories.find((c) => c.id === editCategoryId)?.name || undefined,
        imageUrl
      };
      const res = await fetch(`${API_BASE}/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setMyProducts((prev) => prev.map((p) => (p.key === editingId ? { ...p, ...updated, key: p.key } : p)));
      cancelEdit();
      alert("Product updated");
    } catch (error) {
      alert("Failed to update product");
    }
  };

  return (
    <div className="admin-page">
      <Navbar />
      <main className="section">
        <div className="layout-container stack-lg">
          <header className="page-header">
            <div>
              <span className="page-kicker">Seller workspace</span>
              <h1>Hello {username || "Seller"}</h1>
              <p className="text-muted">Manage your personal inventory and keep products up to date.</p>
            </div>
          </header>

          <section className="surface surface--inset stack-md admin-form">
            <div className="admin-form__header">
              <h2>Add a new product</h2>
              <p className="text-muted">Upload imagery, pricing, and assign a category.</p>
            </div>
            <form className="form-grid form-grid--auto" onSubmit={handleSubmit}>
              <label>
                Product name
                <input type="text" placeholder="Mechanical keyboard" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Price
                <input type="number" placeholder="12999" value={price} onChange={(e) => setPrice(e.target.value)} required />
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
                <h2>Your products</h2>
                <p className="text-muted">{myProducts.length} items published</p>
              </div>
              <button className="btn-secondary" type="button" onClick={loadProducts}>Refresh list</button>
            </div>

            {myProducts.length === 0 ? (
              <div className="empty-state admin-empty">
                <h3>No products yet</h3>
                <p className="text-muted">Add your first product to start selling.</p>
              </div>
            ) : (
              <ul className="admin-grid">
                {myProducts.map((product) => (
                  <li key={product.key} className="admin-card">
                    {editingId === product.key ? (
                      <div className="admin-card__editing stack-md">
                        <div className="admin-card__image">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name || product.dish_Name || "Product image"} />
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
                          <label className="file-input">
                            Replace image
                            <input type="file" onChange={(e) => setEditImage(e.target.files[0])} />
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
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name || product.dish_Name || "Product image"} />
                          ) : (
                            <div className="admin-card__placeholder">No image</div>
                          )}
                        </div>
                        <div className="admin-card__content">
                          <h3>{product.name || product.dish_Name}</h3>
                          {product.categoryName ? <span className="badge">{product.categoryName}</span> : null}
                          <p className="admin-card__price">₹{Number(product.price || product.dish_Price || 0).toFixed(2)}</p>
                        </div>
                        <div className="admin-card__actions">
                          <button className="btn-secondary" type="button" onClick={() => beginEdit(product)}>Edit</button>
                          <button className="btn-primary admin-card__delete" type="button" onClick={() => handleRemove(product.key)}>Remove</button>
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
