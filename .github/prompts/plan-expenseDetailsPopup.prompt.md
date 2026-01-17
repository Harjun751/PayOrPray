# Plan: Expense Details Popup

## Overview
Update GroupDetail component to show a detailed popup when clicking on an expense, displaying comprehensive information and action options.

## Popup Content

### Information Display
- **Expense Title** - Main heading
- **When Added** - Timestamp formatted (e.g., "2 hours ago" or "Jan 17, 2:30 PM")
- **Who Paid** - Payer name and amount they paid
- **Split Among** - List of all participants and their individual share amounts
- **Category** - Expense category badge
- **Notes** - Any additional notes (if present)
- **Currency** - Display with currency symbol

### Action Buttons
1. **Edit** - Opens inline edit form within the same modal
2. **Delete** - Confirms and deletes expense
3. **Gamble** - Special "Pay or Pray" style action (game mechanic)

## Technical Implementation

### State Management
```
- expenseDetailsOpen: boolean (popup visible)
- selectedExpense: object (current expense being viewed)
- isEditing: boolean (toggle between view/edit mode)
- editFormData: object (form data during edit)
- editLoading: boolean (save in progress)
- deleteConfirm: boolean (confirm deletion dialog)
```

### Data Needed from Backend
- expense.id
- expense.title
- expense.created_at (timestamp)
- expense.amount_cents
- expense.currency
- expense.category
- expense.notes
- expense.payer (object with name, id)
- expense.expense_splits (array of splits with user_id, share_cents)
- User details for split (map user_id to name)

### UI Components
1. **Overlay** - Semi-transparent backdrop
2. **Modal Card** - Centered card with rounded corners, shadow
3. **Header Section** - Title + close button
4. **Info Section** - Display expense details in readable format
5. **Splits Section** - List of participants and amounts
6. **Action Buttons** - Edit, Delete, Gamble (with icons)
7. **Edit Form** - Inline form for editing (conditionally rendered)
8. **Delete Confirmation** - Confirmation dialog before deletion

### Styling Guidelines
- Use primary/accent colors from theme
- Consistent with existing modals (Create Trip modal)
- Responsive on mobile
- Smooth transitions between view/edit modes
- Clear visual hierarchy

### Integration Points
1. **GroupDetail.jsx** - Add popup component and state
2. **expensesApi.js** - Already has update/delete methods
3. **Expense List Item** - Add click handler to open popup
4. **Edit Form** - Inline form rendered in modal when editing
5. **Timestamp Formatting** - Format `created_at` to relative time or formatted date

### Gamble Button
- Design TBD: What does "gamble" do?
- Should it integrate with "Pay or Pray" game mechanics?
- Placeholder for future feature or existing game endpoint?

## Step-by-Step Implementation

1. Add state variables to GroupDetail for popup management
2. Create ExpenseDetails component or inline JSX
3. Add click handler to expense list items
4. Build popup UI with sections (info, splits, actions)
5. Implement edit mode toggle with form
6. Add delete confirmation flow
7. Wire up API calls (update, delete)
8. Add timestamp formatting utility
9. Map user_id to names for splits display
10. Style with theme colors and animations

## Open Questions

- How to map user_id to user names in splits?
- What is the "gamble" button functionality?
- Should delete have confirmation dialog?
- Date format preference (relative or absolute)?
- Mobile responsive behavior for modal?

## Files to Modify

- `Frontend/src/pages/GroupDetail.jsx` - Main component
- `Frontend/src/services/api.js` - Already has methods needed
- Possibly create `Frontend/src/components/ExpenseDetails.jsx` (optional, for separation)
