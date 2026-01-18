import ExpenseItem from "./ExpenseItem";

export default function ExpensesList({
  expenses,
  members,
  onExpenseClick,
  showAddForm,
  onToggleAddForm,
  onSubmitExpense,
  formData,
  onFormChange,
  selectedPayer,
  onPayerChange,
  selectedMembers,
  onMemberToggle,
  error,
  loading,
}) {
  const calculateSplits = () => {
    if (!formData.amount_cents || selectedMembers.length === 0) {
      return [];
    }
    const totalAmount = parseInt(formData.amount_cents);
    const perPerson = Math.floor(totalAmount / selectedMembers.length);
    const remainder = totalAmount % selectedMembers.length;

    return selectedMembers.map((memberId, index) => ({
      user_id: memberId,
      share_cents: perPerson + (index < remainder ? 1 : 0)
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Expenses</h2>
        <button
          onClick={onToggleAddForm}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
        >
          {showAddForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <form onSubmit={onSubmitExpense} className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Dinner at Restaurant"
              value={formData.title}
              onChange={onFormChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
            />
          </div>

          {/* Paid By Selection */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paid by *
            </label>
            <select
              value={selectedPayer || ''}
              onChange={(e) => onPayerChange(parseInt(e.target.value))}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230ea5e9' d='M1 4l5 4 5-4'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px'
              }}
            >
              <option value="">Select who paid</option>
              {members.map(member => (
                <option key={member.PersonID} value={member.PersonID}>
                  {member.Name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (cents) *
              </label>
              <input
                type="number"
                name="amount_cents"
                placeholder="e.g., 5000 for $50.00"
                value={formData.amount_cents}
                onChange={onFormChange}
                required
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
              />
              {formData.amount_cents && (
                <p className="text-xs text-gray-500 mt-1.5 font-medium">
                  = ${(formData.amount_cents / 100).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency *
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={onFormChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230ea5e9' d='M1 4l5 4 5-4'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px'
                }}
              >
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={onFormChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230ea5e9' d='M1 4l5 4 5-4'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px'
              }}
            >
              <option value="">Select category</option>
              <option value="food">Food & Drinks</option>
              <option value="transport">Transport</option>
              <option value="accommodation">Accommodation</option>
              <option value="activities">Activities</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Add any additional details..."
              value={formData.notes}
              onChange={onFormChange}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors resize-none"
            />
          </div>

          {/* Member Selection for Splitting */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Split with * ({selectedMembers.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3 max-h-48 overflow-y-auto">
              {members.length > 0 ? (
                members.map(member => (
                  <label
                    key={member.PersonID}
                    className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.PersonID)}
                      onChange={() => onMemberToggle(member.PersonID)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                        {member.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      {member.Name}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No members available</p>
              )}
            </div>
            {selectedMembers.length > 0 && formData.amount_cents && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <p className="font-semibold mb-2">Split breakdown:</p>
                {calculateSplits().map((split, idx) => {
                  const member = members.find(m => m.PersonID === split.user_id);
                  return (
                    <div key={idx} className="flex justify-between mb-1 last:mb-0">
                      <span>{member?.Name}:</span>
                      <span className="font-medium">
                        {formData.currency} ${(split.share_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Creating...' : 'Add Expense'}
          </button>
        </form>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No expenses yet</p>
          <p className="text-sm">Add your first expense to start tracking!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              members={members}
              onOpenDetails={onExpenseClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
