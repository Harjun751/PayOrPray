import { useEffect, useState } from "react";
import TopNav from "../components/dashboard/TopNav";
import BalanceCard from "../components/dashboard/BalanceCard";
import GroupsSection from "../components/dashboard/GroupsSection";
import QuickActions from "../components/dashboard/QuickActions";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { tripsApi, setAuthFromSupabase, testAPI, expensesApi } from "../services/api";

export default function Dashboard({ session, onSignOut }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    currency: 'SGD',
    amount_cents: '',
    notes: '',
    category: '',
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  // Mock numbers - TODO: Calculate from real data
  const summary = {
    total: -67.7,
    owedToYou: 57.8,
    youOwe: 125.5,
  };

  // Fetch trips from API
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // Get user ID from session metadata or use phone number as fallback
        const userId = session?.user?.user_metadata?.sub || session?.user?.id;
        
        if (!userId) {
          console.error("No user ID found in session");
          setError("Authentication error");
          setLoading(false);
          return;
        }

        // Set user ID for API requests
        await setAuthFromSupabase();

        // Fetch trips from backend
        const trips = await tripsApi.list(1);
        
        // Transform backend data to frontend format
        const transformedGroups = trips.map((trip, index) => {
          // Generate member initials from People array
          const memberInitials = trip.People.map(person => {
            const names = person.Name.split(' ');
            return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
          });

          // Color palette for groups
          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500'];
          
          return {
            id: trip.TripID,
            name: trip.Description,
            memberCount: trip.People.length,
            members: memberInitials,
            balance: 0, // TODO: Calculate from expenses
            accent: colors[index % colors.length],
          };
        });

        setGroups(transformedGroups);
        setError(null);
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTrips();
    }
  }, [session]);

  // Fetch expenses for selected trip
  const fetchExpenses = async (tripId) => {
    try {
      await setAuthFromSupabase();
      const data = await expensesApi.list(tripId);
      setExpenses(data);
      setSelectedTrip(tripId);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  // Handle add expense form changes
  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseFormData(prev => ({
      ...prev,
      [name]: name === 'amount_cents' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  // Handle add expense submission
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseLoading(true);

    try {
      await setAuthFromSupabase();
      const result = await expensesApi.create(selectedTrip, expenseFormData);
      
      // Add new expense to list
      setExpenses(prev => [...prev, result[0]]);
      
      // Reset form
      setExpenseFormData({
        title: '',
        currency: 'SGD',
        amount_cents: '',
        notes: '',
        category: '',
      });
      setShowAddExpense(false);
    } catch (err) {
      setExpenseError(err.response?.data?.error || 'Failed to create expense');
      console.error('Error creating expense:', err);
    } finally {
      setExpenseLoading(false);
    }
  };

  // Mock activity
  const activity = [
    { id: 1, text: "You added Hotpot @ Bugis ($92.40) in Weekend Squad", time: "2h" },
    { id: 2, text: "Roommates: Pay or Pray round created", time: "1d" },
    { id: 3, text: "Alex settled up in Work Lunch Crew", time: "3d" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <TopNav
        userEmail={session?.user?.email}
        onAdd={() => alert("Open add modal")}
        onSignOut={onSignOut}
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <BalanceCard summary={summary} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Splitwise-like layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            <GroupsSection
              groups={groups}
              onNewGroup={() => alert("Open new group modal")}
              onOpenGroup={(g) => {
                fetchExpenses(g.id);
              }}
            />
            
            {/* Expenses Section */}
            {selectedTrip && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Expenses</h2>
                  <button
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    {showAddExpense ? 'Cancel' : '+ Add Expense'}
                  </button>
                </div>

                {/* Add Expense Form */}
                {showAddExpense && (
                  <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {expenseError && <div className="text-red-600 text-sm mb-3">{expenseError}</div>}
                    
                    <input
                      type="text"
                      name="title"
                      placeholder="Expense title"
                      value={expenseFormData.title}
                      onChange={handleExpenseInputChange}
                      required
                      className="w-full mb-3 p-2 border border-gray-300 rounded text-sm"
                    />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="number"
                        name="amount_cents"
                        placeholder="Amount (cents)"
                        value={expenseFormData.amount_cents}
                        onChange={handleExpenseInputChange}
                        required
                        className="p-2 border border-gray-300 rounded text-sm"
                      />
                      <select
                        name="currency"
                        value={expenseFormData.currency}
                        onChange={handleExpenseInputChange}
                        className="p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="SGD">SGD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>

                    <select
                      name="category"
                      value={expenseFormData.category}
                      onChange={handleExpenseInputChange}
                      className="w-full mb-3 p-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select category</option>
                      <option value="food">Food</option>
                      <option value="transport">Transport</option>
                      <option value="accommodation">Accommodation</option>
                      <option value="activities">Activities</option>
                      <option value="shopping">Shopping</option>
                      <option value="other">Other</option>
                    </select>

                    <textarea
                      name="notes"
                      placeholder="Notes (optional)"
                      value={expenseFormData.notes}
                      onChange={handleExpenseInputChange}
                      className="w-full mb-3 p-2 border border-gray-300 rounded text-sm"
                      rows="2"
                    />

                    <button
                      type="submit"
                      disabled={expenseLoading}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                      {expenseLoading ? 'Creating...' : 'Add Expense'}
                    </button>
                  </form>
                )}

                {/* Expenses List */}
                <div className="space-y-2">
                  {expenses.length > 0 ? (
                    expenses.map(expense => (
                      <div key={expense.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{expense.title}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {expense.category && <span className="capitalize">{expense.category}</span>}
                              {expense.notes && <span className="ml-2">• {expense.notes}</span>}
                            </p>
                          </div>
                          <p className="font-bold text-blue-600">
                            ${(expense.amount_cents / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No expenses yet</p>
                  )}
                </div>
              </div>
            )}
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
                <button
                  onClick={() => alert("Create group")}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Create Your First Group
                </button>
              </div>
            
          </div>

          {/* Right: sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            <QuickActions
              onAddExpense={() => {
                if (selectedTrip) {
                  setShowAddExpense(true);
                } else {
                  alert('Select a group first');
                }
              }}
              onSettleUp={() => alert("Settle up")}
              onPayOrPray={() => alert("Pay or Pray round")}
            />
            <ActivityFeed items={activity} />
          </aside>
        </div>
      </main>
    </div>
  );
}
