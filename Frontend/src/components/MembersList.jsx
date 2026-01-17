export default function MembersList({ members, onInvite }) {
  return (
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
        onClick={onInvite}
        className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Invite Member
      </button>
    </div>
  );
}
