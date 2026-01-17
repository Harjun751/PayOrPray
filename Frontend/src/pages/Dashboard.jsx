import TopNav from "../components/dashboard/TopNav";
import BalanceCard from "../components/dashboard/BalanceCard";
import GroupsSection from "../components/dashboard/GroupsSection";
import QuickActions from "../components/dashboard/QuickActions";
import ActivityFeed from "../components/dashboard/ActivityFeed";

export default function Dashboard({ session, onSignOut }) {
  // Mock numbers
  const summary = {
    total: -67.7,
    owedToYou: 57.8,
    youOwe: 125.5,
  };

  // Mock groups
  const groups = [
    {
      id: 1,
      name: "Weekend Squad",
      memberCount: 4,
      members: ["YO", "SC", "MI", "AK"],
      balance: 45.5,
      accent: "bg-blue-500",
    },
    {
      id: 2,
      name: "Roommates",
      memberCount: 2,
      members: ["YO", "ED"],
      balance: -125.5,
      accent: "bg-purple-500",
    },
    {
      id: 3,
      name: "Work Lunch Crew",
      memberCount: 3,
      members: ["YO", "JL", "LW"],
      balance: 12.3,
      accent: "bg-orange-500",
    },
  ];

  // Mock activity
  const activity = [
    { id: 1, text: "You added Hotpot @ Bugis ($92.40) in Weekend Squad", time: "2h" },
    { id: 2, text: "Roommates: Pay or Pray round created", time: "1d" },
    { id: 3, text: "Alex settled up in Work Lunch Crew", time: "3d" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <TopNav
        userEmail={session?.user?.email}
        onAdd={() => alert("Open add modal")}
        onSignOut={onSignOut}
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <BalanceCard summary={summary} />

        {/* Splitwise-like layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            <GroupsSection
              groups={groups}
              onNewGroup={() => alert("Open new group modal")}
              onOpenGroup={(g) => alert(`Open group: ${g.name}`)}
            />
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
