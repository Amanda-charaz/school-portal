# School Portal - Fixed & Reorganized

## Project Structure
```
school-portal/
├── backend/                 # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth & validation
│   │   ├── validations/    # Data validation
│   │   └── config/         # Database config
│   ├── server.js           # Entry point
│   ├── package.json        # Dependencies
│   └── .env                # Environment variables
│
├── school-portal-frontend/ # Frontend (React/Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── package.json           # Root package.json

```

## Fixes Applied

### 1. Database Migration (PostgreSQL → MongoDB)
- ✅ Converted `studentController.js` from SQL to MongoDB queries
- ✅ Converted `attendanceController.js` from SQL to MongoDB queries
- ✅ Converted `feeController.js` from SQL to MongoDB queries
- ✅ Created MongoDB models: `Student.js`, `Class.js`, `Attendance.js`, `Fee.js`, `Payment.js`

### 2. Authentication Issues Fixed
- ✅ Added missing `User` import in `resultsController.js`
- ✅ Fixed bcrypt package consistency (using `bcryptjs` everywhere)
- ✅ Fixed `getAllStudents` query (changed from `role_id: 1` to `role: 'student'`)
- ✅ Fixed middleware names (`verifyToken` → `protect`)

### 3. Route Fixes
- ✅ Updated all routes to use string roles instead of numeric IDs
- ✅ Fixed middleware imports in all route files
- ✅ Added missing routes to `server.js`

### 4. Admin Account
**Default Admin Credentials:**
- Email: `admin@test.com`
- Password: `admin123`

The admin account will be auto-created on first server startup.

## Running the Project

### Backend Only
```bash
cd backend
npm install
npm run dev  # or node server.js
```

### Frontend Only
```bash
cd school-portal-frontend
npm install
npm run dev
```

### All (Root)
```bash
npm run install-all
```

## Environment Variables
The `.env` file is located in `backend/.env` with:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)

## API Endpoints

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/users` - Get all users (admin only)

### Results
- `POST /api/result/add` - Add result (admin only)
- `GET /api/result/all` - Get all results (admin only)
- `GET /api/result/my-results` - Get student's results
- `GET /api/result/leaderboard` - Get top 10 students

### Attendance
- `POST /api/attendance/mark` - Mark single attendance
- `POST /api/attendance/bulk` - Mark bulk attendance
- `GET /api/attendance/daily-report` - Get daily absent report
- `GET /api/attendance/class-sheet/:class_id` - Get class attendance sheet

### Fees
- `POST /api/fees/invoice` - Create fee invoice (admin)
- `POST /api/fees/pay` - Record payment (admin)
- `GET /api/fees/my-fees` - Get student fees

### Student
- `GET /api/student/dashboard` - Student dashboard

## Troubleshooting

### Login Issues
If login fails with "Invalid credentials":
1. Ensure MongoDB is running
2. Check that admin account was created (check server logs)
3. Verify `.env` file has correct `MONGO_URI`
4. Try admin credentials: `admin@test.com` / `admin123`

### Database Connection Issues
- Ensure MongoDB connection string in `.env` is correct
- Check that your MongoDB cluster is active
- Verify IP whitelist includes your machine

