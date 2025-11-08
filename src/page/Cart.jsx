import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../comp/Navbar";
import Footer from "../comp/Footer";
import "../asserts/style/home.css";

function Cart() {
  const cartId = useMemo(() => "default", []);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [table, setTable] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (productId, quantity) => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}/items/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      await load();
    } catch (e) {}
  };

  const removeItem = async (productId) => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}/items/${productId}`, { method: "DELETE" });
      await load();
    } catch (e) {}
  };

  const clearCart = async () => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}`, { method: "DELETE" });
      await load();
    } catch (e) {}
  };

  const placeOrder = async () => {
    if (!customerName || !table) {
      alert("Enter name and table");
      return;
    }
    try {
      const res = await fetch("https://tech-store-txuf.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, customerName, table, restaurantId: "12345" })
      });
      if (!res.ok) throw new Error("Failed to place order");
      alert("Order placed");
      setCustomerName("");
      setTable("");
      await load();
    } catch (e) {
      alert("Order failed");
    }
  };

  return (
    <div className="cart-page">
      <Navbar />
      <main className="section">
        <div className="layout-container stack-lg">
          <header className="page-header">
            <div>
              <span className="page-kicker">Your basket</span>
              <h1>Cart overview</h1>
              <p className="text-muted">Review your selection before confirming the order.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={load}>Refresh</button>
          </header>

          {loading ? (
            <div className="home-catalog__state surface surface--inset" role="status">
              <span className="home-catalog__spinner" aria-hidden="true" />
              <p>Syncing your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state surface surface--inset">
              <h3>Your cart is empty</h3>
              <p className="text-muted">Start adding products from the collection to build your perfect setup.</p>
              <a className="btn-primary" href="/">Browse products</a>
            </div>
          ) : (
            <div className="grid-two">
              <div className="data-table surface surface--inset">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.productId}>
                        <td>{it.name}</td>
                        <td>₹{Number(it.price || 0).toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={it.quantity}
                            onChange={(e) => updateQty(it.productId, Number(e.target.value) || 0)}
                          />
                        </td>
                        <td>₹{(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)}</td>
                        <td>
                          <button className="btn-secondary" type="button" onClick={() => removeItem(it.productId)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td colSpan={2}>₹{Number(total || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <aside className="surface surface--inset stack-md cart-summary">
                <div>
                  <h2>Order details</h2>
                  <p className="text-muted">Add customer information to finalize the order.</p>
                </div>
                <form className="form-grid" onSubmit={(e) => { e.preventDefault(); placeOrder(); }}>
                  <label>
                    Customer name
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" />
                  </label>
                  <label>
                    Table
                    <input type="text" value={table} onChange={(e) => setTable(e.target.value)} placeholder="T4675" />
                  </label>
                </form>
                <div className="cart-summary__actions">
                  <button className="btn-secondary" type="button" onClick={clearCart}>Reset cart</button>
                  <button className="btn-primary" type="button" onClick={placeOrder}>Place order</button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Cart;
