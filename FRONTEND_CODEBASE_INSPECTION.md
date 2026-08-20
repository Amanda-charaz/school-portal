# Frontend Codebase Inspection

This document provides a comprehensive inspection of the school-portal frontend codebase structure and architecture.

## Technology Stack

- **Framework**: React 18.3.1 with Vite 5.4.10
- **Routing**: React Router DOM 7.15.0
- **Styling**: TailwindCSS 3.4.3 with custom school colors
- **Icons**: Lucide React 1.14.0
- **HTTP Client**: Axios 1.16.0
- **Charts**: Recharts 3.8.1
- **Build Tool**: Vite with React plugin

## Project Structure

```
school-portal-frontend/
├── src/
│   ├── main.jsx              # Entry point with ThemeProvider
│   ├── App.jsx               # Main routing configuration
│   ├── index.css             # Global styles with Tailwind directives
│   ├── api/
│   │   └── axios.js          # Axios instance with interceptors
│   ├── components/           # 24 components (including utility files)
│   │   ├── AccountManagement.jsx
│   │   ├── AccountsTab.jsx
│   │   ├── AdminAttendanceView.jsx
│   │   ├── AdminUserManagement.jsx
│   │   ├── Attendance.jsx
│   │   ├── ClassManagement.jsx
│   │   ├── ClassSummaryWidget.jsx
│   │   ├── FeeHistory.jsx
│   │   ├── OutstandingBalanceWidget.jsx
│   │   ├── ProfileSettings.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Result.jsx
│   │   ├── StudentAttendanceLog.jsx
│   │   ├── StudentAttendanceView.jsx
│   │   ├── StudentFeesView.jsx
│   │   ├── StudentOverview.jsx
│   │   ├── StudentOverviewNew.jsx
│   │   ├── StudentResultsView.jsx
│   │   ├── TeacherAttendanceForm.jsx
│   │   ├── TeacherAttendanceReport.jsx
│   │   ├── TeacherSubjectManagement.jsx
│   │   ├── UserManagement.jsx
│   │   └── fixUser.js        # Utility script
│   ├── context/
│   │   └── ThemeContext.jsx  # Dark/light theme management
│   ├── pages/                # Dashboard pages
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   └── TeacherPortal.jsx
│   ├── routes/
│   │   └── authRoutes.js     # Authentication route definitions
│   ├── utils/
│   │   ├── authUtils.js      # Authentication utilities
│   │   ├── academicUtils.js  # Grade calculation and academic helpers
│   │   └── index.js          # Additional utilities
│   ├── controllers/          # Controller logic
│   │   └── authController.js
│   └── assets/               # Static assets
├── public/                   # Static assets
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite build configuration
└── package.json              # Dependencies
```

## Key Features

### Authentication System
- JWT-based authentication with localStorage persistence
- Role-based access control (RBAC) for admin, teacher, student
- Protected routes with role validation
- Automatic token injection via Axios interceptors
- 401 error handling with automatic logout
- Password reset functionality
- User registration

### Role-Based Dashboards
- **Admin Dashboard**: Results management, user management, teacher management, class management, attendance records, accounts, audit logs, system logs
- **Student Dashboard**: Overview, results, attendance, fees, settings
- **Teacher Dashboard**: Overview, attendance, results management, settings
- **Teacher Portal**: Additional teacher-specific features

### Theme System
- Dark/light mode toggle with localStorage persistence
- Custom theme colors (school-blue: #003DA5, school-red: #B22222)
- Theme context provider wrapping entire app
- Responsive theme-aware components

### API Integration
- Axios instance configured for automatic environment switching
- Production: Render deployment (https://school-portal-xqp8.onrender.com/api)
- Development: Local server (http://localhost:3000/api)
- Request interceptor for Bearer token injection
- Response interceptor for 401 error handling

### Responsive Design
- Mobile-first approach with breakpoint-based styling
- Custom responsive utility functions in components
- Mobile-friendly scrollbar hiding
- Safe area insets for devices with notches
- Touch-optimized scrolling

## Component Architecture

### Page Components
- **Login.jsx**: Authentication form with forgot password, remember me, password visibility
- **Register.jsx**: User registration form
- **ResetPassword.jsx**: Password reset functionality
- **AdminDashboard.jsx**: Tab-based admin interface with 9 management sections
- **StudentDashboard.jsx**: Student portal with 5 main sections
- **TeacherDashboard.jsx**: Teacher hub with 4 main sections
- **TeacherPortal.jsx**: Additional teacher-specific portal
- **Dashboard.jsx**: General dashboard component

### Key Reusable Components
- **ProtectedRoute.jsx**: Route protection wrapper with role validation
- **Result.jsx**: Results management with grade calculation
- **UserManagement.jsx**: User CRUD operations
- **AdminUserManagement.jsx**: Admin-specific user management
- **Attendance.jsx**: Attendance tracking and reporting
- **StudentAttendanceView.jsx**: Student-specific attendance view
- **StudentAttendanceLog.jsx**: Student attendance history
- **TeacherAttendanceForm.jsx**: Teacher attendance entry form
- **TeacherAttendanceReport.jsx**: Teacher attendance reporting
- **ProfileSettings.jsx**: User profile management
- **AccountManagement.jsx**: Account management interface
- **AccountsTab.jsx**: Accounts tab component
- **ClassManagement.jsx**: Class CRUD operations
- **TeacherSubjectManagement.jsx**: Teacher subject assignments
- **StudentFeesView.jsx**: Student fee tracking
- **FeeHistory.jsx**: Fee payment history
- **OutstandingBalanceWidget.jsx**: Balance display widget
- **ClassSummaryWidget.jsx**: Class summary display
- **StudentOverview.jsx**: Student overview display
- **StudentOverviewNew.jsx**: Updated student overview
- **StudentResultsView.jsx**: Student results display

## Utility Functions

### authUtils.js
- `decodeToken()`: JWT token parsing
- `getUserRole()`: Role extraction from localStorage
- `getUserInfo()`: User data retrieval
- `isAuthenticated()`: Authentication status check
- `hasRole()`: Role-based authorization
- `logout()`: Session cleanup and redirect

### academicUtils.js
- `calculateGrade()`: ZIMSEC O-Level grade calculation (A-E, U)
- `getGradeColor()`: Grade-based color mapping
- `subjectOptions`: Subject list for Zimbabwe curriculum
- `termLabels`: Term label definitions

### index.js
- Additional utility functions

## Build Configuration

- **Vite Config**: React plugin, port 5173, host binding
- **Tailwind Config**: Custom school colors, extended breakpoints
- **PostCSS**: Autoprefixer integration
- **ESLint**: React and React Hooks plugins

## Deployment Configuration

- **Netlify**: netlify.toml configuration
- **Vercel**: vercel.json configuration
- **Build Output**: dist/ directory with assets subdirectory

## Current State Assessment

The frontend is well-structured with:
- Clear separation of concerns (pages, components, utils, context)
- Consistent styling approach using TailwindCSS
- Proper authentication and authorization flow
- Responsive design considerations
- Modern React patterns (hooks, context)
- Environment-aware API configuration
- Comprehensive component library for school management
- Additional features like password reset and registration

The codebase appears production-ready with comprehensive feature coverage for a school management system.
