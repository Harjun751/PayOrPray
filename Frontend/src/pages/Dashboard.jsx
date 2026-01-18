import { useEffect, useState, useCallback } from "react";
import TopNav from "../components/dashboard/TopNav";
import BalanceCard from "../components/dashboard/BalanceCard";
import GroupsSection from "../components/dashboard/GroupsSection";
import GroupDetail from "./GroupDetail";
import { tripsApi, setAuthFromSupabase, testAPI, expensesApi, owedApi, inviteAPI } from "../services/api";
import InvitePanel from "../components/dashboard/InvitePanel";

/**
 * Hook: Encapsulates dashboard data fetching and actions
 */
function useDashboard(session) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invites, setInvites] = useState([]);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [createTripName, setCreateTripName] = useState('');
  const [createTripDescription, setCreateTripDescription] = useState('');
  const [createTripLoading, setCreateTripLoading] = useState(false);
  const [createTripError, setCreateTripError] = useState('');

  // Helper to extract inviteId and tripId robustly
  const getInviteIds = useCallback((inv) => {
    const inviteId = inv?.id ?? inv?.invite_id ?? inv?.InviteID ?? inv?.InviteId;
    const tripId = inv?.trip_id ?? inv?.TripID ?? inv?.tripId ?? inv?.TripId;
    return { inviteId, tripId };
  }, []);

  // Accept an invite: POST /trips/{tripId}/invites/{inviteId}/accept
  const handleAcceptInvite = useCallback(async (inv) => {
    const { inviteId, tripId } = getInviteIds(inv);
    if (!inviteId || !tripId) {
      console.error("Missing invite or trip id for accept", inv);
      return;
    }
    try {
      await setAuthFromSupabase();
      await inviteAPI.accept(tripId, inviteId);
      setInvites((prev) => prev.filter((i) => {
        const { inviteId: id } = getInviteIds(i);
        return id !== inviteId;
      }));
    } catch (err) {
      console.error("Failed to accept invite:", err);
    }
  }, [getInviteIds]);

  // Decline an invite: POST /trips/{tripId}/invites/{inviteId}/decline
  const handleDeclineInvite = useCallback(async (inv) => {
    const { inviteId, tripId } = getInviteIds(inv);
    if (!inviteId || !tripId) {
      console.error("Missing invite or trip id for decline", inv);
      return;
    }
    try {
      await setAuthFromSupabase();
      await inviteAPI.decline(tripId, inviteId);
      setInvites((prev) => prev.filter((i) => {
        const { inviteId: id } = getInviteIds(i);
        return id !== inviteId;
      }));
    } catch (err) {
      console.error("Failed to decline invite:", err);
    }
  }, [getInviteIds]);

  // Create trip handler
  const handleCreateTrip = useCallback(async () => {
    if (!createTripName.trim()) {
      setCreateTripError('Trip name is required');
      return;
    }

    setCreateTripLoading(true);
    setCreateTripError('');

    try {
      await setAuthFromSupabase();
      const newTrip = await tripsApi.create(createTripName, createTripDescription); // Pass description here

      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500'];
      const transformedTrip = {
        id: newTrip.TripID,
        name: newTrip.Description,
        memberCount: 1,
        members: [],
        balance: 0,
        accent: colors[groups.length % colors.length],
      };

      setGroups(prev => [...prev, transformedTrip]);
      setShowCreateTrip(false);
      setCreateTripName('');
      setCreateTripDescription('');
    } catch (err) {
      setCreateTripError(err.message || 'Failed to create trip');
      console.error('Error creating trip:', err);
    } finally {
      setCreateTripLoading(false);
    }
  }, [createTripName, createTripDescription, groups.length]);

  // Fetch trips + invites
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // Fetch trips from backend
        const trips = await tripsApi.list(1);

        // Fetch people count and owed amounts for each trip
        const tripsWithData = await Promise.all(
          trips.map(async (trip) => {
            // start both requests in parallel, preserve previous error handling/fallbacks
            const peoplePromise = tripsApi.peopleCount(trip.TripID).catch((err) => {
              console.error(`Error fetching people for trip ${trip.TripID}:`, err);
              return [];
            });

            const owedPromise = owedApi.get(trip.TripID).catch((err) => {
              console.error(`Error fetching owed for trip ${trip.TripID}:`, err);
              return { owed: 0 };
            });

            const [people, owedRes] = await Promise.all([peoplePromise, owedPromise]);
            const owed = owedRes?.owed ?? 0;

            return { ...trip, people, owed };
          })
        );

        // Transform backend data to frontend format
        const transformedGroups = tripsWithData.map((trip, index) => {
          // Use fetched people data or fallback to trip.People
          const peopleList = trip.people && trip.people.length > 0 ? trip.people : (trip.People || []);

          const memberInitials = peopleList.map(person => {
            const names = (person.name || person.Name).split(' ');
            return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
          });

          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500'];

          return {
            id: trip.TripID,
            name: trip.Description,
            memberCount: peopleList.length,
            members: memberInitials,
            balance: (trip.owed / 100) || 0,
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
      const userId = session?.user?.user_metadata?.sub || session?.user?.id;

      if (!userId) {
        console.error("No user ID found in session");
        setError("Authentication error");
        setLoading(false);
        return;
      }

      setAuthFromSupabase().then(() => {
        fetchTrips();
        (async () => {
          try {
            const fetchedInvites = await inviteAPI.get();
            setInvites(fetchedInvites);
          } catch (err) {
            console.error("Error fetching invites:", err);
          }})();
      })
    }
  }, [session]);

  return {
    groups,
    loading,
    error,
    invites,
    showCreateTrip,
    createTripName,
    setCreateTripName,
    createTripDescription,
    setCreateTripDescription,
    createTripLoading,
    createTripError,
    setShowCreateTrip,
    handleCreateTrip,
    handleAcceptInvite,
    handleDeclineInvite,
    setInvites,
  };
}

export default function Dashboard({ session, onSignOut }) {
  // selectedGroup stays in component to control view switching
  const [selectedGroup, setSelectedGroup] = useState(() => {
    // Restore selected group from localStorage on mount
    const saved = localStorage.getItem('selectedGroupId');
    return saved ? { id: parseInt(saved), name: localStorage.getItem('selectedGroupName') } : null;
  });

  // Use new hook to manage dashboard data + actions
  const {
    groups,
    loading,
    error,
    invites,
    showCreateTrip,
    createTripName,
    setCreateTripName,
    createTripDescription,
    setCreateTripDescription,
    createTripLoading,
    createTripError,
    setShowCreateTrip,
    handleCreateTrip,
    handleAcceptInvite,
    handleDeclineInvite,
  } = useDashboard(session);

  // Mock numbers - TODO: Calculate from real data
  const summary = {
    total: -67.7,
    owedToYou: 57.8,
    youOwe: 125.5,
  };

  // If a group is selected, show the detail view
  if (selectedGroup) {
    return (
      <GroupDetail
        groupId={selectedGroup.id}
        groupName={selectedGroup.name}
        onBack={() => {
          localStorage.removeItem('selectedGroupId');
          localStorage.removeItem('selectedGroupName');
          setSelectedGroup(null);
        }}
      />
    );
  }

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
        <InvitePanel invites={invites} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />
        <BalanceCard summary={summary} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Splitwise-like layout */}
        <div className="mt-8 flex flex-col items-center gap-6">
          {/* Main content - centered */}
          <div className="w-full max-w-4xl space-y-6">
            <GroupsSection
              groups={groups}
              onNewGroup={() => setShowCreateTrip(true)}
              onOpenGroup={(group) => {
                localStorage.setItem('selectedGroupId', group.id);
                localStorage.setItem('selectedGroupName', group.name);
                setSelectedGroup(group);
              }}
            />

            {groups.length === 0 && !loading && !error && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
                <button
                  onClick={() => alert("Create group")}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
        <InvitePanel invites={invites} />
                </button>
              </div>
            )}
          </div>

          {/* Invites panel - centered below groups */}
          <div className="w-full max-w-4xl">
            <InvitePanel invites={invites} />
          </div>
        </div>
      </main>

      {showCreateTrip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Create New Trip
              </h2>
              <p className="text-gray-600 text-sm mt-1">Start a new adventure with your friends</p>
            </div>

            {/* Error Message */}
            {createTripError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <span className="text-lg mt-0.5">⚠️</span>
                <span>{createTripError}</span>
              </div>
            )}

            {/* Trip Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Weekend Trip, Bali 2024"
                value={createTripName}
                onChange={(e) => setCreateTripName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTrip()}
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="e.g., A weekend getaway to Bali with friends (optional)"
                value={createTripDescription}
                onChange={(e) => setCreateTripDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 placeholder-gray-500 resize-none"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - add details about your trip</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateTrip(false);
                  setCreateTripName('');
                  setCreateTripDescription('');
                  setCreateTripError('');
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrip}
                disabled={createTripLoading || !createTripName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {createTripLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating...
                  </span>
                ) : (
                  'Create Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
