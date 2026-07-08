import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1h',
  etag: false,
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', service: 'frontend' },
  });
});

// SPA routing fallback - serve index.html for all routes that don't match static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Frontend Server]', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`✓ Frontend server running on http://localhost:${PORT}`);
  console.log(`  Routes: / (home), /login, /register, /citizen, /mp-dashboard, /news, /settings`);
});
