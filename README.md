# 🏥 ShiftFlow AI - Hospital Patient Tracking System

A production-ready MERN stack application for hospital patient management with AI-powered SBAR (Situation-Background-Assessment-Recommendation) summary generation for nursing handoffs.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [User Workflows](#user-workflows)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

ShiftFlow AI streamlines hospital patient tracking and nurse-to-nurse handoffs by:

1. **Doctor Portal**: Create patients, assign nurses (day/night shifts)
2. **Nurse Portal**: Add time-stamped patient entries (vitals, medications, notes, assessments)
3. **AI Summarization**: Generate standardized SBAR summaries for shift handoffs
4. **Timeline View**: Chronological display of all patient entries
5. **Shift Validation**: Enforce day shift (7am-7pm) and night shift (7pm-7am) boundaries

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with 1-day access tokens
- Role-based access control (Doctor/Nurse)
- Shift-specific login for nurses
- Secure password hashing with bcrypt

### 👨‍⚕️ Doctor Features
- Create and manage patients
- Assign day and night nurses to patients
- View all patient entries in timeline
- Generate AI-powered SBAR summaries
- Review and approve summaries
- Full access to all patients

### 👩‍⚕️ Nurse Features
- View assigned patients (shift-specific)
- Add time-stamped patient entries:
  - **Vital Signs**: HR, BP, Temperature, Respiratory Rate, SpO2
  - **Medications**: Name, dose, route, frequency
  - **Notes**: Free-text observations
  - **Assessments**: Clinical evaluations
  - **Events**: Significant occurrences
  - **Labs**: Laboratory results
  - **Procedures**: Performed procedures
  - **Intake/Output**: Fluid balance tracking
- Shift time validation (day: 7am-7pm, night: 7pm-7am)
- Optional notes field for all entry types
- View patient timeline

### 📊 SBAR Summary Generation
- AI-powered summarization (with deterministic fallback)
- Structured output:
  - **Situation**: Current patient status
  - **Background**: Medical history and diagnosis
  - **Assessment**: Latest vitals, medications, events
  - **Recommendation**: Care plan and follow-up
- Provenance tracking (source entries)
- Edit history and audit trail
- Doctor approval workflow

### 🎨 User Interface
- Clean, modern design with Tailwind CSS
- Responsive layout for all screen sizes
- Real-time timeline updates
- Color-coded entry types
- Date format: DD/MM/YYYY, HH:MM:SS
- Visual shift indicators

---

## 🛠️ Technology Stack

### Backend
- **Node.js** v22.15.0
- **Express.js** - REST API framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Llama-2** - AI summarization (optional)

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS

### Development
- **Nodemon** - Auto-restart backend on changes
- **ESLint** - Code linting
- **Hot Module Replacement (HMR)** - Frontend auto-refresh

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (v22.15.0 recommended)
- **MongoDB** running on `localhost:27017`
- **Git** (for cloning)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ShiftFlow-AI
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Backend `.env` file is already configured. If needed, edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shiftflow_production
JWT_SECRET=shiftflow_secure_jwt_secret_key_production_2025_change_this
JWT_EXPIRES_IN=1d
ENABLE_AI_SUMMARIZATION=true
```

Frontend uses `http://localhost:5000/api` by default.

5. **Start MongoDB**
```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or start manually
mongod
```

6. **Start the backend server**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:5000

7. **Start the frontend server** (in a new terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

8. **Access the application**
- Open browser: http://localhost:3000
- Create initial doctor account
- Start managing patients!

---

## 👥 User Workflows

### 🩺 Doctor Workflow

```
1. Register/Login → Doctor Dashboard
2. Create Patient → Enter MRN, Name, DOB, Diagnosis
3. Assign Nurses → Select Day Nurse + Night Nurse (optional)
4. View Patient Details → See timeline of all entries
5. Generate Summary → Click "📊 Summarize Patient"
6. Review SBAR Summary → Read AI-generated handoff
7. Edit (if needed) → Modify any section
8. Approve → Finalize summary for handoff
```

### 👨‍⚕️ Nurse Workflow

```
1. Login (Day/Night Shift) → Assigned Patients List
2. Select Patient → Patient Detail Page
3. Add Entry:
   - Choose Type: Vital, Medication, Note, etc.
   - Enter Data (validated by shift time)
   - Add Optional Notes
   - Submit
4. View Timeline → All entries displayed chronologically
5. Repeat throughout shift
```

### Entry Types

| Type | Fields | Example |
|------|--------|---------|
| **Vital Signs** | HR, BP, Temp, RR, SpO2, Notes | HR: 72, BP: 120/80, Temp: 98.6°F |
| **Medication** | Name, Dose, Route, Notes | Aspirin, 81mg, PO |
| **Note** | Text, Notes | Patient resting comfortably |
| **Assessment** | Text, Notes | Alert and oriented x3 |
| **Event** | Text, Notes | Fall incident at 14:30 |
| **Lab** | Test name, value, unit, abnormal flag | WBC: 12.5 k/μL (abnormal) |
| **Procedure** | Name, notes | Foley catheter insertion |
| **Intake/Output** | Type, amount, route | Intake: 250mL PO |

---

## 🏗️ System Architecture

### Project Structure

```
ShiftFlow-AI/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── User.js       # Doctor/Nurse accounts
│   │   │   ├── Patient.js    # Patient records
│   │   │   ├── Entry.js      # Patient entries
│   │   │   └── Summary.js    # SBAR summaries
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── authService.js
│   │   │   ├── patientService.js
│   │   │   ├── entryService.js
│   │   │   ├── summaryService.js
│   │   │   └── llamaService.js  # AI summarization
│   │   └── middleware/       # Auth, error handling
│   ├── config/               # Database connection
│   ├── .env                  # Environment variables
│   └── index.js              # Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── NurseDashboard.jsx
│   │   │   ├── PatientDetail.jsx
│   │   │   └── SummaryDetail.jsx
│   │   ├── context/          # React context (Auth)
│   │   └── App.jsx           # Routes configuration
│   └── vite.config.js        # Vite configuration
│
└── SYSTEM-ARCHITECTURE.md    # Detailed system documentation
```

### Database Schema

#### Users Collection
```javascript
{
  email: "doctor@hospital.com",
  password: "$2a$12$..." (hashed),
  firstName: "John",
  lastName: "Doe",
  role: "doctor" | "nurse",
  shift: "day" | "night" (nurses only),
  createdAt: ISODate
}
```

#### Patients Collection
```javascript
{
  mrn: "MRN001",
  firstName: "Jane",
  lastName: "Smith",
  dateOfBirth: ISODate,
  age: 45,
  diagnosis: "Pneumonia",
  admissionDate: ISODate,
  assigned: {
    doctorId: ObjectId,
    dayNurseId: ObjectId,
    nightNurseId: ObjectId
  }
}
```

#### Entries Collection
```javascript
{
  authorId: ObjectId (ref: User),
  patientId: ObjectId (ref: Patient),
  type: "vital" | "medication" | "note" | "assessment" | "event" | "lab" | "procedure" | "intake_output",
  payload: {
    // Type-specific fields
    HR: 72, BP: "120/80", Temp: 98.6,
    RR: 16, O2Sat: 98,
    medication_name: "Aspirin", dose: "81mg", route: "PO",
    text: "Patient observation",
    // ... other fields
  },
  notes: "Additional observations" (optional),
  shift: "day" | "night",
  timestamp: ISODate,
  createdAt: ISODate
}
```

#### Summaries Collection
```javascript
{
  patientId: ObjectId (ref: Patient),
  periodStart: ISODate,
  periodEnd: ISODate,
  status: "draft" | "reviewed" | "final",
  summaryOutput: {
    situation: { hpi: String, chief_complaint: String },
    background: { diagnosis: String, past_medical_history: String },
    assessment: {
      vitals: [...],
      medications: [...],
      events: String
    },
    recommendation: {
      immediate_care_plans: String,
      disposition: String,
      follow_up: String
    }
  },
  createdBy: ObjectId (ref: User),
  signedOffBy: ObjectId (ref: User),
  signedOffAt: ISODate,
  editHistory: [...],
  createdAt: ISODate
}
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user info |

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | Get all patients (filtered by role) |
| POST | `/api/patients` | Create new patient (doctor only) |
| GET | `/api/patients/:id` | Get patient by ID |
| PUT | `/api/patients/:id` | Update patient (doctor only) |
| DELETE | `/api/patients/:id` | Delete patient (doctor only) |
| PUT | `/api/patients/:id/assign` | Assign nurses (doctor only) |

### Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/:patientId/entries` | Get all entries for patient |
| POST | `/api/patients/:patientId/entries` | Create new entry (shift validated) |
| PUT | `/api/patients/:patientId/entries/:id` | Update entry |
| DELETE | `/api/patients/:patientId/entries/:id` | Delete entry |

### Summaries

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients/:patientId/summaries/generate` | Generate SBAR summary |
| GET | `/api/patients/:patientId/summaries` | Get all summaries for patient |
| GET | `/api/summaries/:id` | Get summary by ID |
| PUT | `/api/summaries/:id` | Update summary (doctor only) |
| POST | `/api/summaries/:id/approve` | Approve summary (doctor only) |
| GET | `/api/summaries/pending` | Get pending summaries (doctor only) |

---

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongosh
# Or
net start MongoDB
```

**2. Port Already in Use**
```bash
# Change PORT in backend/.env
PORT=5001

# Or kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**3. Token Expired**
- Tokens expire after 1 day
- Logout and login again
- Or adjust `JWT_EXPIRES_IN` in `.env`

**4. Shift Validation Error**
- Day nurses can only add entries 7am-7pm
- Night nurses can only add entries 7pm-7am
- Check your system time

**5. Summary Generation 404**
- Backend should mount routes at both `/api/summaries` and `/api`
- Check `backend/index.js` route registration
- Restart backend server

**6. Temperature Validation Failed**
- Valid range: 20-115 (supports Celsius and Fahrenheit)
- Use 35-42°C or 95-108°F for normal readings

**7. Medication Route Not Accepted**
- Valid routes: PO, IV, IM, SC, SL, PR, Topical, Inhaled, subcutaneous, Other
- Case-sensitive

### Debug Mode

Enable detailed logging:
```env
# backend/.env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

Check browser console (F12) for frontend errors.

---

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration
- Secure HTTP headers
- Audit logging for all actions

---

## 📈 Performance

- MongoDB indexes on frequently queried fields
- Pagination support for large datasets
- Efficient populate queries
- Lazy loading of timeline entries
- Optimized bundle size with Vite

---

## 🤝 Contributing

This is a production system. Follow these guidelines:

1. **Code Style**: Follow ESLint rules
2. **Commits**: Use conventional commits (feat, fix, docs, etc.)
3. **Testing**: Test all changes before committing
4. **Documentation**: Update docs for new features
5. **Security**: Never commit secrets or API keys

---

## 📄 License

[Insert License Information]

---

## 📞 Support

For issues or questions:
1. Check [SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md) for detailed technical documentation
2. Review error messages in browser console and backend terminal
3. Check MongoDB connection and collections
4. Verify environment variables in `.env`

---

## 🎯 Production Deployment

### Environment Variables (Production)

**Backend:**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://<production-host>:<port>/<database>
JWT_SECRET=<STRONG-RANDOM-SECRET>
JWT_REFRESH_SECRET=<DIFFERENT-STRONG-SECRET>
JWT_EXPIRES_IN=8h
ENABLE_AI_SUMMARIZATION=true
```

**Frontend:**
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment Checklist

- [ ] Update all secrets in `.env`
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for production domain
- [ ] Enable production logging
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Set up monitoring (e.g., PM2, New Relic)
- [ ] Enable audit logging
- [ ] Test all workflows end-to-end
- [ ] Create admin accounts
- [ ] Document deployment process

---

**Built with ❤️ for better patient care**

*Last Updated: October 11, 2025*
