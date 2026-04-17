# 🏥 MediCore Hospital Management System
### Complete Setup Guide for VS Code

---

## 📁 Project Structure

```
hms-project/
│
├── frontend/                  ← Open with Live Server
│   ├── index.html             ← Login page (start here)
│   ├── css/
│   │   ├── style.css          ← Dashboard styles
│   │   └── login.css          ← Login/register styles
│   ├── js/
│   │   └── api.js             ← API service (connects to backend)
│   └── pages/
│       ├── register.html      ← Register page
│       ├── patient.html       ← Patient dashboard
│       ├── doctor.html        ← Doctor dashboard
│       └── admin.html         ← Admin dashboard
│
├── backend/                   ← Node.js REST API
│   ├── .env                   ← ⚠ Edit your DB password here
│   ├── package.json
│   └── src/
│       ├── server.js          ← Entry point (npm start)
│       ├── config/
│       │   └── db.js          ← MySQL connection
│       ├── middleware/
│       │   └── auth.js        ← JWT auth
│       └── routes/
│           ├── auth.js        ← Login / Register
│           ├── doctors.js     ← Doctor CRUD
│           ├── patients.js    ← Patient CRUD
│           ├── appointments.js← Appointment booking
│           ├── prescriptions.js
│           └── admin.js       ← Admin dashboard API
│
└── database/
    └── schema.sql             ← Run this in MySQL first
```

---

## ✅ PREREQUISITES — Install These First

| Software | Download Link | Check Version |
|----------|--------------|---------------|
| Node.js 18+ | https://nodejs.org | `node -v` |
| MySQL 8.0 | https://dev.mysql.com/downloads/ | `mysql --version` |
| VS Code | https://code.visualstudio.com | — |
| Live Server (VS Code Extension) | Install from VS Code Extensions tab | — |

---

## 🚀 SETUP IN 4 STEPS

---

### STEP 1 — Set Up the Database

Open **MySQL Workbench** or **MySQL Command Line** and run:

```sql
SOURCE /full/path/to/hms-project/database/schema.sql;
```

**OR** copy-paste the contents of `database/schema.sql` into MySQL Workbench and click ▶ Run.

This creates:
- `hospital_db` database
- 6 tables: admins, doctors, patients, appointments, prescriptions, billing
- Sample data with 1 admin, 4 doctors, 3 patients

✅ **Done when you see:** `Database setup complete!`

---

### STEP 2 — Configure Backend

Open `backend/.env` in VS Code and update your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE   ← change this
DB_NAME=hospital_db
PORT=5000
JWT_SECRET=medicore_super_secret_jwt_key_2026
```

**If your MySQL user is not `root`**, also change `DB_USER`.

---

### STEP 3 — Install & Start Backend

Open a **new terminal** in VS Code (`Ctrl + ~`) and run:

```bash
cd backend
npm install
npm start
```

✅ **Done when you see:**
```
✅  MySQL connected successfully
🏥  MediCore HMS Backend running
    http://localhost:5000/api/health
```

**Leave this terminal running.**

---

### STEP 4 — Open Frontend

1. In VS Code, right-click on `frontend/index.html`
2. Click **"Open with Live Server"**
3. Browser opens at `http://127.0.0.1:5500/index.html`

✅ **Done!** You should see the MediCore login page.

---

## 🔑 LOGIN CREDENTIALS

### Admin
| Field | Value |
|-------|-------|
| Email | `admin@hospital.com` |
| Password | `Admin@123` |
| Role | Admin |

### Doctors
| Name | Email | Password |
|------|-------|----------|
| Dr. Priya Sharma | `priya.sharma@hospital.com` | `Doctor@123` |
| Dr. Rahul Verma | `rahul.verma@hospital.com` | `Doctor@123` |
| Dr. Anjali Patel | `anjali.patel@hospital.com` | `Doctor@123` |
| Dr. Suresh Kumar | `suresh.kumar@hospital.com` | `Doctor@123` |

### Patients
| Name | Email | Password |
|------|-------|----------|
| Amit Singh | `amit.singh@email.com` | `Patient@123` |
| Sneha Reddy | `sneha.reddy@email.com` | `Patient@123` |
| Vikram Nair | `vikram.nair@email.com` | `Patient@123` |

### Admin Registration Secret Key
```
HMS@AdminKey2026
```

---

## 🔗 API ENDPOINTS (Backend — Port 5000)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login (all roles) | None |
| POST | `/api/auth/register` | Register patient | None |
| GET | `/api/auth/me` | Get current user | JWT |
| GET | `/api/doctors` | List all doctors | None |
| GET | `/api/doctors/:id/appointments` | Doctor's appointments | JWT |
| GET | `/api/patients` | List all patients | Admin only |
| GET | `/api/patients/:id/appointments` | Patient's appointments | JWT |
| POST | `/api/appointments` | Book appointment | Patient/Admin |
| PATCH | `/api/appointments/:id/status` | Update status | JWT |
| POST | `/api/prescriptions` | Write prescription | Doctor only |
| GET | `/api/admin/dashboard` | Admin stats | Admin only |
| GET | `/api/admin/billing` | All billing records | Admin only |
| GET | `/api/health` | Health check | None |

---

## 🐛 TROUBLESHOOTING

### ❌ "MySQL connection failed"
- Check your password in `backend/.env`
- Make sure MySQL service is running:
  - Windows: Search "Services" → MySQL → Start
  - Mac: `brew services start mysql`
  - Linux: `sudo systemctl start mysql`

### ❌ "CORS error" in browser console
- Make sure the backend is running on port 5000
- Open `frontend/js/api.js` and confirm: `const API = 'http://localhost:5000/api';`

### ❌ Login says "No account found"
- Make sure you ran `schema.sql` — this creates the seed users
- Check you selected the correct role tab (Patient/Doctor/Admin)

### ❌ "npm install" fails
- Make sure Node.js 18+ is installed: `node -v`
- Try: `npm install --legacy-peer-deps`

### ❌ Live Server not found
- Install the "Live Server" extension by Ritwick Dey in VS Code Extensions

### ❌ Port 5000 already in use
- Change `PORT=5001` in `backend/.env`
- Update `frontend/js/api.js`: `const API = 'http://localhost:5001/api';`

---

## 🏗️ ARCHITECTURE

```
Browser (Frontend)
        │
        │  HTTP Requests (fetch/AJAX)
        ▼
  Node.js + Express (Port 5000)
  backend/src/server.js
        │
        │  SQL Queries (mysql2)
        ▼
  MySQL Database
  hospital_db
```

**Authentication Flow:**
1. User logs in → backend verifies credentials → returns JWT token
2. Frontend stores token in localStorage
3. Every API request sends `Authorization: Bearer <token>` header
4. Backend middleware verifies token and checks role

---

## 📋 FEATURES BY ROLE

### Patient
- Register / Login / Logout
- Browse doctors by specialization
- Book appointments (select doctor → date → time → confirm)
- View all appointments with status
- Cancel pending appointments
- View prescriptions with medication details
- View billing history

### Doctor
- Login / Logout
- View today's schedule with patient details
- Confirm / Complete appointments
- Write prescriptions with medications
- View all appointments and patients
- Update profile

### Admin
- Login / Logout (+ Register with secret key)
- Dashboard with stats: patients, doctors, appointments, revenue
- View all doctors and patients
- Manage all appointments (confirm/complete)
- View and update billing records (mark as paid)

---

## 🎓 FOR FACULTY PRESENTATION

**Recommended demo flow:**

1. Open backend terminal → show `npm start` → MySQL connected
2. Open `frontend/index.html` with Live Server
3. Click **Admin** demo button → login → show dashboard stats
4. Go to Doctors → show all 4 doctors in the database
5. Logout → click **Patient** demo button → login as Amit Singh
6. Click Book Appointment → select Dr. Priya Sharma → pick time → Book
7. Show success screen → click "View My Appointments"
8. Show the new appointment in the list
9. Logout → login as **Doctor** (priya.sharma@hospital.com)
10. Show the new appointment in Today's Schedule
11. Confirm → Complete → write Prescription

---

*MediCore HMS — Built with Node.js, Express, MySQL, Vanilla JS*
