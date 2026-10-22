# SpendWise – Full-Stack Expense Tracker Application

SpendWise is a production-style, full-stack personal finance and expense tracking application. It is engineered with a **mobile-first, green-and-white wallet-branded UI**, robust **Flask REST API**, **database architecture (MySQL with SQLite fallback)**, **streamlined authentication**, **budget warning thresholds**, **Danger Zone account deletion**, and **interactive Recharts analytics**.

---

## 📸 Design Aesthetics & Architecture

- **Visual Reference Alignment:** Designed to match the SpendWise Get Started design with a soft sage outer background (`#D6E5D3`), centered tall card panel, custom SVG wallet with Indian Rupee (`₹`) symbol, signature brand typography (*Spend* in black, *Wise* in `#2F8F24`), and bottom decorative green wave.
- **Frontend Stack:** React 19 with Vite, Tailwind CSS, Lucide Icons, and Recharts.
- **Backend Stack:** Python Flask with SQLAlchemy ORM, PyMySQL, Flask-Migrate, PyJWT, and Werkzeug security.
- **Database:** MySQL 8.0+ (with automatic local SQLite fallback for seamless out-of-the-box development and testing).
- **Session Security:** JWT stored in `HttpOnly`, `SameSite=Lax` cookies with CSRF validation.
- **Authentication:** Streamlined direct registration and password-authenticated login without email OTP friction, with backward compatibility that automatically grants access to existing accounts.
- **Password Reset via SMTP:** Cryptographically secure expiring token reset links delivered via SMTP.
- **Account Deletion (Danger Zone):** Permanent account deletion requiring server-side password authentication and typing `DELETE` confirmation, atomically cascading to all user expenses, budgets, and tokens.

---

## 📁 Project Structure

```text
spendwise/
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Input, Modal, Navbar, SpendWiseLogo, etc.
│   │   │   ├── expenses/         # ExpenseModal
│   │   │   └── budgets/          # BudgetModal
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── pages/                # Welcome, Login, Register, VerifyEmail, Dashboard, Analytics, etc.
│   │   ├── services/             # api.js client (credentials: 'include')
│   │   ├── App.jsx               # Protected & public routing with ErrorBoundary
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind CSS tokens & browser native icon overrides
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
├── backend/                      # Flask REST API
│   ├── app/
│   │   ├── models/               # User, Expense, Budget, EmailVerificationToken, PasswordResetToken
│   │   ├── routes/               # auth, expenses, budgets, dashboard, analytics, profile
│   │   ├── services/             # email_service.py (Real SMTP email delivery with OTP templates)
│   │   ├── middleware/           # auth_middleware.py (@login_required, CSRF)
│   │   ├── utils/                # security.py (OTP generation & salted SHA-256 hashing)
│   │   ├── extensions.py         # db, migrate, cors
│   │   └── __init__.py           # Application factory
│   ├── tests/                    # 29 automated pytest tests
│   ├── config.py                 # Configuration with OTP & SMTP settings
│   ├── run.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── database/
│   └── schema.sql                # Complete MySQL DDL schema
├── README.md
└── .gitignore
```

---

## 🛠️ Prerequisites

Before getting started, make sure you have the following installed:

1. **Python 3.10+** (tested on Python 3.14)
2. **Node.js 18+** & **npm**
3. **MySQL Server 8.0+** (Optional: SQLite fallback is active automatically if MySQL credentials are not set)
4. **SMTP Email Account** (e.g. Gmail with an App Password) to deliver secure password reset links.

---

## 📧 SMTP Setup Guide (Password Reset)

SpendWise uses real SMTP delivery to send password reset links directly to the user's registered inbox.

### 1. Gmail SMTP Setup (Recommended)
To send password reset emails using a Gmail address:

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security).
   - Under *"How you sign in to Google"*, enable **2-Step Verification**.
2. **Generate an App Password**:
   - In Google Account Security, search for **App passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
   - Enter an app name (e.g., `SpendWise`).
   - Click **Create**. Google will generate a 16-character password (e.g. `abcd efgh ijkl mnop`).
3. **Configure `backend/.env`**:
   Open `backend/.env` and fill in the SMTP variables:
   ```ini
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your.email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   SMTP_FROM_EMAIL=SpendWise <your.email@gmail.com>
   SMTP_USE_TLS=true
   ```

> [!CAUTION]
> **Never enter your standard personal Gmail password**. Always generate and use a dedicated 16-character **App Password**. Never commit your `.env` file to version control.

### 2. Other SMTP Providers (Outlook, SendGrid, Amazon SES, Mailgun)
Configure the corresponding host and credentials in `backend/.env`:
- **Outlook/Office365:** `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_USE_TLS=true`
- **Custom / Hosting SMTP:** Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` accordingly.

---

## 🚀 Setup & Installation Guide

### Step 1: Database Setup (MySQL)

1. Open your MySQL client (MySQL Command Line Client, MySQL Workbench, or phpMyAdmin).
2. Execute the provided DDL schema script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   Or run the SQL statements inside `database/schema.sql` directly:
   ```sql
   CREATE DATABASE IF NOT EXISTS spendwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Step 2: Backend Configuration

1. Copy `backend/.env.example` to `backend/.env` if not already present.
2. Configure your database and SMTP settings:
   ```ini
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/spendwise
   SECRET_KEY=spendwise-super-secret-flask-key-change-in-prod-2026
   JWT_SECRET_KEY=spendwise-jwt-token-secret-change-in-prod-2026
   FRONTEND_URL=http://localhost:5173

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=SpendWise <your-email@gmail.com>
   SMTP_USE_TLS=true
   ```

### Step 3: Python Virtual Environment & Dependencies

1. Navigate to the backend directory and create a virtual environment:
   ```powershell
   cd backend
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows:**
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Step 4: Run Backend Tests

Execute the comprehensive test suite (28 tests covering direct registration, login without OTP, unverified account auto-upgrade, account deletion, expense CRUD, budget thresholds, and analytics):
```bash
python -m pytest -v
```

### Step 5: Start the Flask Backend Server

```bash
python run.py
```
Backend will start on `http://127.0.0.1:5000`.

---

### Step 6: Frontend Configuration & Startup

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:5173/
   ```

---

## 🔒 Security Implementations

1. **Password Hashing:** Passwords hashed with `Werkzeug` secure algorithms (`pbkdf2:sha256`) before database storage. Plaintext passwords are never saved.
2. **Streamlined Authentication & Safe Migration:**
   - Registration creates active verified user accounts directly without OTP friction.
   - Users can register and immediately log in using their email and password.
   - Any previously registered unverified accounts are safely auto-upgraded upon login without account deletion or data loss.
3. **Danger Zone Permanent Account Deletion:**
   - Authenticated endpoint (`DELETE /api/profile/account`) requires user identity verification on the server.
   - Enforces two-step verification: requires current password + typing `DELETE` to confirm.
   - Safely executes atomic cascade deletion of user records (expenses, budgets, tokens, and user profile) in a transactional block.
   - Strict data isolation: only the authenticated user's records are deleted; other users' records remain untouched.
   - Invalidates authentication session and deletes HttpOnly JWT cookie.
4. **Session & Cookie Security:**
   - JWT tokens stored in `HttpOnly`, `SameSite=Lax` cookies, shielding them from XSS attacks and `localStorage` theft.
   - State-changing requests enforce CSRF headers (`X-Requested-With`).
5. **Data Isolation (Tenant Security):**
   - Every expense, budget, and transaction query is strictly scoped to `g.current_user.id`. Cross-user data access is rejected with HTTP 404/403.
6. **UI Password Input Polish:**
   - Browser-native duplicate reveal icons (`input::-ms-reveal` and `input::-ms-clear`) are suppressed in CSS. Exactly one toggle button is rendered per password field, with isolated state and `type="button"`.

---

## 📊 Core Features & Workflow

### 1. Welcome Screen
- Mobile-first responsive card layout.
- High-fidelity wallet illustration with Rupee (`₹`) symbol.
- Brand logo: **Spend** (black) + **Wise** (green `#2F8F24`).
- Quick navigation button: **Get Started** -> `/register`.

### 2. User Authentication
- Direct registration with validation (name, email regex, minimum 8 characters with letter and number, password confirmation, Terms checkbox).
- Instant login with email and password without OTP verification.
- Show/hide password toggles, Remember Me support, and clear error alerts.
- Forgot & Reset Password workflow via expiring cryptographic token delivered by SMTP.

### 3. Dashboard
- Total Expenses This Month (₹).
- Monthly Budget Target with quick-set modal.
- Remaining Balance (color-coded).
- Budget Used Percentage Gauge with dynamic progress bar.
- Recent Transactions Table with quick edit and delete actions.
- Top Categories breakdown widget.

### 4. Expense Management
- Add & Edit expense modal (Amount, Title, Predefined Categories: Food, Transport, Shopping, Bills, Education, Health, Entertainment, Others, Date, Notes).
- Real-time search by title or notes.
- Filter by category and date ranges.
- Sort by date and amount.
- Pagination with total amount for the filtered set.
- Confirmation modal before expense deletion.

### 5. Budget Management
- Monthly budget creation and updates (prevents duplicate budgets for same month/year).
- Dynamic threshold warnings:
  - `< 75%`: **Normal** (On Track)
  - `≥ 75%`: **Warning** (Approaching Limit)
  - `≥ 100%`: **Danger** (Budget Exceeded by ₹X)
- Historical monthly budget cards.

### 6. Analytics
- **Category Donut Chart:** Visual distribution of spending across categories using Recharts.
- **Monthly Spending Bar Chart:** 12-month expense comparison with clear bar columns.
- **Monthly Spending Breakdown Table:** Tabular monthly totals, spending indicators, and active filter highlighting (monthly line chart and progression curves removed).
- Highest-spending category badge and month-over-month comparison metrics (+/- % vs previous month).
- Year and month filters.

### 7. User Profile & Danger Zone
- View profile name, email, and verified status badge.
- Update display name.
- Change password with current password verification.
- Session logout.
- **Danger Zone (Account Deletion):**
  - Confirmation dialog with permanent data loss warning.
  - Requires entering current password and typing `DELETE`.
  - Atomically purges user profile, expenses, and budgets.
  - Clears client-side auth context and redirects to the welcome screen.

---

## 🧪 Testing Summary

The test suite located in `backend/tests/` verifies the entire application stack:
- `test_auth.py`: Direct registration without OTP, duplicate email rejection, password hashing, direct login without OTP, unverified account auto-upgrade, session logout, password reset flow, account deletion (success, wrong password, wrong confirmation, data isolation, unauthenticated).
- `test_expenses.py`: Expense CRUD, field validation, filtering, sorting, pagination, and cross-user data isolation.
- `test_budgets.py`: Budget limits, calculations, warning alerts, and duplicate prevention.
- `test_dashboard.py`: Summary totals, empty states, and recent transactions.
- `test_analytics.py`: Category aggregations and monthly spending trends.
- `test_e2e_flow.py`: Full end-to-end integration lifecycle from registration to expenses, budgets, analytics, password change, and permanent account deletion.

Run the test suite:
```powershell
d:/Expense_Tracker/backend/venv/Scripts/python -m pytest -v
```
Result: **28 passed in ~5s**.

---

## ❓ Common Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| **Email service (SMTP) is not configured** | Add your SMTP credentials to `backend/.env` (see the SMTP Setup Guide above). If using Gmail, make sure to generate an App Password. |
| **MySQL Access Denied (1045)** | Verify your MySQL root password in `backend/.env`. If MySQL is unavailable, SpendWise will seamlessly fall back to local SQLite (`spendwise.db`) without crashing. |
| **Port 5000 or 5173 already in use** | Stop existing processes or configure `PORT=5001` in `backend/.env` and update the proxy in `frontend/vite.config.js`. |
| **CORS errors** | Ensure `FRONTEND_URL` in `backend/.env` matches `http://localhost:5173`. |
