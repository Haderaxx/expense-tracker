# 💰 ExpensePro — MERN Stack Expense Manager

A full-featured expense tracking app built with MongoDB, Express, React, and Node.js.

## ✨ Features

- **Authentication** — JWT-based register/login with bcrypt password hashing
- **Transactions** — Add income & expenses with categories, dates, payment methods, tags
- **Dashboard** — Real-time charts: monthly trend (area), category breakdown (pie), summary stats
- **Filtering** — Filter by type, category, date range, and search by title
- **Pagination** — Server-side pagination for large datasets
- **Categories** — Custom + default categories with icon/color picker
- **Budget Tracking** — Set a monthly budget and track usage %
- **Multi-currency** — USD, EUR, GBP, INR, JPY, CAD, AUD
- **Responsive** — Works on mobile and desktop

## 🏗️ Project Structure

```
expense-manager/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT middleware
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Expense.js        # Expense/income model
│   │   └── Category.js       # Category model
│   ├── routes/
│   │   ├── auth.js           # /api/auth
│   │   ├── expenses.js       # /api/expenses
│   │   ├── categories.js     # /api/categories
│   │   └── dashboard.js      # /api/dashboard
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── context/AuthContext.js
        ├── utils/{api.js, format.js}
        ├── components/{Layout, ExpenseModal}
        └── pages/{Auth, Dashboard, Expenses, Categories, Settings}
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://mongodb.com/atlas))

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run dev        # Runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start          # Runs on http://localhost:3000
```

### .env Configuration

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-manager
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 🐳 Docker Compose (Recommended)

Run the entire stack with one command:

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get profile |
| PUT | /api/auth/profile | Update profile |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses | List (with filters/pagination) |
| POST | /api/expenses | Create transaction |
| PUT | /api/expenses/:id | Update transaction |
| DELETE | /api/expenses/:id | Delete transaction |

**Query params for GET /api/expenses:**
- `page`, `limit` — pagination
- `type` — `expense` or `income`
- `category` — category ID
- `startDate`, `endDate` — ISO date strings
- `search` — title search
- `sortBy`, `order` — sort field and direction

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/summary | This/last month totals |
| GET | /api/dashboard/category-breakdown | Spending by category |
| GET | /api/dashboard/monthly-trend | 6-month income vs expense |
| GET | /api/dashboard/recent | Last 5 transactions |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Styling | Custom CSS with CSS variables |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcryptjs |
| HTTP | Axios |
| Notifications | react-hot-toast |
| Deployment | Docker + Nginx |

## 🔒 Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 30-day expiry
- All routes protected with auth middleware
- Users can only access their own data
- CORS configured for specific origins

## 📱 Responsive Design

The app is fully responsive:
- **Desktop**: Persistent sidebar, full table view
- **Mobile**: Collapsible sidebar with overlay, simplified card view

---

Built with ❤️ using the MERN stack
