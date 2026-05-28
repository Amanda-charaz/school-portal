import send from 'send';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the absolute jail path. 
// This resolves to d:\school-portal\backend\public_uploads
const UPLOADS_ROOT = path.resolve(__dirname, '../../public_uploads');

/**
 * Safely streams static assets or documents while enforcing directory boundaries.
 */
export const serveSecureFile = (req, res) => {
  const fileRequested = req.query.name;

  if (!fileRequested) {
    return res.status(400).json({ message: 'File name parameter is required.' });
  }

  // Initialize the send stream targeting the requested file
  const stream = send(req, fileRequested, {
    root: UPLOADS_ROOT,      // 🔒 The Jail: blocks any path resolving outside this directory
    dotfiles: 'ignore',      // 🚫 Hide sensitive files like .env or .git
    maxAge: '1d'             // ⚡ Cache for performance
  });

  // Set security headers before streaming
  stream.on('headers', (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    // Force download if needed, or leave for browser preview
    // res.setHeader('Content-Disposition', 'inline'); 
  });

  // Handle errors (404, 403, etc.)
  stream.on('error', (err) => {
    if (err.status === 404) {
      return res.status(404).json({ message: 'Requested asset could not be found.' });
    }
    // 403 is triggered by "send" if a traversal attempt is detected
    console.error(`🛑 Security Block: Access denied for ${fileRequested}`);
    return res.status(403).json({ message: 'Access Denied: Invalid security path.' });
  });

  // Pipe the file data to the response
  stream.pipe(res);
};