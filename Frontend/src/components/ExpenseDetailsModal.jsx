import { useState } from "react";

export default function ExpenseDetailsModal({
  isOpen,
  expense,
  members,
  onClose,
  onSave,
  onDelete,
  isLoading,
  error,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [detailsSelectedMembers, setDetailsSelectedMembers] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    currency: 'SGD',
    amount_cents: '',
    notes: '',
    category: '',
    payer_id: '',
  });

  const handleEditClick = () => {
    setIsEditing(true);
    setEditFormData({
      title: expense.title,
      currency: expense.currency,
      amount_cents: expense.amount_cents,
      notes: expense.notes,
      category: expense.category,
      payer_id: expense.payer_id || expense.payer?.id || '',
    });
    if (expense.expense_splits && expense.expense_splits.length > 0) {
      setDetailsSelectedMembers(expense.expense_splits.map(s => s.user_id));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'amount_cents' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  const handleMemberToggle = (memberId) => {
    setDetailsSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSaveClick = () => {
    onSave(editFormData, detailsSelectedMembers);
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-SG', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Expense Details</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <>
              {/* Title and Amount */}
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{expense.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary-600">
                    {expense.currency} ${(expense.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">{expense.currency}</span>
                </div>
              </div>

              {/* When Added */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">Added {formatTimestamp(expense.created_at)}</p>
              </div>

              {/* Who Paid */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Who Paid</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {expense.payer && typeof expense.payer === 'object' 
                      ? expense.payer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : members.find(m => m.PersonID === expense.payer_id)?.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {expense.payer && typeof expense.payer === 'object' 
                        ? expense.payer.name
                        : members.find(m => m.PersonID === expense.payer_id)?.Name || 'Unknown'
                      }
                    </p>
                    <p className="text-sm text-gray-600">Paid {expense.currency} ${(expense.amount_cents / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Category and Notes */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {expense.category && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900">{expense.category}</p>
                  </div>
                )}
                {expense.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{expense.notes}</p>
                  </div>
                )}
              </div>

              {/* Split Among */}
              {expense.expense_splits && expense.expense_splits.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Split Among {expense.expense_splits.length} Member{expense.expense_splits.length !== 1 ? 's' : ''}</h4>
                  <div className="space-y-2">
                    {expense.expense_splits.map((split, idx) => {
                      const member = members.find(m => m.PersonID === split.user_id);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                              {member?.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </div>
                            <span className="text-sm text-gray-700">{member?.Name || 'Unknown'}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {expense.currency} ${(split.share_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleEditClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => alert('Gamble - Coming Soon!')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gamble
                </button>
              </div>
            </>
          ) : (
            // Edit Mode
            <>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid by *
                </label>
                <select
                  value={editFormData.payer_id || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, payer_id: parseInt(e.target.value) }))}
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
                    value={editFormData.amount_cents}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                  />
                  {editFormData.amount_cents && (
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">
                      = ${(editFormData.amount_cents / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={editFormData.currency}
                    onChange={handleInputChange}
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
                  value={editFormData.category}
                  onChange={handleInputChange}
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
                  value={editFormData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors resize-none"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Split with ({detailsSelectedMembers.length} selected)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3 max-h-48 overflow-y-auto">
                  {members.length > 0 ? (
                    members.map(member => (
                      <label
                        key={member.PersonID}
                        className="flex items-center p-2.5 rounded-lg hover:bg-white cursor-pointer transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={detailsSelectedMembers.includes(member.PersonID)}
                          onChange={() => handleMemberToggle(member.PersonID)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer accent-primary-500"
                        />
                        <div className="ml-3 flex items-center gap-2 flex-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {member.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            {member.Name}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No members available</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {/* Delete Confirmation */}
          {deleteConfirm && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Delete this expense?</h4>
              <p className="text-sm text-red-700 mb-4">This action cannot be undone. The expense "{expense.title}" will be permanently deleted.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDelete();
                    setDeleteConfirm(false);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
