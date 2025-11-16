# 💰 FinanceTracker

**FinanceTracker** is a full-stack web application built using the **MERN stack** — MongoDB, ExpressJS, ReactJS, and NodeJS.  
It helps users efficiently track, forecast, and visualize their financial data through interactive dashboards, file uploads, and personalized settings.

---

## 🧱 Project Structure
```
FinanceTracker/
│
├── backend/
│ ├── models/
│ │ ├── Contribution.js
│ │ ├── Expense.js
│ │ ├── Goal.js
│ │ ├── Groups.js
│ │ ├── Income.js
│ │ ├── Invoice.js
│ │ ├── PaymentStatus.js
│ │ ├── Reminder.js
│ │ ├── Report.js
│ │ ├── Settings.js
│ │ └── User.js
│ │
│ ├── middleware/
│ │ └── auth.js
│ │
│ ├── routes/
│ │ ├── expenseRoutes.js
│ │ ├── goalRoutes.js
│ │ ├── incomeRoutes.js
│ │ ├── reportRoutes.js
│ │ ├── settingsRoutes.js
│ │ └── userRoutes.js
│ │
│ ├── utils/
│ │ └── helper.js
│ │
│ ├── server.js
│ ├── package.json
│ └── package-lock.json
│
├── frontend/
│ ├── public/
│ │ ├── index.html
│ │ └── manifest.json
│ │
│ ├── src/
│ │ ├── pages/
│ │ │ ├── Login.js
│ │ │ ├── Register.js
│ │ │ ├── Upload.js
│ │ │ ├── ForecastPage.js
│ │ │ └── NotificationSetting.js
│ │ │
│ │ ├── components/
│ │ │ ├── Navbar.js
│ │ │ └── ProtectedRoute.js
│ │ │
│ │ ├── contexts/
│ │ │ └── AuthContext.js
│ │ │
│ │ ├── config/
│ │ │ └── api.js
│ │ │
│ │ ├── App.js
│ │ ├── App.css
│ │ ├── index.js
│ │ ├── index.css
│ │ └── reportWebVitals.js
│ │
│ ├── package.json
│ ├── package-lock.json
│ └── README.md
│
└── start-dev.sh
```
---

## 👩‍💻 Modules Overview

| Module | Folder / Files | Description |
|---------|----------------|--------------|
| **Authentication** | `Login.js`, `Register.js` | Handles user sign-up and login with input validation. |
| **Upload Management** | `Upload.js` | Allows uploading of CSV or expense data to MongoDB through backend APIs. |
| **Forecasting** | `ForecastPage.js` | Provides financial forecasting and interactive visualization (using Chart.js). |
| **Notification Settings** | `NotificationSetting.js` | Enables users to manage alerts and reminders for financial activities. |
| **Navigation & Routing** | `Navbar.js`, `ProtectedRoute.js`, `App.js` | Manages frontend routing and protected components. |

---

## 🧾 Forms Implemented

Each module includes at least one master and three transaction forms as required.

| Form Name | Type | Controls | Features |
|------------|------|-----------|-----------|
| **Login.js** | Transaction | Email, Password | Validated login form for authentication. |
| **Register.js** | Master | Name, Email, Password | User registration form with validation. |
| **UploadData.js** | Transaction | File input, Description, Category, Date, Submit | Uploads transaction data to backend. |
| **ForecastPage.js** | Transaction | Month Selector, Chart Display, Export Button | Visualization and report download. |
| **NotificationSetting.js** | Transaction | Email, Threshold, Date, Toggle, Save | Custom notification and reminder settings. |

---

## ⚙️ Backend Overview

| Folder | Purpose |
|---------|----------|
| **models/** | Contains MongoDB schemas for users, expenses, reports, and notifications. |
| **routes/** | Express routes implementing CRUD operations for each module. |
| **middleware/** | Handles authentication via JWT. |
| **utils/** | Utility and helper functions. |
| **server.js** | Main entry point connecting Express and MongoDB. |

---

## 💾 CRUD Operations

The backend implements standard CRUD and search operations:

| Operation | Functionality | Example Route |
|------------|----------------|----------------|
| **Create** | Insert new users or uploaded data | `POST /api/users` |
| **Read / Display** | Fetch transactions, forecast data | `GET /api/forecast` |
| **Update** | Modify settings or notifications | `PUT /api/settings/:id` |
| **Delete** | Remove records | `DELETE /api/expenses/:id` |
| **Search** | Query data by category, date, or keyword | `GET /api/transactions/search` |

---

## 📈 Visualization and Reporting

- **Chart.js** is used to plot income and expense trends on `ForecastPage.js`.  
- **FileSaver.js** is used for exporting data reports for download.  
- This fulfills the **Visualization** and **Report Generation** requirements.

---

## 🧩 Integration

- All pages are integrated through **React Router** (`App.js` and `Navbar.js`).  
- Each module is accessible through the landing page for unified navigation.  
- Backend communicates with MongoDB via Mongoose models for persistence.

---

## 🧮 Validations

- Validation applied on **Login** and **Register** forms.
- Ensures all inputs are mandatory and correctly formatted (e.g., email pattern, password length).

---

## 🚀 How to Run the Project

### 1️⃣ Clone the Repository
```
git clone https://github.com/Shravanthi20/FinanceTracker.git
cd FinanceTracker
cd backend
npm install

#In a New Terminal
cd ../frontend
npm install
```
---
### Create a .env file inside the backend folder:

MONGO_URI=mongodb+srv://<your-cluster-url>  
JWT_SECRET=<your-secret-key>  
PORT=5000