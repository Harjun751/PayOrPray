import { useEffect, useState } from "react";
import { expensesApi, setAuthFromSupabase } from "../services/api";
import { supabase } from "../services/supabase";
import ExpenseItem from "../components/ExpenseItem";

export default function GroupDetail({ groupId, groupName, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    currency: 'SGD',
    amount_cents: '',
    notes: '',
    category: '',
  });
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        await setAuthFromSupabase();

        // Fetch expenses using the API
        const expensesData = await expensesApi.list(groupId);
        setExpenses(expensesData || []);

        // Fetch members directly from Supabase
        const { data: membersData, error: membersError } = await supabase
          .from("trip_members")
          .select("user_id, users(id, name, phone_no)")
          .eq("trip_id", groupId);

        if (membersError) {
          console.error("Error fetching members:", membersError);
          throw membersError;
        }

        // Transform members data to match expected format
        const transformedMembers = (membersData || [])
          .filter(m => m.users)
          .map(m => ({
            PersonID: m.users.id,
            Name: m.users.name || 'Unknown',
            Number: String(m.users.phone_no || ''),
          }));

        setMembers(transformedMembers);
        setError(null);
      } catch (err) {
        console.error("Error fetching group data:", err);
        setError("Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  // Handle expense form input changes
  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseFormData(prev => ({
      ...prev,
      [name]: name === 'amount_cents' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  // Handle member selection for splitting
  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Calculate split amounts
  const calculateSplits = () => {
    if (!expenseFormData.amount_cents || selectedMembers.length === 0) {
      return [];
    }
    const totalAmount = parseInt(expenseFormData.amount_cents);
    const perPerson = Math.floor(totalAmount / selectedMembers.length);
    const remainder = totalAmount % selectedMembers.length;
    
    return selectedMembers.map((memberId, index) => ({
      user_id: memberId,
      share_cents: perPerson + (index < remainder ? 1 : 0)
    }));
  };

  // Handle add expense submission
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');

    if (!selectedPayer) {
      setExpenseError('Please select who paid for this expense');
      return;
    }

    if (selectedMembers.length === 0) {
      setExpenseError('Please select at least one member to split with');
      return;
    }

    setExpenseLoading(true);

    try {
      await setAuthFromSupabase();
      
      // Create expense directly via Supabase to specify custom payer
      const { data: expenseData, error: expenseError } = await supabase
        .from('expense')
        .insert({
          trip_id: groupId,
          payer: selectedPayer,
          title: expenseFormData.title,
          currency: expenseFormData.currency,
          amount_cents: parseInt(expenseFormData.amount_cents),
          notes: expenseFormData.notes,
          category: expenseFormData.category,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;
      
      if (expenseData && expenseData.id) {
        // Create the splits
        const splits = calculateSplits();
        const splitPromises = splits.map(split => 
          supabase.from('expense_splits').insert({
            expense_id: expenseData.id,
            user_id: split.user_id,
            share_cents: split.share_cents
          })
        );
        
        await Promise.all(splitPromises);
        
        // Add expense_splits to the new expense for display
        expenseData.expense_splits = splits;
        
        setExpenses(prev => [expenseData, ...prev]);
      }
      
      // Reset form
      setExpenseFormData({
        title: '',
        currency: 'SGD',
        amount_cents: '',
        notes: '',
        category: '',
      });
      setSelectedPayer(null);
      setSelectedMembers([]);
      setShowAddExpense(false);
      setExpenseError('');
    } catch (err) {
      setExpenseError(err.response?.data?.error || 'Failed to create expense');
      console.error('Error creating expense:', err);
    } finally {
      setExpenseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading group details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">{groupName}</h1>
          <p className="text-gray-600 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Expenses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Expenses</h2>
                <button 
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  {showAddExpense ? 'Cancel' : '+ Add Expense'}
                </button>
              </div>

              {/* Add Expense Form */}
              {showAddExpense && (
                <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {expenseError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                      {expenseError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Dinner at Restaurant"
                      value={expenseFormData.title}
                      onChange={handleExpenseInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Paid By Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paid by *
                    </label>
                    <select
                      value={selectedPayer || ''}
                      onChange={(e) => setSelectedPayer(parseInt(e.target.value))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select who paid</option>
                      {members.map(member => (
                        <option key={member.PersonID} value={member.PersonID}>
                          {member.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (cents) *
                      </label>
                      <input
                        type="number"
                        name="amount_cents"
                        placeholder="e.g., 5000 for $50.00"
                        value={expenseFormData.amount_cents}
                        onChange={handleExpenseInputChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {expenseFormData.amount_cents && (
                        <p className="text-xs text-gray-500 mt-1">
                          = ${(expenseFormData.amount_cents / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency *
                      </label>
                      <select
                        name="currency"
                        value={expenseFormData.currency}
                        onChange={handleExpenseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="SGD">SGD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={expenseFormData.category}
                      onChange={handleExpenseInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      placeholder="Add any additional details..."
                      value={expenseFormData.notes}
                      onChange={handleExpenseInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Member Selection for Splitting */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Split with * ({selectedMembers.length} selected)
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-white max-h-48 overflow-y-auto">
                      {members.length > 0 ? (
                        <div className="space-y-2">
                          {members.map(member => (
                            <label 
                              key={member.PersonID} 
                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(member.PersonID)}
                                onChange={() => handleMemberToggle(member.PersonID)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-sm text-gray-700 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {member.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                {member.Name}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No members available</p>
                      )}
                    </div>
                    {selectedMembers.length > 0 && expenseFormData.amount_cents && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <p className="font-medium mb-1">Split breakdown:</p>
                        {calculateSplits().map((split, idx) => {
                          const member = members.find(m => m.PersonID === split.user_id);
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{member?.Name}:</span>
                              <span className="font-medium">
                                {expenseFormData.currency} ${(split.share_cents / 100).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={expenseLoading}
                    className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {expenseLoading ? 'Creating...' : 'Add Expense'}
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Members */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Members</h2>
              
              {members.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No members</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.PersonID}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {member.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.Name}</h3>
                        {member.Number && (
                          <p className="text-sm text-gray-600">{member.Number}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => alert('Invite member - coming soon')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Invite Member
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
