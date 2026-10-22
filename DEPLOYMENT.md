# SpendWise - Complete Production Deployment Blueprint

This guide walks you through deploying **SpendWise** to production using:
- **Database:** Managed Cloud MySQL (TiDB Cloud Serverless / Aiven / PlanetScale)
- **Backend API:** Render / Railway (Flask + Gunicorn)
- **Frontend App:** Vercel (React 19 + Vite)

---

## Architecture Flow

```
[User Browser]
       │
       ├──► Frontend: Vercel (https://spendwise.vercel.app)
       │         │
       │         └──► API calls (with credentials / cookies & Bearer)
       │                   │
       └───────────────────┼──► Backend: Render (https://spendwise-api.onrender.com)
                           │         │
                           │         └──► Managed Cloud MySQL (TiDB / Aiven / PlanetScale)
                           │
                           └──► Real SMTP Delivery (Gmail / Brevo / Resend)
```

---

## Step 1: Provision Managed Cloud MySQL Database

We recommend **TiDB Cloud (Free Serverless tier - 5GB storage, 0 cost)** or **Aiven**:

1. Sign up at [tidbcloud.com](https://tidbcloud.com) or [aiven.io](https://aiven.io).
2. Create a free MySQL-compatible database cluster:
   - Cluster Type: **Serverless**
   - Region: Choose closest to your users (e.g., Singapore, Frankfurt, or US East).
3. In the security settings, allow access from anywhere (`0.0.0.0/0`) since Render/Railway use dynamic IP addresses.
4. Copy your Connection String. It will look like:
   ```
   mysql+pymysql://<user>:<password>@<gateway-host>:4000/<db_name>?ssl_verify_cert=true&ssl_verify_identity=true
   ```
5. *(Optional)* Run the SQL schema:
   - You can run the queries from `database/schema.sql` inside the Cloud Web SQL Console, or let SQLAlchemy create the tables automatically on initial backend startup.

---

## Step 2: Deploy Backend to Render (or Railway)

### On Render:
1. Push your repository to GitHub or GitLab.
2. Sign in to [render.com](https://render.com) and click **New +** -> **Web Service**.
3. Select your repository.
4. Configure the Web Service:
   - **Name:** `spendwise-api`
   - **Region:** Same or close to your database region.
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app`
5. Under **Environment Variables**, add:
   | Key | Value / Example | Notes |
   | :--- | :--- | :--- |
   | `FLASK_ENV` | `production` | Enables production security mode |
   | `SECRET_KEY` | *(generate random 32+ hex string)* | Flask session key |
   | `JWT_SECRET_KEY` | *(generate random 32+ hex string)* | JWT sign key |
   | `DATABASE_URL` | `mysql+pymysql://<user>:<pass>@<host>:3306/<db>` | Your cloud MySQL connection string |
   | `FRONTEND_URL` | `https://your-spendwise-frontend.vercel.app` | URL from Step 3 (update after Vercel deploy) |
   | `COOKIE_SECURE` | `true` | Required for HTTPS cross-site cookies |
   | `COOKIE_SAMESITE` | `None` | Required for cross-site cookie transmission |
   | `SMTP_HOST` | `smtp.gmail.com` | (Optional) Email host |
   | `SMTP_PORT` | `587` | TLS port |
   | `SMTP_USERNAME` | `your.email@gmail.com` | Your email address |
   | `SMTP_PASSWORD` | `your-16-char-app-password` | Gmail App Password |
   | `SMTP_FROM_EMAIL`| `SpendWise <your.email@gmail.com>` | Sender display |
   | `SMTP_USE_TLS` | `true` | Enable TLS |

6. Click **Deploy Web Service**.
7. Test the health endpoint: `https://spendwise-api.onrender.com/api/health`.

---

## Step 3: Deploy Frontend to Vercel

1. Sign in to [vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** and import your GitHub repository.
3. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and choose `frontend`
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://spendwise-api.onrender.com/api` |
5. Click **Deploy**.
6. Once deployed, Vercel will provide your live URL (e.g., `https://spendwise-tracker.vercel.app`).

---

## Step 4: Link Frontend & Backend CORS

1. Go back to your backend deployment settings on **Render**.
2. Update `FRONTEND_URL` to match your actual live Vercel domain:
   ```
   FRONTEND_URL=https://spendwise-tracker.vercel.app
   ```
3. Save changes. Render will automatically redeploy with the updated CORS policy.

---

## Verification Checklist

- [ ] Visit `https://your-frontend.vercel.app` and verify the landing page renders with the brand green palette.
- [ ] Register a new account (`/register`) and ensure session is preserved on reload.
- [ ] Add an expense and a budget. Check that dashboard metrics and Recharts graphs populate.
- [ ] Test password reset request flow via your configured SMTP account.
- [ ] Log out and log back in to verify dual token/cookie handling.
