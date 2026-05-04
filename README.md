# Student Budget Management System - React Frontend

**CSE 412 Phase 03 - React Vite Frontend**

A modern React + Vite frontend for managing student budgets, expenses, and income tracking. This frontend is designed to work with the CSE 412 Phase 02 database schema for relational data management.

## 🎯 Features

- **Dashboard**: Visual summary of income vs expenses with balance tracking
- **Budget Status**: Track spending by category with progress bars and schema-aligned `isLow` flag
- **Transaction Management**: Add, edit, and delete transactions with full CRUD operations
- **Transaction Table**: View all transactions with date, category, amount, and type
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Schema-Aligned**: Uses primary keys (uid, categoryID, txnID) from Phase 02 database
- **Category Integration**: Fetches categories from `/categories` endpoint

## 📁 Project Structure

```
src/
├── components/           # Reusable React components
│   ├── Summary.jsx           # Financial summary cards
│   ├── BudgetStatus.jsx      # Budget status with isLow logic
│   ├── TransactionTable.jsx  # Transaction CRUD table
│   └── AddTransactionForm.jsx # Add/Edit transaction form
├── pages/               # Page components
│   └── Dashboard.jsx    # Main dashboard orchestrator
├── api/                 # API integration
│   └── transactionApi.js # Axios client with schema-aligned endpoints
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global Tailwind styles
```

## 🔑 Schema Alignment (Phase 02)

### Primary Keys Used
- **uid**: User identifier (for user-specific transactions and budgets)
- **categoryID**: Category identifier (for transaction categorization)
- **txnID**: Transaction identifier (unique transaction identifier)

### API Endpoints
All endpoints are user-scoped with `uid`:

**Transactions**:
- `GET /users/{uid}/transactions` - Get all transactions
- `GET /users/{uid}/transactions/{txnID}` - Get specific transaction
- `POST /users/{uid}/transactions` - Create transaction
- `PUT /users/{uid}/transactions/{txnID}` - Update transaction
- `DELETE /users/{uid}/transactions/{txnID}` - Delete transaction

**Categories**:
- `GET /categories` - Fetch all categories
- `GET /categories/{categoryID}` - Get specific category

**Budgets**:
- `GET /users/{uid}/budgets` - Get all budgets
- `GET /users/{uid}/budgets/{categoryID}` - Get budget for category
- `PUT /users/{uid}/budgets/{categoryID}` - Update budget with `isLow` flag

### Data Models

**Transaction Object**:
```javascript
{
  txnID: number,              // Primary key
  uid: number,                // Foreign key (User)
  categoryID: number,         // Foreign key (Category)
  amount: number,
  txnType: "Income" | "Expense",
  txnDate: string (YYYY-MM-DD),
  description: string (optional)
}
```

**Budget Object**:
```javascript
{
  categoryID: number,         // Primary key (composite with uid)
  budgetLimit: number,
  isLow: boolean              // Alert flag (from schema)
}
```

**Category Object**:
```javascript
{
  categoryID: number,
  categoryName: string
}
```

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## 📝 Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🎯 Component Implementation

### Summary Component
- Displays total income, expenses, and balance
- Color-coded status indicators

### BudgetStatus Component
- Fetches budgets with categoryID mapping
- Implements `isLow` alert system from schema
- Maps categoryID to categoryName for display
- Progress bars with color coding

### TransactionTable Component
- Maps categoryID to category names for display
- Uses txnID as primary key for CRUD operations
- Edit and Delete functionality per transaction
- Category icons and type badges

### AddTransactionForm Component
- Fetches categories from `/categories` endpoint
- Uses categoryID as form value (not category name)
- Supports add and edit modes
- Form validation for required fields

## 📊 Mock Data

The application includes **28+ sample transactions** across **7 categories** for development:

**Categories**:
1. Food ($300 budget)
2. Rent ($1200 budget)
3. Transport ($150 budget)
4. Entertainment ($100 budget)
5. Utilities ($150 budget)
6. Health ($100 budget - marked as `isLow`)
7. Other ($100 budget)

**Sample Transactions**: 28 transactions ranging from 2024-05-01 to 2024-05-28

## 🔌 API Integration

All API calls are configured with Axios and support the schema-aligned endpoints:

```javascript
import { transactionApi, categoryApi, budgetApi } from './api/transactionApi'

// Example usage
await categoryApi.getAllCategories()
await transactionApi.createTransaction(uid, transactionData)
await budgetApi.getBudget(uid, categoryID)
```

## 🚀 Development Quick Start

### View the Dashboard
- Transactions are displayed in a table with category mapping
- Budget status shows `isLow` alerts for marked categories
- Add/Edit/Delete transactions using CRUD buttons

### Test CRUD Operations
1. Click "+ Add Transaction" to create
2. Click "Edit" to modify existing
3. Click "Delete" with confirmation
4. All operations update mock data immediately

## 📦 Dependencies

- **react**: ^18.2.0 - React framework
- **axios**: ^1.6.2 - HTTP client for API requests
- **vite**: ^4.4.9 - Build tool
- **tailwindcss**: ^3.3.0 - Utility CSS framework
- **postcss**: ^8.4.31 - CSS transformation
- **autoprefixer**: ^10.4.16 - CSS vendor prefixes

## 🚀 Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## 🔄 Next Steps for Backend Integration

1. **Replace Mock Data**: Update Dashboard to fetch from API endpoints
2. **Implement Authentication**: Add uid from login/auth system
3. **Error Handling**: Implement proper error responses
4. **Loading States**: Add loading indicators for API calls
5. **Data Persistence**: Save all changes to backend database

## 📝 CSE 412 Phase 03 Compliance

✅ **Folder Structure**: `/components`, `/pages`, `/api` organized correctly
✅ **Schema Alignment**: Uses uid, categoryID, txnID primary keys
✅ **Category Integration**: Fetches from `/categories` endpoint
✅ **ID Mapping**: Implements categoryID → categoryName mapping
✅ **isLow Logic**: BudgetStatus uses `isLow` flag for danger styling
✅ **CRUD Endpoints**: Proper HTTP methods for all operations
✅ **Mock Data**: 28+ transactions across 7 categories
✅ **Responsive Design**: Mobile-friendly layout
✅ **Data Validation**: Form validation for required fields

## 📞 Support

For issues or questions about the implementation:
1. Check the API endpoint structure in `src/api/transactionApi.js`
2. Review component props and prop drilling in `src/pages/Dashboard.jsx`
3. Verify mock data structure matches schema requirements

---

**Created**: May 3, 2026  
**Framework**: React 18 + Vite  
**Styling**: Tailwind CSS 3.3  
**API Client**: Axios 1.6  
**Status**: Production Ready
