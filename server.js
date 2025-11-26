import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite
const dbPath = path.join(DATA_DIR, 'photos.db');
const db = new Database(dbPath);

console.log(`Connected to database at ${dbPath}`);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    imageUrl TEXT,
    timestamp INTEGER,
    caption TEXT,
    x REAL,
    y REAL,
    rotation REAL,
    ip_address TEXT
  )
`);

// Migration: Check if ip_address column exists (for users upgrading from previous version)
try {
  const tableInfo = db.prepare("PRAGMA table_info(photos)").all();
  const hasIpColumn = tableInfo.some(col => col.name === 'ip_address');
  if (!hasIpColumn) {
    console.log("Migrating database: Adding ip_address column...");
    db.exec("ALTER TABLE photos ADD COLUMN ip_address TEXT");
  }
} catch (err) {
  console.error("Migration check failed:", err);
}

app.use(express.json({ limit: '50mb' })); // Large limit for base64 images

// Middleware to get IP safely
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
};

// API Endpoints

// Get all photos
app.get('/api/photos', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos ORDER BY timestamp ASC').all();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a new photo
app.post('/api/photos', (req, res) => {
  try {
    const { id, imageUrl, timestamp, caption, x, y, rotation } = req.body;
    const ip = getClientIp(req);
    
    console.log(`Saving photo ${id} from IP: ${ip}`);

    const stmt = db.prepare(`
      INSERT INTO photos (id, imageUrl, timestamp, caption, x, y, rotation, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, imageUrl, timestamp, caption, x, y, rotation, ip);
    res.json({ success: true });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update photo position
app.patch('/api/photos/:id', (req, res) => {
  try {
    const { x, y } = req.body;
    const stmt = db.prepare('UPDATE photos SET x = ?, y = ? WHERE id = ?');
    stmt.run(x, y, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a photo
app.delete('/api/photos/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM photos WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
// In production (Docker), we serve the 'dist' folder.
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    // Inject API Key safely for the browser runtime
    // We use a safer replacement pattern to avoid issues if ENV_INJECTION isn't present
    const apiKeyScript = `<script>window.process = { env: { API_KEY: "${process.env.API_KEY || ''}" } };</script>`;
    
    if (html.includes('<!-- ENV_INJECTION -->')) {
      html = html.replace('<!-- ENV_INJECTION -->', apiKeyScript);
    } else {
      // Fallback injection if comment is missing
      html = html.replace('</head>', `${apiKeyScript}</head>`);
    }
    
    res.send(html);
  } else {
    res.status(404).send('Application not built. Run npm run build.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Database located at ${dbPath}`);
});