# Money Management App - Features for Swift Rewrite

## 📱 Application Overview
A comprehensive personal finance management mobile application built with React Native and Expo, designed to track expenses, manage budgets, and provide financial insights.

---

## 🔐 1. Authentication & User Management

### Features
- **User Registration**
  - Username, email, password fields
  - Password confirmation validation
  - Email format validation
  - Minimum password length (6 characters)
  
- **User Login**
  - Email and password authentication
  - Show/hide password toggle
  - Form validation
  
- **Token Management**
  - JWT token-based authentication
  - Secure token storage (AsyncStorage equivalent in Swift: Keychain)
  - Auto-attach token to API requests via interceptors
  - Auto-logout on 401 Unauthorized responses
  
- **Session Persistence**
  - Auto-check authentication on app launch
  - Maintain logged-in state across app restarts
  
### API Endpoints
```
POST /register
POST /login
GET /user (optional - get current user)
POST /logout (optional)
```

---

## 💰 2. Transaction Management

### Features
- **Transaction List**
  - View all income and expense transactions
  - Pagination support (page, page_size)
  - Filter by date range (start_date, end_date)
  - Filter by transaction type (Income/Expense)
  - Filter by category
  - Display: description, amount, date, category name, bank name
  - Infinite scroll for loading more transactions
  
- **Create Transaction**
  - Select bank account
  - Select category
  - Enter amount
  - Enter description
  - Select date
  - Choose transaction type (Income/Expense)
  
- **View Transaction**
  - View single transaction details by ID
  
- **Delete Transaction**
  - Remove transaction with confirmation
  
- **Pull-to-Refresh**
  - Refresh transaction list

### Data Model
```typescript
Transaction {
  id: number
  description: string
  amount: number
  transaction_type: number  // 1=income, 2=expense
  date: string
  category_name?: string
  bank_name?: string
}
```

### API Endpoints
```
GET /transactions (with pagination & filters)
POST /transaction
GET /transactions/:id
DELETE /transactions/:id
```

---

## 🏷️ 3. Category Management

### Features
- **Category List**
  - View all user-defined categories
  - Display category name and description
  
- **Create Category**
  - Category name (required)
  - Description (optional)
  
- **Update Category**
  - Edit category name and description
  
- **Delete Category**
  - Remove category with confirmation
  
- **View Category**
  - View single category details

### Data Model
```typescript
Category {
  ID: number
  CategoryName: string
  Description: string
  UserID: number
  CreatedAt: string
  UpdatedAt?: string
}
```

### API Endpoints
```
GET /categories
POST /categories
GET /categories/:id
PUT /categories/:id
DELETE /categories/:id
```

---

## 🎯 4. Budget Management

### Features
- **Budget List**
  - View all budgets with spending status
  - Visual progress bars showing spending percentage
  - Color-coded status indicators:
    - 🟢 **Safe** (< 70%): Green
    - 🟠 **Warning** (70-100%): Orange
    - 🔴 **Exceeded** (> 100%): Red
  - Display: budget amount, spent amount, remaining amount, percentage used
  - Show alert threshold indicator
  - Swipe-to-delete with confirmation
  - Pull-to-refresh
  - Empty state message
  
- **Create Budget**
  - Select category (button grid picker)
  - Enter budget amount (with currency prefix)
  - Choose period (Monthly/Yearly)
  - Select start date (calendar picker)
  - Set alert threshold (slider: 50-100%, default 80%)
  - Form validation
  
- **Delete Budget**
  - Remove budget with confirmation
  - Success feedback via snackbar

### Data Model
```typescript
Budget {
  id: number
  category_id: number
  category_name?: string
  amount: number
  period: 'monthly' | 'yearly'
  start_date?: string
  alert_at?: number  // percentage (50-100)
  spent_amount?: number
  remaining_amount?: number
  percentage_used?: number
  status?: 'safe' | 'warning' | 'exceeded'
}
```

### Business Logic
- **Status Calculation** (backend):
  - `safe`: < 70% spent
  - `warning`: 70-100% spent
  - `exceeded`: > 100% spent
  
- **Period Reset**:
  - Monthly budgets reset each month
  - Yearly budgets reset each year
  - Reset cycle based on start_date

### API Endpoints
```
GET /budgets
GET /budget-status
POST /budgets
DELETE /budgets/:id
```

---

## 🔔 5. Budget Alerts

### Features
- **Alert List**
  - View all budget alerts
  - Filter by unread alerts only
  - Display: category name, budget amount, spent amount, percentage, message
  - Show read/unread status
  - Alert creation timestamp
  
- **Mark as Read**
  - Mark individual alert as read
  
- **Unread Count Badge**
  - Display count of unread alerts
  - Use for notification badges

### Data Model
```typescript
BudgetAlert {
  id: number
  budget_id: number
  percentage: number
  spent_amount: number
  message: string
  is_read: boolean
  created_at: string
  category_id: number
  category_name: string
  budget_amount: number
}
```

### API Endpoints
```
GET /budget-alerts?unread_only=true
PUT /budget-alerts/:id/read
```

---

## 📊 6. Analytics & Dashboard

### Features
- **Dashboard Summary**
  - Current month statistics
  - Last month statistics for comparison
  - Top spending categories (with percentages)
  - Recent transactions list
  - Budget summary overview
  
- **Financial Metrics**
  - Total income
  - Total expenses
  - Net amount (income - expenses)
  - Transaction counts (income/expense)
  - Savings rate calculation
  
- **Category Analytics**
  - Top spending categories
  - Category-wise totals
  - Percentage breakdown
  - Transaction count per category
  
- **Budget Overview**
  - Total budget count
  - Active budgets
  - Exceeded budget count
  - Warning budget count
  - Total budgeted amount
  - Total spent amount
  - Average budget utilization

### Data Models
```typescript
MonthSummary {
  total_income: number
  total_expense: number
  net_amount: number
  income_count: number
  expense_count: number
  savings_rate: number
}

TopCategory {
  category_id: number
  category_name: string
  total_amount: number
  percentage: number
  count: number
}

BudgetSummary {
  total_budgets: number
  active_budgets: number
  exceeded_budgets: number
  warning_budgets: number
  total_budgeted: number
  total_spent: number
  average_utilization: number
}

DashboardSummary {
  current_month: MonthSummary
  last_month: MonthSummary
  top_categories: TopCategory[]
  recent_transactions: RecentTransaction[]
  budget_summary: BudgetSummary
}
```

### API Endpoints
```
GET /analytics/dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

---

## 🏦 7. Bank/Account Management

### Features
- **Bank List**
  - View all bank accounts
  - Pagination support (100 items per page)
  - Display: bank name, color, image/icon
  
- **View Bank**
  - View single bank account details

### Data Model
```typescript
Bank {
  id: number
  bank_name: string
  color?: string
  image?: string
}
```

### API Endpoints
```
GET /banks?page=1&page_size=100
GET /banks/:id
```

---

## 🎨 8. UI/UX Features

### Design Patterns
- **Material Design** (using React Native Paper equivalent in Swift: Material Components)
- **Card-based layouts** with elevation and shadows
- **Color-coded status indicators**
- **Progress bars** for visual feedback
- **Floating Action Buttons (FAB)** for primary actions
- **Swipe gestures** for delete actions
- **Pull-to-refresh** for data updates
- **Empty states** with helpful messages
- **Loading states** during API calls
- **Snackbars/Toasts** for success/error feedback

### Navigation
- **Tab-based navigation** (bottom tabs)
- **Stack navigation** for screens
- **Modal presentation** for add/edit forms
- **Deep linking** support
- **Authentication-based routing** (public vs protected routes)

### Form Components
- **Text inputs** with validation
- **Secure text entry** for passwords
- **Date pickers** (calendar UI)
- **Dropdown/Picker** for categories and banks
- **Segmented controls** for period selection
- **Sliders** for threshold selection
- **Helper text** for validation errors

### Best Practices
- **Keyboard-aware scrolling**
- **Form validation** before submission
- **Error handling** with user-friendly messages
- **Confirmation dialogs** for destructive actions
- **Responsive layouts**

---

## 🔧 9. Technical Requirements

### Core Technologies (Swift Equivalents)
- **React Native/Expo** → **SwiftUI/UIKit**
- **React Navigation** → **UINavigationController / NavigationView**
- **React Native Paper** → **Material Components for iOS / Custom components**
- **Axios** → **URLSession / Alamofire**
- **AsyncStorage** → **Keychain (for tokens) / UserDefaults (for non-sensitive data)**
- **React Context API** → **@StateObject / @EnvironmentObject / Combine**

### API Integration
- **Base URL configuration**
- **Request interceptors** (add auth token)
- **Response interceptors** (error handling, 401 auto-logout)
- **Network error handling**
- **Timeout configuration** (10 seconds)
- **Typed API responses**

### Data Persistence
- **Token storage** (secure)
- **User data caching**
- **Offline support** (optional, not implemented in current version)

### API Response Format
All endpoints follow this structure:
```typescript
{
  status: boolean,
  message: string,
  data?: any
}
```

Success example:
```json
{
  "status": true,
  "message": "Success message",
  "data": { ... }
}
```

Error example:
```json
{
  "status": false,
  "message": "Error message"
}
```

---

## 📋 10. Feature Checklist for Swift Implementation

### Phase 1: Foundation
- [ ] Project setup with SwiftUI
- [ ] API client with URLSession/Alamofire
- [ ] Keychain wrapper for secure token storage
- [ ] Authentication flow (login, register, logout)
- [ ] Protected route management
- [ ] Base UI components library

### Phase 2: Core Features
- [ ] Category CRUD operations
- [ ] Transaction CRUD operations
- [ ] Transaction list with filters and pagination
- [ ] Bank account list

### Phase 3: Budget Management
- [ ] Budget creation form
- [ ] Budget list with progress visualization
- [ ] Budget status calculation and display
- [ ] Budget deletion

### Phase 4: Analytics & Alerts
- [ ] Dashboard with financial summary
- [ ] Analytics charts (income/expense trends)
- [ ] Top categories visualization
- [ ] Budget alerts list
- [ ] Alert notifications

### Phase 5: Polish
- [ ] Pull-to-refresh on all lists
- [ ] Infinite scroll for transactions
- [ ] Swipe gestures for delete
- [ ] Empty states and loading indicators
- [ ] Error handling and user feedback
- [ ] Dark mode support (optional)
- [ ] Localization (optional)

---

## 🎯 Key Differentiators

**This is NOT a loyalty/points app** - confirmed no rewards or points system exists in this project.

**Focus Areas:**
1. Personal expense tracking
2. Budget management with visual alerts
3. Category-based organization
4. Multi-account/bank support
5. Analytics and insights
6. Proactive budget monitoring

**Target User:** Individuals managing personal finances across multiple categories and accounts

---

## 📝 Notes for Swift Development

### Recommended Architecture
- **MVVM** (Model-View-ViewModel) pattern
- **Combine** for reactive programming
- **SwiftUI** for modern declarative UI
- **Codable** for JSON parsing
- **Repository pattern** for API data layer

### Third-party Libraries to Consider
- **Alamofire** - Networking (or native URLSession)
- **KeychainSwift** - Secure storage
- **Charts** - Data visualization
- **SwiftDate** - Date manipulation

### iOS-Specific Considerations
- **Keychain** for token storage (more secure than UserDefaults)
- **UserNotifications** framework for budget alerts
- **Combine** for state management
- **NavigationStack** (iOS 16+) or NavigationView
- **TabView** for bottom tabs
- **Sheet** modifier for modal presentations
- **@FocusState** for keyboard management

---

## 🚀 Getting Started with Backend

The backend API should be running and accessible. Update the base URL configuration:
- **iOS Simulator**: `http://localhost:8080`
- **Physical Device**: `http://YOUR_COMPUTER_IP:8080`
- **Production**: `https://your-api-domain.com`

All endpoints require authentication (except `/register` and `/login`) via Bearer token in the Authorization header.

---

**Total Features:** 7 major modules
**API Services:** 7 services (auth, transactions, categories, budgets, analytics, alerts, banks)
**Screens:** 6+ screen groups (Auth, Home, Transactions, Categories, Budgets, Alerts)
**Dependencies:** React Native Paper, Axios, AsyncStorage, React Navigation, Expo
