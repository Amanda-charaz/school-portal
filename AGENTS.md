# School Portal - Agent Configuration

## CORS Configuration Fix

The backend has been updated to use environment-based CORS configuration instead of hardcoded origins.

### Files Changed
- `backend/server.js` - Updated CORS to use `FRONTEND_URL` environment variable
- `backend/index.js` - Updated CORS to use `FRONTEND_URL` environment variable and added OPTIONS handling
- `backend/.env` - Added `FRONTEND_URL=http://localhost:5173` for local development

### CORS Configuration Pattern
```javascript
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`❌ Blocked Origin: ${origin}`);
      return callback(new Error('CORS Policy Block'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Required Render Environment Variable
Add this environment variable to your Render backend deployment:

```
FRONTEND_URL=https://YOUR-ACTUAL-VERCEL-DOMAIN
```

Replace `YOUR-ACTUAL-VERCEL-DOMAIN` with your actual Vercel frontend URL (e.g., `https://school-portal-xxxxx.vercel.app`).

### Verification Steps
1. ✅ Backend server starts successfully with CORS configuration
2. ✅ Local development works with `http://localhost:5173`
3. ⚠️  Render needs `FRONTEND_URL` environment variable added
4. ⚠️  Render service needs redeploy after adding environment variable
5. ⚠️  Verify deployed Vercel frontend can authenticate with Render backend

### Development Commands
- Start backend: `npm run dev` or `cd backend && node server.js`
- Start frontend: `npm run frontend` or `cd school-portal-frontend && npm run dev`
- Install all dependencies: `npm run install-all`

### Build Commands
- Backend uses ES modules (`"type": "module"` in package.json)
- Frontend uses Vite for development and build
- No additional build configuration needed for backend

### Middleware Order
1. CORS middleware (with credentials and OPTIONS handling)
2. OPTIONS preflight handler
3. Express JSON parser
4. API routes (auth, admin, fees, result, student, attendance, files, accounts)
5. Error handling middleware
