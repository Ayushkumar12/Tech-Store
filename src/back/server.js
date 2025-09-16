const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, child, get, push, set, update, remove } = require('firebase/database');

const app = express();
app.use(cors());
app.use(express.json());

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

// Initialize Firebase once and reuse connection
const appFirebase = initializeApp(firebaseConfig);
const database = getDatabase(appFirebase);
const dbRef = ref(database);

// In-memory cache for frequently accessed data
const cache = {
  products: null,
  categories: null,
  lastProductsUpdate: 0,
  lastCategoriesUpdate: 0,
  TTL: 30000 // 30 seconds cache TTL
};

// Cache helper functions
const isCacheValid = (lastUpdate) => {
  return Date.now() - lastUpdate < cache.TTL;
};

const getCachedProducts = () => {
  if (cache.products && isCacheValid(cache.lastProductsUpdate)) {
    console.log('Returning cached products');
    return cache.products;
  }
  return null;
};

const getCachedCategories = () => {
  if (cache.categories && isCacheValid(cache.lastCategoriesUpdate)) {
    console.log('Returning cached categories');
    return cache.categories;
  }
  return null;
};

// Seed default categories if missing (idempotent)
(async () => {
  try {
    const defaults = [
      { id: 'mobiles', name: 'Mobiles', description: '' },
      { id: 'laptops', name: 'Laptops', description: '' },
      { id: 'watches', name: 'Watches', description: '' },
    ];
    const snap = await get(child(dbRef, 'categories'));
    const existing = snap.exists() ? snap.val() : {};
    for (const c of defaults) {
      if (!existing || !existing[c.id]) {
        await set(child(dbRef, `categories/${c.id}`), { name: c.name, description: c.description });
      }
    }
  } catch (e) {
    console.error('Category seed error:', e);
  }
})();

// Log every API request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Special endpoint for initial data loading - combines products and categories
app.get('/api/initial-data', async (req, res) => {
  try {
    console.log('Fetching initial data (products + categories)...');
    const startTime = Date.now();
    
    // Check cache first
    const cachedProducts = getCachedProducts();
    const cachedCategories = getCachedCategories();
    
    if (cachedProducts && cachedCategories) {
      console.log('Returning cached initial data');
      return res.json({
        products: cachedProducts,
        categories: cachedCategories,
        cached: true
      });
    }
    
    // Fetch both in parallel with timeout
    const [productsSnap, categoriesSnap] = await Promise.race([
      Promise.all([
        get(child(dbRef, 'products')),
        get(child(dbRef, 'categories'))
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 10000)
      )
    ]);
    
    const products = toProductsArray(productsSnap);
    const categories = toArray(categoriesSnap);
    
    // Update cache
    cache.products = products;
    cache.categories = categories;
    cache.lastProductsUpdate = Date.now();
    cache.lastCategoriesUpdate = Date.now();
    
    const fetchTime = Date.now() - startTime;
    console.log(`Initial data fetched in ${fetchTime}ms`);
    
    res.json({
      products,
      categories,
      cached: false,
      fetchTime
    });
  } catch (err) {
    console.error('GET /api/initial-data error:', err);
    
    // Return any cached data available
    const response = {};
    if (cache.products) response.products = cache.products;
    if (cache.categories) response.categories = cache.categories;
    
    if (Object.keys(response).length > 0) {
      console.log('Returning partial cached data due to error');
      response.error = err.message;
      response.cached = true;
      return res.json(response);
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch initial data',
      error: err.message 
    });
  }
});

// Helpers
const toProductsArray = (snap) => {
  if (!snap.exists()) return [];
  const val = snap.val();
  // Normalize product object keys for clients
  return Object.entries(val).map(([id, item]) => ({
    id,
    // expose both old and new keys for transition safety
    name: item.name ?? item.dish_Name ?? '',
    price: item.price ?? item.dish_Price ?? 0,
    productId: item.productId ?? item.dish_Id ?? id,
    imageUrl: item.imageUrl ?? '',
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    // keep originals in case UI still uses them
    dish_Name: item.dish_Name,
    dish_Price: item.dish_Price,
    dish_Id: item.dish_Id,
  }));
};

// CRUD API for products
// GET all products - optimized with caching
app.get('/api/products', async (req, res) => {
  try {
    // Try cache first
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      return res.json(cachedProducts);
    }

    console.log('Fetching products from Firebase...');
    const startTime = Date.now();
    
    // Fetch from Firebase with timeout
    const snap = await Promise.race([
      get(child(dbRef, 'products')),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 10000)
      )
    ]);
    
    const products = toProductsArray(snap);
    
    // Update cache
    cache.products = products;
    cache.lastProductsUpdate = Date.now();
    
    const fetchTime = Date.now() - startTime;
    console.log(`Products fetched in ${fetchTime}ms, cached for ${cache.TTL}ms`);
    
    res.json(products);
  } catch (err) {
    console.error('GET /api/products error:', err);
    
    // Return cached data if available, even if expired
    if (cache.products) {
      console.log('Returning expired cache due to error');
      return res.json(cache.products);
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch products',
      error: err.message 
    });
  }
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snap = await get(child(dbRef, `products/${id}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ id, ...snap.val() });
  } catch (err) {
    console.error('GET /api/products/:id error:', err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// CREATE product
app.post('/api/products', async (req, res) => {
  try {
    // New schema: name, price, productId, imageUrl, sellerId, sellerName
    const { name, price, imageUrl, sellerId, sellerName, productId, categoryId, categoryName } = req.body || {};
    // Backward compatibility for old fields
    const finalName = name || req.body?.dish_Name;
    const finalPrice = price || req.body?.dish_Price;
    const finalProductId = productId || req.body?.dish_Id || `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (!finalName || !finalPrice || !categoryId) {
      return res.status(400).json({ message: 'name, price and categoryId are required' });
    }
    const product = {
      name: finalName,
      price: finalPrice,
      productId: finalProductId,
      imageUrl: imageUrl || '',
      ...(sellerId ? { sellerId } : {}),
      ...(sellerName ? { sellerName } : {}),
      // category linkage (now required)
      categoryId,
      ...(categoryName ? { categoryName } : {}),
    };
    const newRef = push(child(dbRef, 'products'));
    await set(newRef, product);
    
    // Invalidate products cache
    cache.products = null;
    cache.lastProductsUpdate = 0;
    console.log('Products cache invalidated due to creation');
    
    res.status(201).json({ id: newRef.key, ...product });
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// UPDATE product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    await update(child(dbRef, `products/${id}`), updates);
    
    // Invalidate products cache
    cache.products = null;
    cache.lastProductsUpdate = 0;
    console.log('Products cache invalidated due to update');
    
    const snap = await get(child(dbRef, `products/${id}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ id, ...snap.val() });
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await remove(child(dbRef, `products/${id}`));
    
    // Invalidate products cache
    cache.products = null;
    cache.lastProductsUpdate = 0;
    console.log('Products cache invalidated due to deletion');
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Categories CRUD ------------------------------------------------------------
const toArray = (snap) => {
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.entries(val).map(([id, item]) => ({ id, ...item }));
};

app.get('/api/categories', async (req, res) => {
  try {
    // Try cache first
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      return res.json(cachedCategories);
    }

    console.log('Fetching categories from Firebase...');
    const startTime = Date.now();
    
    // Fetch from Firebase with timeout
    const snap = await Promise.race([
      get(child(dbRef, 'categories')),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 5000)
      )
    ]);
    
    const categories = toArray(snap);
    
    // Update cache
    cache.categories = categories;
    cache.lastCategoriesUpdate = Date.now();
    
    const fetchTime = Date.now() - startTime;
    console.log(`Categories fetched in ${fetchTime}ms, cached for ${cache.TTL}ms`);
    
    res.json(categories);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    
    // Return cached data if available, even if expired
    if (cache.categories) {
      console.log('Returning expired cache due to error');
      return res.json(cache.categories);
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch categories',
      error: err.message 
    });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description = '' } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const newRef = push(child(dbRef, 'categories'));
    const category = { name, description };
    await set(newRef, category);
    
    // Invalidate categories cache
    cache.categories = null;
    cache.lastCategoriesUpdate = 0;
    console.log('Categories cache invalidated due to creation');
    
    res.status(201).json({ id: newRef.key, ...category });
  } catch (err) {
    console.error('POST /api/categories error:', err);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await update(child(dbRef, `categories/${id}`), req.body || {});
    const snap = await get(child(dbRef, `categories/${id}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ id, ...snap.val() });
  } catch (err) {
    console.error('PUT /api/categories/:id error:', err);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await remove(child(dbRef, `categories/${id}`));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/categories/:id error:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Inventory CRUD (keyed by product id) --------------------------------------
app.get('/api/inventory', async (req, res) => {
  try {
    const snap = await get(child(dbRef, 'inventory'));
    res.json(toArray(snap));
  } catch (err) {
    console.error('GET /api/inventory error:', err);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
});

app.get('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const snap = await get(child(dbRef, `inventory/${productId}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ productId, ...snap.val() });
  } catch (err) {
    console.error('GET /api/inventory/:productId error:', err);
    res.status(500).json({ message: 'Failed to fetch inventory item' });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { productId, stock = 0, sellerId = null } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const item = { stock: Number(stock) || 0, ...(sellerId ? { sellerId } : {}) };
    await set(child(dbRef, `inventory/${productId}`), item);
    res.status(201).json({ productId, ...item });
  } catch (err) {
    console.error('POST /api/inventory error:', err);
    res.status(500).json({ message: 'Failed to upsert inventory' });
  }
});

app.put('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body || {};
    await update(child(dbRef, `inventory/${productId}`), updates);
    const snap = await get(child(dbRef, `inventory/${productId}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ productId, ...snap.val() });
  } catch (err) {
    console.error('PUT /api/inventory/:productId error:', err);
    res.status(500).json({ message: 'Failed to update inventory' });
  }
});

app.delete('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await remove(child(dbRef, `inventory/${productId}`));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/inventory/:productId error:', err);
    res.status(500).json({ message: 'Failed to delete inventory' });
  }
});

// Order statuses -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  try {
    const snap = await get(child(dbRef, 'orders'));
    res.json(toArray(snap));
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });
    await update(child(dbRef, `orders/${id}`), { status });
    const snap = await get(child(dbRef, `orders/${id}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json({ id, ...snap.val() });
  } catch (err) {
    console.error('PUT /api/orders/:id/status error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// When deleting a product, also remove its inventory entry
const originalDelete = app._router.stack.find(r => r.route && r.route.path === '/api/products/:id' && r.route.methods.delete);
if (originalDelete) {
  // Replace handler to also delete inventory
  originalDelete.route.stack[0].handle = async (req, res) => {
    try {
      const { id } = req.params;
      await remove(child(dbRef, `products/${id}`));
      await remove(child(dbRef, `inventory/${id}`));
      res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('DELETE /api/products/:id error:', err);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  };
}

// Users endpoint -------------------------------------------------------------
app.post('/api/users', async (req, res) => {
  try {
    const { userName, email, ...rest } = req.body || {};
    if (!userName || !email) {
      return res.status(400).json({ message: 'userName and email are required' });
    }
    const newRef = push(child(dbRef, 'users'));
    const user = { userName, email, ...rest };
    await set(newRef, user);
    res.status(201).json({ id: newRef.key, ...user });
  } catch (error) {
    console.error('POST /api/users error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Cart API -------------------------------------------------------------------
// Data model: carts/{cartId}/items/{productId} => { productId, name, price, quantity, imageUrl }
const cartPath = (cartId) => `carts/${cartId}`;
const cartItemsPath = (cartId) => `${cartPath(cartId)}/items`;

// Get cart with computed total
app.get('/api/cart/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    const snap = await get(child(dbRef, cartItemsPath(cartId)));
    const itemsObj = snap.exists() ? snap.val() : {};
    const items = Object.values(itemsObj || {});
    const total = items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
    res.json({ items, total: Number(total.toFixed(2)) });
  } catch (err) {
    console.error('GET /api/cart/:cartId error:', err);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Add item (upsert by productId, increment quantity)
app.post('/api/cart/:cartId/add', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productId, name, price, imageUrl, quantity = 1, categoryName } = req.body || {};
    if (!productId || !name) return res.status(400).json({ message: 'productId and name are required' });
    const itemRef = child(dbRef, `${cartItemsPath(cartId)}/${productId}`);
    const snap = await get(itemRef);
    const existing = snap.exists() ? snap.val() : null;
    const newQty = (existing?.quantity || 0) + Number(quantity || 1);
    const item = {
      productId,
      name,
      price: Number(price) || 0,
      quantity: newQty,
      ...(imageUrl ? { imageUrl } : {}),
      ...(categoryName ? { categoryName } : {}),
    };
    await set(itemRef, item);
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/cart/:cartId/add error:', err);
    res.status(500).json({ message: 'Failed to add to cart' });
  }
});

// Update item quantity (set absolute quantity)
app.put('/api/cart/:cartId/items/:productId', async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body || {};
    if (quantity == null) return res.status(400).json({ message: 'quantity is required' });
    await update(child(dbRef, `${cartItemsPath(cartId)}/${productId}`), { quantity: Number(quantity) || 0 });
    const snap = await get(child(dbRef, `${cartItemsPath(cartId)}/${productId}`));
    if (!snap.exists()) return res.status(404).json({ message: 'Not found' });
    res.json(snap.val());
  } catch (err) {
    console.error('PUT /api/cart/:cartId/items/:productId error:', err);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
});

// Remove item
app.delete('/api/cart/:cartId/items/:productId', async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    await remove(child(dbRef, `${cartItemsPath(cartId)}/${productId}`));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/cart/:cartId/items/:productId error:', err);
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
});

// Clear cart
app.delete('/api/cart/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    await remove(child(dbRef, cartItemsPath(cartId)));
    res.json({ message: 'Cleared' });
  } catch (err) {
    console.error('DELETE /api/cart/:cartId error:', err);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

// Create order from cart
app.post('/api/orders', async (req, res) => {
  try {
    const { cartId, customerName, table, restaurantId = 'default' } = req.body || {};
    if (!cartId || !customerName || !table) return res.status(400).json({ message: 'cartId, customerName and table are required' });
    const snap = await get(child(dbRef, cartItemsPath(cartId)));
    const itemsObj = snap.exists() ? snap.val() : {};
    const items = Object.values(itemsObj || {});
    if (items.length === 0) return res.status(400).json({ message: 'Cart is empty' });
    const total = items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
    const order = {
      customerName,
      table,
      restaurantId,
      items,
      total: Number(total.toFixed(2)),
      status: 'pending',
      createdAt: Date.now(),
    };
    const newRef = push(child(dbRef, 'orders'));
    await set(newRef, order);
    // clear cart after order
    await remove(child(dbRef, cartItemsPath(cartId)));
    res.status(201).json({ id: newRef.key, ...order });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 2000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
module.exports = app;