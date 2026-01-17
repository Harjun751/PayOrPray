import { useEffect, useState } from "react";
import TopNav from "../components/dashboard/TopNav";
import BalanceCard from "../components/dashboard/BalanceCard";
import GroupsSection from "../components/dashboard/GroupsSection";
import QuickActions from "../components/dashboard/QuickActions";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { tripsApi, setAuthFromSupabase } from "../services/api";

export default function Dashboard({ session, onSignOut }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setAuthFromSupabase();

        const trips = await tripsApi.list();
        
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
              onOpenGroup={(g) => alert(`Open group: ${g.name}`)}
            />
            
            {groups.length === 0 && !loading && !error && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
                <button
                  onClick={() => alert("Create group")}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            <QuickActions
              onAddExpense={() => alert("Add expense")}
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
