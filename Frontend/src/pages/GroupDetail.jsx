import { useEffect, useState } from "react";
import { expensesApi, setAuthFromSupabase } from "../services/api";
import { supabase } from "../services/supabase";

export default function GroupDetail({ groupId, groupName, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                  onClick={() => alert('Add expense modal - coming soon')}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Add Expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No expenses yet</p>
                  <p className="text-sm">Add your first expense to start tracking!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
                          Paid by {members.find(m => m.PersonID === expense.payer_id)?.Name || 'Unknown'}
                        </div>
                      </div>
                    </div>
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
