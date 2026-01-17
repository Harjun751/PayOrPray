# Expense Splitting Feature Documentation

## Overview

This feature provides a complete expense splitting system where expenses are split equally among participants. The split calculation happens on the backend, and the frontend mirrors the same logic for real-time preview.

## Architecture

### Backend (Node.js/Express)

#### Files Modified:
- `Backend/model/expensesModel.js` - Added splitting logic
- `Backend/controller/expensesController.js` - Added split endpoint
- `Backend/controller/app.js` - Added route

#### Key Functions:

**`calculateSplits(amountCents, userIds)`**
- Calculates equal splits with proper remainder distribution
- Parameters:
  - `amountCents` (number): Total amount in cents
  - `userIds` (array): Array of user IDs to split among
- Returns: Array of split objects with `userId` and `shareCents`
- Algorithm: 
  - Base share = floor(amountCents / number of users)
  - Remainder distributed to first N participants (where N = remainder)

**`addExpenseWithSplits(tripId, payerId, title, currency, amountCents, notes, category, userIds)`**
- Creates expense and splits in a single transaction
- Automatically inserts expense record and expense_splits records
- Returns: Complete expense object with splits data

### API Endpoint

**POST** `/trips/:tripId/expenses/split`

**Request Body:**
```json
{
  "title": "Dinner",
  "currency": "SGD",
  "amount_cents": 5000,
  "notes": "Team dinner at Italian restaurant",
  "category": "food",
  "userIds": [1, 2, 3, 4]
}
```

**Response:**
```json
{
  "expense": {
    "id": 123,
    "payer_id": 1,
    "title": "Dinner",
    "currency": "SGD",
    "amount_cents": 5000,
    "category": "food",
    "created_at": "2025-01-17T10:00:00Z"
  },
  "splits": [
    {
      "expense_id": 123,
      "user_id": 1,
      "share_cents": 1250
    },
    {
      "expense_id": 123,
      "user_id": 2,
      "share_cents": 1250
    },
    {
      "expense_id": 123,
      "user_id": 3,
      "share_cents": 1250
    },
    {
      "expense_id": 123,
      "user_id": 4,
      "share_cents": 1250
    }
  ],
  "totalAmount": 5000,
  "currency": "SGD"
}
```

---

### Frontend (React)

#### Files Created:

1. **`Frontend/src/utils/expenseSplitter.js`**
   - Pure utility functions for split calculations
   - Mirrors backend logic exactly
   - Functions:
     - `calculateSplits(amountCents, userIds)` - Calculate splits
     - `formatSplitsForDisplay(splits, amountCents, currency)` - Format for UI
     - `validateExpenseData(expenseData)` - Validate form data
     - `getExpenseSummary(amountCents, userIds)` - Get summary with splits

2. **`Frontend/src/services/expenseApi.js`**
   - API communication layer
   - Functions:
     - `addExpenseWithSplits(tripId, expenseData, authToken)`
     - `getExpenses(tripId, authToken)`
     - `deleteExpense(tripId, expenseId, authToken)`

3. **`Frontend/src/components/ExpenseForm.jsx`**
   - Complete React component with:
     - Real-time split preview (calculated client-side)
     - Form validation
     - Error/success handling
     - Participant selection
     - Currency and category support

## Usage Example

### Frontend Component Usage

```jsx
import ExpenseForm from './components/ExpenseForm';

function TripPage({ tripId, session }) {
  const tripMembers = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ];

  const handleExpenseAdded = (result) => {
    console.log('Expense created:', result);
    // Refresh expense list, etc.
  };

  return (
    <ExpenseForm
      tripId={tripId}
      tripMembers={tripMembers}
      authToken={session.access_token}
      onExpenseAdded={handleExpenseAdded}
    />
  );
}
```

### Direct API Usage (Frontend)

```jsx
import { addExpenseWithSplits } from './services/expenseApi';
import { calculateSplits } from './utils/expenseSplitter';

// Create an expense with splits
const expenseData = {
  title: 'Restaurant',
  currency: 'SGD',
  amount_cents: 12000, // $120.00
  category: 'food',
  userIds: [1, 2, 3]
};

try {
  const result = await addExpenseWithSplits(tripId, expenseData, authToken);
  console.log('Splits:', result.splits);
} catch (error) {
  console.error('Failed:', error);
}
```

### Split Calculation Examples

```javascript
import { calculateSplits, getExpenseSummary } from './utils/expenseSplitter';

// Example 1: Even split
const splits1 = calculateSplits(10000, [1, 2, 4]); // $100 split 3 ways
// Result:
// [
//   { userId: 1, shareCents: 3334 },
//   { userId: 2, shareCents: 3333 },
//   { userId: 4, shareCents: 3333 }
// ]

// Example 2: Get summary
const summary = getExpenseSummary(10000, [1, 2, 4]);
// Result:
// {
//   totalCents: 10000,
//   totalAmount: "100.00",
//   splitCount: 3,
//   baseShareCents: 3333,
//   remainder: 1,
//   splits: [...]
// }
```

## Split Algorithm Detail

The algorithm ensures:
1. **Equal distribution**: Each person pays approximately the same
2. **No loss**: Sum of all splits = total amount (cent-perfect)
3. **Fair remainder**: Any remainder is distributed to the first N participants

### Example with Remainder:
- Total: $100.01 (10001¢)
- Split among 3 people
- Base share: 3333¢
- Remainder: 2¢
- Distribution:
  - Person 1: 3334¢
  - Person 2: 3334¢
  - Person 3: 3333¢
  - Total: 10001¢ ✓

## Database Schema

### expenses table
```sql
CREATE TABLE expenses (
  id BIGINT PRIMARY KEY DEFAULT nextval('expenses_id_seq'),
  trips_id BIGINT REFERENCES trips(id),
  payer_id BIGINT REFERENCES users(id),
  title TEXT,
  currency TEXT DEFAULT 'SGD',
  amount_cents BIGINT,
  notes TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### expense_splits table
```sql
CREATE TABLE expense_splits (
  expense_id BIGINT REFERENCES expenses(id),
  user_id BIGINT REFERENCES users(id),
  share_cents BIGINT,
  PRIMARY KEY (expense_id, user_id)
);
```

## Error Handling

### Backend Validation
- Validates required fields: title, currency, amount_cents, userIds
- Ensures userIds is non-empty array
- Automatically includes payer in splits if not provided
- Returns 400 for validation errors
- Returns 500 for database errors

### Frontend Validation
- Validates all required fields before submission
- Real-time preview shows split immediately
- Shows user-friendly error messages
- Prevents submission without participants selected

## Testing the Endpoint

### cURL Example
```bash
curl -X POST http://localhost:8081/trips/1/expenses/split \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Dinner",
    "currency": "SGD",
    "amount_cents": 5000,
    "notes": "Team dinner",
    "category": "food",
    "userIds": [1, 2, 3, 4]
  }'
```

## Integration with Existing Code

To integrate with your existing pages:

1. **Import the component:**
```jsx
import ExpenseForm from '../components/ExpenseForm';
```

2. **Add to your page:**
```jsx
<ExpenseForm
  tripId={trip.id}
  tripMembers={tripMembers}
  authToken={session.access_token}
  onExpenseAdded={refreshExpenses}
/>
```

3. **Fetch trip members** (from your trips endpoint or similar)

4. **Refresh expense list** when new expense is added

## Future Enhancements

- Custom split ratios (unequal splits)
- Group categories with preset splits
- Expense editing
- Split history/audit log
- Receipt attachment support
- Multiple expense creation in batch
- Debt settlement calculations

---

**Created:** January 17, 2026
**Version:** 1.0
