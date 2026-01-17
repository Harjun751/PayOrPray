import { useState } from "react";

export default function ExpenseItem({ expense, members }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAmount = (amountCents, currency = 'SGD') => {
    const amount = amountCents / 100;
    return `${currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPayer = () => {
    // Check if payer is an object (from backend query with join)
    if (expense.payer && typeof expense.payer === 'object') {
      return expense.payer.name || 'Unknown';
    }
    
    // Check if payer_id exists (direct field)
    if (expense.payer_id) {
      const payer = members.find(m => m.PersonID === expense.payer_id);
      return payer?.Name || 'Unknown';
    }
    
    // Fallback: check if payer is just an ID
    if (expense.payer) {
      const payer = members.find(m => m.PersonID === expense.payer);
      return payer?.Name || 'Unknown';
    }
    
    return 'Unknown';
  };

  const getSplitMembers = () => {
    if (!expense.expense_splits || expense.expense_splits.length === 0) {
      return [];
    }
    
    return expense.expense_splits.map(split => {
      const member = members.find(m => m.PersonID === split.user_id);
      return {
        name: member?.Name || 'Unknown',
        shareCents: split.share_cents,
        userId: split.user_id
      };
    });
  };

  const splitMembers = getSplitMembers();

  return (
    <div
      className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              {expense.category?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <h3 className="font-semibold">{expense.title}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(expense.created_at)}
                {expense.notes && ` • ${expense.notes}`}
              </p>
              {expense.category && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                  {expense.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">
            {formatAmount(expense.amount_cents, expense.currency)}
          </div>
          <div className="text-xs text-gray-500">
            Paid by {getPayer()}
          </div>
        </div>
      </div>

      {/* Expanded Section - Split Details */}
      {isExpanded && splitMembers.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Split among:</h4>
          <div className="space-y-2">
            {splitMembers.map((split, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                    {split.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span className="text-gray-700">{split.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatAmount(split.shareCents, expense.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
