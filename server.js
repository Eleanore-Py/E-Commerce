const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const midtransClient = require('midtrans-client');
let multer;

const app = express();
const PORT = 3000;

// GANTI INI dengan Server Key asli Anda dari Dashboard Midtrans (Sandbox/Production)
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-K_NqNqYnFq0Q_4_m6_h_m'; // Contoh Demo Key
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-L_K_v_p_h_m';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY
});

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const activeAdminTokens = new Set();

app.use(cors());
app.use(bodyParser.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const pairs = header.split(';');
  const out = {};
  for (const part of pairs) {
    const [k, ...rest] = part.split('=');
    if (!k) continue;
    const key = k.trim();
    if (!key) continue;
    const value = rest.join('=') || '';
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function getAdminToken(req) {
  const cookies = parseCookies(req);
  return cookies.adminToken;
}

function isAuthenticated(req) {
  const token = getAdminToken(req);
  return token && activeAdminTokens.has(token);
}

function requireAdmin(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

const db = new sqlite3.Database('./server.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'assets', 'images');
const uploadFlagPath = path.join(__dirname, 'assets', '.upload_flag');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {}

// Lazy-load multer to avoid crash if not installed
try {
  multer = require('multer');
} catch (e) {
  console.warn('multer not installed. Run: npm install multer');
}

let upload;
if (multer) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeBase = (path.basename(file.originalname || 'upload', ext) || 'upload')
        .replace(/[^a-z0-9-_]/gi, '_')
        .toLowerCase();
      const stamp = Date.now();
      cb(null, `${safeBase}_${stamp}${ext}`);
    }
  });
  const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowed.has((file.mimetype || '').toLowerCase())) return cb(new Error('invalid_type'));
      cb(null, true);
    }
  });
}

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price REAL,
      originalPrice REAL,
      sold INTEGER,
      imageKey TEXT,
      description TEXT,
      sizeChartImageKey TEXT,
      category TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      user TEXT,
      rating INTEGER,
      comment TEXT,
      date TEXT,
      FOREIGN KEY(productId) REFERENCES products(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT UNIQUE,
      address TEXT
    )`);

    // Tambah kolom category jika belum ada (untuk DB lama)
    db.all(`PRAGMA table_info(products)`, [], (err, rows) => {
      if (!err) {
        const hasCategory = Array.isArray(rows) && rows.some(r => r.name === 'category');
        if (!hasCategory) {
          db.run(`ALTER TABLE products ADD COLUMN category TEXT`, [], (e) => {
            if (e) console.log('Info: kolom category sudah ada atau gagal menambah:', e.message);
          });
        }
      }
    });

    // Tidak ada seeding: biarkan katalog kosong sampai admin upload/menambah produk
    db.get("SELECT count(*) as count FROM products", [], (err, row) => {
      if (err) return console.error(err.message);
    });
  });
}

// Auth routes

app.get('/login', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veston Admin Login</title>
      <style>
        @font-face {
          font-family: 'Evogria';
          src: url('/assets/fonts/Evogria.otf');
        }
        body { margin:0; font-family: 'Inter','Segoe UI',sans-serif; background:#000000; color:#ffffff; display:flex; align-items:center; justify-content:center; min-height:100vh; overflow: hidden; }
        .bg-image {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: url('/assets/images/Bg.jpg') no-repeat center center;
          background-size: cover;
          filter: brightness(0.5);
          z-index: -1;
        }
        .card { 
          background: rgba(0, 0, 0, 0.7); 
          padding: 40px; 
          border-radius: 24px; 
          backdrop-filter: blur(10px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
          width: 100%; 
          max-width: 400px; 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          text-align: center;
        }
        h1 { 
          margin: 0 0 10px; 
          font-family: 'Evogria', sans-serif;
          font-size: 3rem; 
          letter-spacing: 2px;
          color: #ffffff;
        }
        p.sub { margin:0 0 30px; font-size:1rem; color:rgba(255,255,255,0.7); }
        .field { margin-bottom:20px; text-align: left; }
        label { display:block; font-size:0.8rem; margin-bottom:8px; color:rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; }
        input { 
          width:100%; 
          padding:12px 16px; 
          border-radius:12px; 
          border:1px solid rgba(255,255,255,0.2); 
          background: rgba(255,255,255,0.05); 
          color:#ffffff; 
          font-size:1rem; 
          outline:none; 
          transition: all 0.3s ease;
        }
        input:focus { border-color:#ffffff; background: rgba(255,255,255,0.1); }
        button { 
          width:100%; 
          margin-top:10px; 
          padding:14px 0; 
          border:none; 
          border-radius:30px; 
          background:#ffffff; 
          color:#000000; 
          font-family: 'Evogria', sans-serif;
          font-weight:600; 
          font-size:1.1rem; 
          cursor:pointer; 
          transition: transform 0.2s, opacity 0.2s;
        }
        button:hover { transform: scale(1.02); opacity: 0.9; }
        .error { margin-top:15px; font-size:0.9rem; color:#ff4d4d; min-height:20px; }
        .hint { margin-top:20px; font-size:0.8rem; color:rgba(255,255,255,0.4); }
        .hint code { background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; }
      </style>
    </head>
    <body>
      <div class="bg-image"></div>
      <div class="card">
        <h1>Veston</h1>
        <p class="sub">Admin Portal</p>
        <form id="loginForm">
          <div class="field">
            <label for="username">Username</label>
            <input id="username" autocomplete="username" required>
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" autocomplete="current-password" required>
          </div>
          <button type="submit">Masuk</button>
          <div id="error" class="error"></div>
          <div class="hint">Default: <code>${ADMIN_USER}</code> / <code>${ADMIN_PASS}</code> (ubah via ENV)</div>
        </form>
      </div>
      <script>
        const form = document.getElementById('loginForm');
        const errEl = document.getElementById('error');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          errEl.textContent = '';
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          try {
            const res = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              window.location.href = '/';
            } else {
              errEl.textContent = data.error === 'invalid_credentials' ? 'Username atau password salah' : (data.error || 'Gagal login');
            }
          } catch (e) {
            errEl.textContent = 'Tidak dapat terhubung ke server';
          }
        });
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    activeAdminTokens.add(token);
    res.cookie('adminToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.json({ message: 'success' });
  }
  return res.status(401).json({ error: 'invalid_credentials' });
});

app.post('/logout', (req, res) => {
  const token = getAdminToken(req);
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.clearCookie('adminToken');
  res.json({ message: 'success' });
});

// User Auth Routes
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }

  const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
  db.run(sql, [username, password, email], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully', id: this.lastID });
  });
});

app.post('/api/user/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const sql = 'SELECT id, username, email, address FROM users WHERE username = ? AND password = ?';
  db.get(sql, [username, password], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });
    
    res.json({ message: 'Login successful', user: row });
  });
});

app.put('/api/user/address', (req, res) => {
  const { userId, address } = req.body;
  if (!userId || address === undefined) {
    return res.status(400).json({ error: 'UserId and address are required' });
  }

  const sql = 'UPDATE users SET address = ? WHERE id = ?';
  db.run(sql, [address, userId], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Address updated successfully' });
  });
});

// API Endpoints

app.get('/', async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
  }
  // Promise wrapper for database queries
  const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // Fetch data in parallel
    const [products, reviews, stats] = await Promise.all([
      query("SELECT * FROM products ORDER BY id ASC"),
      query("SELECT r.*, p.name as productName, p.imageKey FROM reviews r JOIN products p ON r.productId = p.id ORDER BY r.date DESC LIMIT 5"),
      query(`
        SELECT 
          (SELECT COUNT(*) FROM products) as totalProducts,
          (SELECT SUM(sold) FROM products) as totalSold,
          (SELECT COUNT(*) FROM reviews) as totalReviews,
          (SELECT AVG(rating) FROM reviews) as avgRating
      `)
    ]);

    const stat = stats[0];
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.sold), 0);
    const isInitialEmpty = products.length === 0;
    
    // Formatting currency
    const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Veston Admin Dashboard</title>
        <style>
          @font-face {
            font-family: 'Evogria';
            src: url('/assets/fonts/Evogria.otf');
          }
          :root {
            --primary: #000000;
            --accent: #1a1a1a;
            --bg: #ffffff;
            --card-bg: #ffffff;
            --text: #000000;
            --text-light: #666666;
            --border: #eeeeee;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); padding-bottom: 50px; }
          
          .navbar { 
            background: var(--primary); 
            padding: 1rem 2.5rem; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            position: sticky; 
            top: 0; 
            z-index: 100; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          }
          .brand { 
            font-family: 'Evogria', sans-serif;
            font-size: 1.8rem; 
            color: #ffffff; 
            letter-spacing: 2px;
          }
          .brand span { color: #888888; font-size: 1rem; margin-left: 10px; font-family: sans-serif; letter-spacing: 0; }
          .server-status { font-size: 0.8rem; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }
          .server-status::before { content: ''; width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: block; animation: pulse 2s infinite; }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

          .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
          .stat-card { 
            background: var(--card-bg); 
            padding: 2rem; 
            border-radius: 16px; 
            border: 1px solid var(--border); 
            text-align: center;
            transition: all 0.3s ease;
          }
          .stat-card:hover { border-color: var(--primary); transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
          .stat-label { color: var(--text-light); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
          .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

          .section-title { 
            font-family: 'Evogria', sans-serif;
            font-size: 1.2rem; 
            margin-bottom: 1.5rem; 
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--primary);
            display: inline-block;
          }
          .grid-layout { display: grid; grid-template-columns: 1fr; gap: 2rem; }
          
          .card { background: var(--card-bg); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
          .table-container { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #fafafa; padding: 1.2rem 1rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-light); border-bottom: 2px solid var(--border); }
          td { padding: 1.2rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
          
          .product-cell { display: flex; align-items: center; gap: 15px; }
          .product-img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); }
          
          .input { 
            padding: 10px 14px; 
            border: 1px solid var(--border); 
            border-radius: 8px; 
            font-size: 0.9rem; 
            outline: none;
            transition: border-color 0.3s;
            font-family: inherit;
          }
          textarea.input {
            min-height: 120px;
            resize: vertical;
          }
          .input:focus { border-color: var(--primary); }
          
          .btn { 
            padding: 10px 20px; 
            border: none; 
            border-radius: 30px; 
            background: var(--primary); 
            color: #fff; 
            font-weight: 600; 
            cursor: pointer; 
            font-size: 0.85rem;
            transition: opacity 0.2s;
          }
          .btn:hover { opacity: 0.8; }
          .btn-danger { background: #ff4d4d; }
          
          .badge { padding: 4px 12px; border-radius: 30px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
          .badge-success { background: #e6fffa; color: #008672; }

          .review-list { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; padding: 1.5rem; }
          .review-item { padding: 1.5rem; background: #fcfcfc; border: 1px solid var(--border); border-radius: 12px; }
          .reviewer { font-weight: 800; font-size: 1rem; display: block; margin-bottom: 0.2rem; }
          .stars { color: #000; font-size: 1rem; margin-bottom: 0.5rem; }

          @media (min-width: 1024px) {
            .grid-layout { grid-template-columns: 2.5fr 1fr; }
          }
          
          .admin-form { padding: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
          .form-full { grid-column: 1 / -1; }
          .preview-container { 
            grid-column: 1 / -1; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 10px; 
            margin-top: 10px;
            padding: 15px;
            border: 2px dashed var(--border);
            border-radius: 12px;
            position: relative;
          }
          #imagePreview { 
            max-width: 200px; 
            max-height: 200px; 
            border-radius: 8px; 
            display: none; 
            object-fit: contain;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .delete-preview-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4d4d;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: none;
            font-weight: bold;
            line-height: 24px;
            text-align: center;
          }
          .preview-label { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        <nav class="navbar">
          <div class="brand">VESTON <span>ADMIN PANEL</span></div>
          <div style="display:flex; align-items:center; gap:20px">
            <div class="server-status">Live</div>
            <button class="btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2)" onclick="logout()">Logout</button>
          </div>
        </nav>

        <div class="container">
          <!-- Stats Row -->
          ${!isInitialEmpty ? `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">${formatIDR(totalRevenue)}</div>
              <span class="stat-sub">Estimated from sold items</span>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Products</div>
              <div class="stat-value">${stat.totalProducts}</div>
              <span class="stat-sub">Active in catalog</span>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Sold Items</div>
              <div class="stat-value">${Number(stat?.totalSold || 0).toLocaleString('id-ID')}</div>
              <span class="stat-sub">Units across all products</span>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Rating</div>
              <div class="stat-value">${stat.avgRating ? stat.avgRating.toFixed(1) : '0.0'} <span style="font-size:1rem; color:#f59e0b">★</span></div>
              <span class="stat-sub">Based on ${stat.totalReviews} reviews</span>
            </div>
          </div>` : ''}

          <div class="grid-layout">
            <!-- Products Table -->
            <div class="main-col">
              ${!isInitialEmpty ? `
              <div class="section-title">Product Inventory</div>
              <div class="card">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Sold</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${products.length ? products.map(p => `
                        <tr>
                          <td>
                            <div class="product-cell">
                              <img src="/assets/images/${p.imageKey}" class="product-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/500'">
                              <div>
                                <div style="font-weight:800; text-transform:uppercase">${p.name}</div>
                                <div style="font-size:0.7rem; color:#888; text-transform:uppercase; letter-spacing:1px">${p.category || 'General'}</div>
                              </div>
                            </div>
                          </td>
                          <td style="font-weight:700">${formatIDR(p.price || 0)}</td>
                          <td style="font-weight:700">${Number(p.sold || 0).toLocaleString('id-ID')}</td>
                          <td><span class="badge badge-success">Live</span></td>
                          <td>
                            <div style="display:flex; gap:5px">
                              <input class="input" id="price_${p.id}" type="number" value="${p.price || 0}" style="width:100px">
                              <input class="input" id="sold_${p.id}" type="number" value="${p.sold || 0}" style="width:80px">
                              <button class="btn" onclick="updateProduct(${p.id})">Save</button>
                              <button class="btn btn-danger" onclick="deleteProduct(${p.id})">×</button>
                            </div>
                          </td>
                        </tr>
                      `).join('') : ''}
                    </tbody>
                  </table>
                </div>
              </div>` : ''}
              
              <div style="margin-top:2rem">
                <div class="section-title">Add New Product</div>
                <div class="card">
                  <div class="admin-form">
                    <input id="name" class="input" placeholder="Product Name">
                    <input id="price" class="input" placeholder="Price" type="number">
                    <input id="originalPrice" class="input" placeholder="Original Price" type="number">
                    <input id="sold" class="input" placeholder="Initial Sold Count" type="number">
                    
                    <div style="display:flex; gap:10px; grid-column: 1 / -1">
                      <input id="imageKey" class="input" placeholder="Image Filename" style="flex:1" readonly>
                      <input id="imageFile" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" onchange="autoUploadImage(this)">
                      <button class="btn" onclick="document.getElementById('imageFile').click()">Select & Upload Image</button>
                    </div>

                    <div class="preview-container" id="previewContainer">
                      <span class="preview-label">Image Preview</span>
                      <img id="imagePreview" src="#" alt="Preview">
                      <button class="delete-preview-btn" id="deletePreviewBtn" onclick="removeImage()">×</button>
                    </div>

                    <select id="category" class="input">
                      <option value="">Select Category</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="denim">Denim</option>
                      <option value="varsity">Varsity</option>
                      <option value="windbreaker">Windbreaker</option>
                      <option value="parka">Parka</option>
                      <option value="harrington">Harrington</option>
                      <option value="leather">Leather</option>
                      <option value="puffer">Puffer</option>
                      <option value="track">Track</option>
                      <option value="anorak">Anorak</option>
                    </select>
                    <textarea id="description" class="input form-full" placeholder="Product Description"></textarea>
                    <button class="btn form-full" style="padding:15px" onclick="addProduct()">Publish Product</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Reviews -->
            ${!isInitialEmpty ? `
            <div class="side-col">
              <div class="section-title">Recent Reviews</div>
              <div class="card">
                <ul class="review-list">
                  ${reviews.length > 0 ? reviews.map(r => `
                    <li class="review-item">
                      <div class="review-header">
                        <span class="reviewer">${r.user}</span>
                       <span class="review-date">${new Date(r.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                      <p class="review-text">"${r.comment}"</p>
                      <span class="review-product">On: ${r.productName}</span>
                      <div style="margin-top:8px">
                        <button class="btn btn-danger" data-user="${encodeURIComponent(r.user)}" onclick="deleteReview(${r.id}, decodeURIComponent(this.dataset.user))">Delete</button>
                      </div>
                    </li>
                  `).join('') : '<li style="padding:1rem; text-align:center; color:#6b7280">No reviews yet</li>'}
                </ul>
              </div>
              
              <div style="margin-top: 2rem;">
                <div class="section-title">API Endpoints</div>
                <div class="api-info">
                  <div><span class="method">GET</span> /api/products</div>
                  <div style="margin-top:8px"><span class="method">POST</span> /api/reviews</div>
                  <div style="margin-top:8px"><span class="method">POST</span> /api/products</div>
                  <div style="margin-top:8px"><span class="method">PUT</span> /api/products/:id</div>
                  <div style="margin-top:8px"><span class="method">DELETE</span> /api/products/:id</div>
                  <div style="margin-top:8px"><span class="method">GET</span> /api/reviews</div>
                  <div style="margin-top:8px"><span class="method">PUT</span> /api/reviews/:id</div>
                  <div style="margin-top:8px"><span class="method">DELETE</span> /api/reviews/:id</div>
                  <div style="margin-top:8px; color:#64748b; font-size:0.75rem">Server running at http://0.0.0.0:${PORT}</div>
                </div>
              </div>
            </div>` : ''}
          </div>
          
          <div class="footer">
            &copy; 2025 Veston Inc. Server Dashboard v1.2
          </div>
        </div>
        <script>
          function previewFile(file) {
            const preview = document.getElementById('imagePreview');
            const deleteBtn = document.getElementById('deletePreviewBtn');
            const reader = new FileReader();

            reader.onload = function(e) {
              preview.src = e.target.result;
              preview.style.display = 'block';
              deleteBtn.style.display = 'block';
            }
            reader.readAsDataURL(file);
          }

          async function autoUploadImage(input) {
            const file = input.files[0];
            if (!file) return;

            // 1. Preview locally first
            previewFile(file);

            // 2. Upload to server immediately
            const fd = new FormData();
            fd.append('file', file);
            
            try {
              const res = await fetch('/api/upload', { method: 'POST', body: fd });
              const data = await res.json();
              if (res.ok) {
                document.getElementById('imageKey').value = data.fileName;
              } else {
                alert(data.error || 'Gagal upload');
                removeImage();
              }
            } catch (e) {
              alert('Gagal terhubung ke server');
              removeImage();
            }
          }

          function removeImage() {
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('imagePreview').src = '#';
            document.getElementById('deletePreviewBtn').style.display = 'none';
            document.getElementById('imageKey').value = '';
            document.getElementById('imageFile').value = '';
          }

          async function addProduct() {
            const payload = {
              name: document.getElementById('name').value,
              price: Number(document.getElementById('price').value),
              originalPrice: Number(document.getElementById('originalPrice').value),
              sold: Number(document.getElementById('sold').value),
              imageKey: document.getElementById('imageKey').value,
              description: document.getElementById('description').value,
              category: document.getElementById('category').value
            };
            const res = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) location.reload(); else alert(data.error || 'Gagal menambah');
          }
          async function uploadImage(fileInputId, targetInputId) {
            const f = document.getElementById(fileInputId);
            if (!f || !f.files || !f.files[0]) { alert('Pilih file gambar'); return; }
            const fd = new FormData();
            fd.append('file', f.files[0]);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
              document.getElementById(targetInputId).value = data.fileName;
              alert('Upload berhasil: ' + data.fileName);
            } else {
              alert(data.error || 'Gagal upload');
            }
          }
          async function deleteProduct(id) {
            if (!confirm('Hapus produk ' + id + '?')) return;
            const res = await fetch('/api/products/' + id, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) location.reload(); else alert(data.error || 'Gagal menghapus');
          }
          async function updateProduct(id) {
            const priceVal = Number(document.getElementById('price_' + id).value);
            const soldVal = Number(document.getElementById('sold_' + id).value);
            const payload = {};
            if (!Number.isNaN(priceVal)) payload.price = priceVal;
            if (!Number.isNaN(soldVal)) payload.sold = soldVal;
            if (!('price' in payload) && !('sold' in payload)) { alert('Isi price atau sold'); return; }
            const res = await fetch('/api/products/' + id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) location.reload(); else alert(data.error || 'Gagal mengubah');
          }
          async function deleteReview(id, user) {
            if (!confirm('Hapus review #' + id + '?')) return;
            const res = await fetch('/api/reviews/' + id + '?user=' + encodeURIComponent(user), { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) location.reload(); else alert(data.error || 'Gagal menghapus');
          }
          async function logout() {
            const res = await fetch('/logout', { method: 'POST' });
            if (res.ok) {
              window.location.href = '/login';
            } else {
              alert('Gagal logout');
            }
          }
        </script>
      </body>
      </html>
    `;
    res.send(html);

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

// Get all products with calculated ratings
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  const baseSql = `
    SELECT p.*, 
    (SELECT json_group_array(json_object('id', r.id, 'user', r.user, 'rating', r.rating, 'comment', r.comment, 'date', r.date)) 
     FROM reviews r WHERE r.productId = p.id) as reviews
    FROM products p
  `;
  const sql = category ? `${baseSql} WHERE p.category = ?` : baseSql;
  const params = category ? [category] : [];
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }

    // Process rows to calculate ratings
    const products = rows.map(row => {
      const reviews = row.reviews ? JSON.parse(row.reviews) : [];
      
      let totalScore = 0;
      const distribution = [0, 0, 0, 0, 0];
      
      reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[5 - r.rating]++;
          totalScore += r.rating;
        }
      });
      
      const count = reviews.length;
      const stars = count > 0 ? parseFloat((totalScore / count).toFixed(1)) : 0;
      
      return {
        ...row,
        rating: {
          stars,
          count,
          distribution
        },
        reviews: reviews.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.json({
      "message": "success",
      "data": products
    });
  });
});

// Add review
app.post('/api/reviews', (req, res) => {
  const { productId, user, rating, comment, date } = req.body;
  const sql = 'INSERT INTO reviews (productId, user, rating, comment, date) VALUES (?,?,?,?,?)';
  const params = [productId, user, rating, comment, date];
  
  db.run(sql, params, function (err, result) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "id": this.lastID
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json({ message: 'success', data: row });
  });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, price, originalPrice, sold, imageKey, description, sizeChartImageKey, category } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'invalid_payload' });
  db.get('SELECT COALESCE(MAX(id),0)+1 as nextId FROM products', [], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    const id = row.nextId;
    const sql = 'INSERT INTO products (id, name, price, originalPrice, sold, imageKey, description, sizeChartImageKey, category) VALUES (?,?,?,?,?,?,?,?,?)';
    const params = [id, name, price || 0, originalPrice || 0, sold || 0, imageKey || '', description || '', sizeChartImageKey || '', category || null];
    db.run(sql, params, function (e) {
      if (e) return res.status(400).json({ error: e.message });
      res.json({ message: 'success', id });
    });
  });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const fields = ['name','price','originalPrice','sold','imageKey','description','sizeChartImageKey','category'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });
  if (updates.length === 0) return res.status(400).json({ error: 'no_fields' });
  values.push(id);
  db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'success', changes: this.changes });
  });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // 1. Dapatkan nama file gambar sebelum menghapus data produk
  db.get('SELECT imageKey FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not_found' });

    const fileName = row.imageKey;

    db.serialize(() => {
      // 2. Hapus review terkait
      db.run('DELETE FROM reviews WHERE productId = ?', [id]);
      
      // 3. Hapus data produk dari database
      db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) return res.status(400).json({ error: err.message });

        // 4. Jika berhasil hapus dari DB, hapus file fisik gambarnya
        if (fileName) {
          const filePath = path.join(uploadDir, fileName);
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Gagal menghapus file fisik:', unlinkErr.message);
              // Tetap kirim sukses karena data di DB sudah terhapus
            } else {
              console.log(`File ${fileName} berhasil dihapus dari server.`);
            }
          });
        }
        
        res.json({ message: 'success', changes: this.changes });
      });
    });
  });
});

app.get('/api/reviews', (req, res) => {
  db.all('SELECT r.*, p.name as productName FROM reviews r JOIN products p ON p.id = r.productId ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'success', data: rows });
  });
});

app.put('/api/reviews/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const fields = ['user','rating','comment','date','productId'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });
  if (updates.length === 0) return res.status(400).json({ error: 'no_fields' });
  values.push(id);
  db.run(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, values, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'success', changes: this.changes });
  });
});

app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  if (isAuthenticated(req)) {
    db.run('DELETE FROM reviews WHERE id = ?', [id], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      return res.json({ message: 'success', changes: this.changes });
    });
  } else {
    const user = req.query.user || '';
    db.get('SELECT user FROM reviews WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'not_found' });
      if (row.user !== user) return res.status(401).json({ error: 'unauthorized' });
      db.run('DELETE FROM reviews WHERE id = ?', [id], function (e) {
        if (e) return res.status(400).json({ error: e.message });
        res.json({ message: 'success', changes: this.changes });
      });
    });
  }
});

app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

// Midtrans Snap Token
app.post('/api/payment/snap-token', async (req, res) => {
  const { order_id, amount, items, customer } = req.body;
  
  const parameter = {
    transaction_details: {
      order_id: order_id || `VESTON-${Date.now()}`,
      gross_amount: amount
    },
    item_details: items || [],
    customer_details: customer || {
      first_name: "Veston",
      last_name: "User",
      email: "user@veston.com"
    },
    credit_card: {
      secure: true
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Upload endpoint
if (upload) {
  app.post('/api/upload', requireAdmin, (req, res, next) => {
    upload.single('file')(req, res, function (err) {
      if (err) {
        const msg = err.message === 'invalid_type' ? 'invalid_file_type' : err.message || 'upload_error';
        return res.status(400).json({ error: msg });
      }
      if (!req.file) return res.status(400).json({ error: 'no_file' });
      return res.json({
        message: 'success',
        fileName: req.file.filename,
        url: `/assets/images/${req.file.filename}`
      });
    });
  });
} else {
  app.post('/api/upload', requireAdmin, (req, res) => {
    res.status(501).json({ error: 'multer_not_installed' });
  });
}
