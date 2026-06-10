import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const indexPath = path.join(__dirname, 'index.html');
let indexHtml = '';

try {
  indexHtml = fs.readFileSync(indexPath, 'utf8');
} catch (err) {
  console.error('Failed to load index.html:', err);
  process.exit(1);
}

// Serve static assets from the /src folder at the /src URL path.
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve the root index.html for all client routes and inject the API key.
app.get('*', (req, res) => {
  const apiKey = process.env.API_SPORTS_KEY || process.env.VITE_SPORTS_API_KEY || '';
  const renderedHtml = indexHtml.replace('__API_SPORTS_KEY__', apiKey);
  res.type('html').send(renderedHtml);
});

app.listen(PORT, () => {
  console.log(`StatLock server running on port ${PORT}`);
});
