import { useEffect, useState } from "react";
import { expensesApi, setAuthFromSupabase, peopleApi, inviteAPI } from "../services/api";
import { supabase } from "../services/supabase";
import ExpensesList from "../components/ExpensesList";
import MembersList from "../components/MembersList";
import ExpenseDetailsModal from "../components/ExpenseDetailsModal";

export default function GroupDetail({ groupId, groupName, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Expense Form State
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

  // Expense Details Modal State
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [detailsEditLoading, setDetailsEditLoading] = useState(false);
  const [detailsEditError, setDetailsEditError] = useState('');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  // sticky multi-selection for people search results
  const [selectedPeople, setSelectedPeople] = useState([]); // array of { id, name }
  const selectedIds = selectedPeople.map(p => p.id);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSendError, setInviteSendError] = useState('');

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

  // Expense Details Modal Handlers
  const handleOpenExpenseDetails = (expense) => {
    setSelectedExpense(expense);
    setExpenseDetailsOpen(true);
    setDetailsEditError('');
  };

  const handleCloseExpenseDetails = () => {
    setExpenseDetailsOpen(false);
    setSelectedExpense(null);
    setDetailsEditError('');
  };

  const handleSaveExpenseDetails = async (editFormData, selectedMembers) => {
    setDetailsEditLoading(true);
    setDetailsEditError('');

    if (selectedMembers.length === 0) {
      setDetailsEditError('Please select at least one member to split with');
      setDetailsEditLoading(false);
      return;
    }

    try {
      await setAuthFromSupabase();

      // Calculate splits
      const totalAmount = parseInt(editFormData.amount_cents);
      const perPerson = Math.floor(totalAmount / selectedMembers.length);
      const remainder = totalAmount % selectedMembers.length;

      const splits = selectedMembers.map((memberId, index) => ({
        user_id: memberId,
        share_cents: perPerson + (index < remainder ? 1 : 0)
      }));

      const updateData = {
        ...editFormData,
        expense_splits: splits
      };

      const result = await expensesApi.update(groupId, selectedExpense.id, updateData);

      // Update expenses list
      setExpenses(prev =>
        prev.map(exp => exp.id === selectedExpense.id ? result[0] : exp)
      );

      // Close popup and return to expenses view
      handleCloseExpenseDetails();
    } catch (err) {
      setDetailsEditError(err.message || 'Failed to update expense');
      console.error('Error updating expense:', err);
    } finally {
      setDetailsEditLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    setDetailsEditLoading(true);
    setDetailsEditError('');

    try {
      await setAuthFromSupabase();
      await expensesApi.delete(groupId, selectedExpense.id);

      // Remove from expenses list
      setExpenses(prev => prev.filter(exp => exp.id !== selectedExpense.id));

      // Close popup
      handleCloseExpenseDetails();
    } catch (err) {
      setDetailsEditError(err.message || 'Failed to delete expense');
      console.error('Error deleting expense:', err);
    } finally {
      setDetailsEditLoading(false);
    }
  };

  // Debounced search: calls GET /people with body { name: inviteQuery }
  useEffect(() => {
    if (!inviteQuery) {
      setInviteResults([]);
      setInviteError('');
      return;
    }

    const t = setTimeout(async () => {
      try {
        setInviteLoading(true);
        setInviteError('');
        await setAuthFromSupabase();

        // use axios helper
        const data = await peopleApi.search(inviteQuery);
        setInviteResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('People search failed', err);
        setInviteError(err.message || 'Search failed');
      } finally {
        setInviteLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [inviteQuery]);

  const sendInvite = async () => {
    if (selectedPeople.length === 0) {
      setInviteSendError('Select at least one person to invite');
      return;
    }

    try {
      setInviteSending(true);
      setInviteSendError('');
      await setAuthFromSupabase();

      // Send one POST per selected user: POST /trips/{tripId}/invites with { UserID: [number] }
      const promises = selectedIds.map(id => inviteAPI.create(groupId, id));
      await Promise.all(promises);

      // close modal and reset
      setShowInviteModal(false);
      setSelectedPeople([]);
      setInviteQuery('');
      setInviteResults([]);
    } catch (err) {
      console.error('Send invite failed', err);
      setInviteSendError(err.response?.data?.error || err.message || 'Failed to send invite');
    } finally {
      setInviteSending(false);
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
            <ExpensesList
              expenses={expenses}
              members={members}
              onExpenseClick={handleOpenExpenseDetails}
              showAddForm={showAddExpense}
              onToggleAddForm={() => setShowAddExpense(!showAddExpense)}
              onSubmitExpense={handleAddExpense}
              formData={expenseFormData}
              onFormChange={handleExpenseInputChange}
              selectedPayer={selectedPayer}
              onPayerChange={setSelectedPayer}
              selectedMembers={selectedMembers}
              onMemberToggle={handleMemberToggle}
              error={expenseError}
              loading={expenseLoading}
            />
          </div>

          {/* Right: Members */}
          <div className="lg:col-span-1">
            <MembersList
              members={members}
              onInvite={() => setShowInviteModal(true)}
            />
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowInviteModal(false)} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Invite member</h3>
                <button className="text-gray-500" onClick={() => setShowInviteModal(false)}>✕</button>
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Search people</label>
                {/* Selected people tags (sticky) */}
                {selectedPeople.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPeople.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-sm">
                        <span>{p.name}</span>
                        <button
                          onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))}
                          className="text-xs text-gray-500 px-1"
                          aria-label={`Remove ${p.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={inviteQuery}
                  onChange={(e) => { setInviteQuery(e.target.value); setInviteSendError(''); }}
                  className="w-full border border-gray-200 rounded-md px-3 py-2"
                  placeholder="Type a name..."
                />
              </div>

              <div className="mb-3 max-h-48 overflow-auto border border-gray-100 rounded-md">
                {inviteLoading && <div className="p-3 text-sm text-gray-500">Searching...</div>}
                {inviteError && <div className="p-3 text-sm text-red-500">{inviteError}</div>}
                {!inviteLoading && inviteResults.length === 0 && inviteQuery && (
                  <div className="p-3 text-sm text-gray-500">No results</div>
                )}
                <ul>
                  {inviteResults.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <li
                        key={p.id}
                        onClick={() => {
                          setSelectedPeople(prev => {
                            if (prev.find(x => x.id === p.id)) {
                              return prev.filter(x => x.id !== p.id);
                            }
                            return [...prev, p];
                          });
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                      >
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">id: {p.id}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {inviteSendError && <div className="mb-2 text-sm text-red-500">{inviteSendError}</div>}

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setShowInviteModal(false); }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={sendInvite}
                  disabled={inviteSending || selectedPeople.length === 0}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md disabled:opacity-60"
                >
                  {inviteSending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense Details Modal */}
        <ExpenseDetailsModal
          isOpen={expenseDetailsOpen}
          expense={selectedExpense}
          members={members}
          onClose={handleCloseExpenseDetails}
          onSave={handleSaveExpenseDetails}
          onDelete={handleDeleteExpense}
          isLoading={detailsEditLoading}
          error={detailsEditError}
        />
      </main>
    </div>
  );
}
