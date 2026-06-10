import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from the /src folder at the /src URL path.
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve the root index.html for all client routes.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`StatLock server running on port ${PORT}`);
});
