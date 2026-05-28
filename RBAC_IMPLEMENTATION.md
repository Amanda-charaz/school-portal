# Role-Based Access Control (RBAC) Implementation

## System Overview
Complete role-based access control has been implemented across the school portal with three primary roles: **Student**, **Teacher**, and **Admin**.

---

## 🔐 Backend Implementation

### 1. Enhanced Middleware (`backend/src/middleware/authMiddleware.js`)
- `protect`: Token verification middleware
- `authorize(...allowedRoles)`: Flexible role-based authorization
- Role-specific helpers:
  - `studentOnly`: Students only
  - `teacherOnly`: Teachers only
  - `adminOnly`: Admins only
  - `teacherOrAdmin`: Teachers and admins
  - `staffOnly`: Multiple staff roles

### 2. Role Enforcement in Controllers

**Results Controller** (`resultsController.js`):
- `addResult`: Only teachers/admins can add; teachers limited to their class
- `getAllResults`: Teachers see class results; admins see all
- `getMyResults`: Students only; returns own results
- `getLeaderboard`: Students/teachers see class leaderboard; admins see all

**Student Controller** (`studentController.js`):
- `getStudentProfile`: Students only, read-only
- `getStudentDashboard`: Students only
- `getStudentsByTeacher`: Teachers see their class; admins see all

**Admin Controller** (`adminController.js`):
New CRUD operations for user management:
- `getAllUsers`: List all users
- `createUser`: Create new user account
- `updateUser`: Update user details
- `deleteUser`: Remove user
- `resetUserPassword`: Admin password reset
- `getUsersByRole`: Filter users by role
- `deactivateUser`: Disable user account

### 3. Protected Routes

**Results Routes** (`resultRoutes.js`):
```javascript
POST /add        → teacherOrAdmin
GET /all         → teacherOrAdmin
GET /my-results  → protect (students only)
GET /leaderboard → protect (all authenticated)
```

**Admin Routes** (`adminRoutes.js`):
```javascript
GET /logs                    → admin
GET /users                   → admin
GET /users/:id              → admin
POST /users                 → admin
PUT /users/:id              → admin
DELETE /users/:id           → admin
POST /users/:id/reset-password → admin
POST /users/:id/deactivate  → admin
```

**Student Routes** (`studentRoutes.js`):
```javascript
GET /profile           → studentOnly
GET /dashboard         → studentOnly
GET /class-students    → teacherOrAdmin
```

---

## 🎨 Frontend Implementation

### 1. Auth Utilities (`src/utils/authUtils.js`)
```javascript
- decodeToken(token)        // Extract JWT payload
- getUserRole()             // Get user's role from localStorage
- getUserInfo()             // Get full user object
- isAuthenticated()         // Check if user is logged in
- hasRole(requiredRoles)    // Check if user has required role
- logout()                  // Clear storage and redirect
```

### 2. Protected Route Component (`src/components/ProtectedRoute.jsx`)
- Enforces role-based route access
- Shows 403 error for unauthorized access
- Redirects unauthenticated users to login

### 3. Updated App Routing (`src/App.jsx`)
```javascript
/admin-dashboard    → ProtectedRoute(admin)
/teacher-dashboard → ProtectedRoute(teacher, admin)
/teacher-portal    → ProtectedRoute(teacher, admin)
/student-dashboard → ProtectedRoute(student)
```

### 4. UI Components with Role Indicators
- **Dashboard** (Student): Shows student profile, grades, role badge
- **TeacherDashboard**: Shows teacher name, class stats, role badge
- **AdminDashboard**: Full admin controls, results management, user management, system settings

---

## 👥 Role Definitions

### Student Role
✅ **Allowed**:
- View own profile (read-only)
- View own academic results
- View class leaderboard
- Track performance metrics

❌ **Denied**:
- Submit/edit results
- View other students' records
- Access admin functions
- Manage users

### Teacher Role
✅ **Allowed**:
- Submit student grades
- View assigned class students
- View class results
- View class leaderboard
- Edit/manage own submissions

❌ **Denied**:
- Submit grades outside their class
- View other teachers' classes
- Access admin functions
- Manage users

### Admin Role
✅ **Allowed**:
- Full CRUD on all users
- Create/update/delete student accounts
- Reset user passwords
- View all results across system
- View all leaderboards
- System settings and audit logs
- Deactivate users

---

## 🔄 Request Flow with Role Enforcement

```
User Login
    ↓
Token Generated (with role embedded)
    ↓
Frontend Stores: token + user data
    ↓
User Navigates → ProtectedRoute Checks Role
    ↓
✅ Authorized → Display Portal
❌ Unauthorized → Show 403 + Redirect to Login
    ↓
API Request → Token Included in Headers
    ↓
Backend Middleware (protect) → Verifies Token
    ↓
Backend Middleware (authorize) → Checks Role
    ↓
✅ Role Match → Execute Controller Logic
❌ Role Mismatch → Return 403 Forbidden
```

---

## 🛡️ Security Features

1. **Token Verification**: Every request validates JWT token
2. **Role-Based Authorization**: Routes check for required roles
3. **Class-Level Isolation**: Teachers can only access their class data
4. **Password Hashing**: Bcryptjs for secure password storage
5. **UI-Level Checks**: Frontend validates roles before rendering components
6. **Backend Validation**: Server-side role checks prevent unauthorized access

---

## 📋 API Endpoints by Role Access

### Public
- `POST /auth/login` - Login (all roles)
- `POST /auth/register` - Register new student

### Student Only
- `GET /student/profile` - View own profile
- `GET /student/dashboard` - Student dashboard
- `GET /result/my-results` - Student's grades
- `GET /result/leaderboard` - Class leaderboard
- `GET /api/attendance/my-attendance` - View own attendance
- `GET /api/attendance/export-report` - Download PDF report

### Teacher & Admin
- `POST /result/add` - Submit grades
- `GET /result/all` - View results
- `GET /student/class-students` - View class students
- `POST /api/attendance/add` - Mark bulk attendance
- `GET /api/attendance/teacher-trends` - View class stats
- `GET /api/attendance/class-summary` - Daily rate summary

### Admin Only
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/:id/reset-password` - Reset password
- `POST /admin/users/:id/deactivate` - Deactivate user

---

## ⚙️ Configuration

**JWT_SECRET** (backend/.env):
```
JWT_SECRET=mysecretkey
```

**Role Enumeration** (User model):
```javascript
enum: ['student', 'teacher', 'general staff', 'receptionist', 'principal', 'admin', 'IT', 'accounts', 'HR']
```

---

## 🧪 Testing the RBAC System

1. **Student Login**: Should redirect to `/student-dashboard`
2. **Teacher Login**: Should redirect to `/teacher-dashboard`
3. **Admin Login**: Should redirect to `/admin-dashboard`
4. **Cross-Role Access**: Try accessing `/teacher-dashboard` as student → See 403 error
5. **API Request**: Send request without token → Get 401 error
6. **Wrong Role API**: Send teacher token to admin endpoint → Get 403 error

---

## 📝 Migration Notes

- Existing endpoints now enforce role-based access
- Old code paths that bypassed role checks have been replaced
- Frontend routing now validates roles before component load
- All logout operations use centralized `logout()` function
