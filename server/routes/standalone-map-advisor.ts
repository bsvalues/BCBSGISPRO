import express, { Router } from 'express';
import path from 'path';

const router = Router();

// Serve the standalone map advisor HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'src', 'pages', 'standalone-map-advisor.html'));
});

export default router;