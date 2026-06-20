import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Group, ReadingPlan, Profile } from "../../types";

export default function AdminPage() {
  const [tab, setTab] = useState<"groups" | "plans" | "users">("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: g }, { data: p }, { data: u }] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("reading_plans").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setGroups(g ?? []);
    setPlans(p ?? []);
    setUsers(u ?? []);
    setLoading(false);
  }

  async function archiveGroup(id: string) {
    await supabase.from("groups").update({ is_archived: true }).eq("id", id);
    loadAll();
  }

  async function deleteGroup(id: string, name: string) {
    if (!window.confirm(`Permanently delete "${name}"? This removes all memberships and cannot be undone.`)) return;
    await supabase.from("groups").delete().eq("id", id);
    loadAll();
  }

  async function deletePlan(id: string, name: string) {
    if (!window.confirm(`Permanently delete plan "${name}"? This also deletes all reading entries and logs tied to it.`)) return;
    await supabase.from("reading_plans").delete().eq("id", id);
    loadAll();
  }

  async function deleteUser(id: string, username: string) {
    if (!window.confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return;
    await supabase.from("profiles").delete().eq("id", id);
    loadAll();
  }

  async function changeRole(userId: string, role: "admin" | "member") {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    loadAll();
  }

  function copyRegisterLink() {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const registrationUrl = `${window.location.origin}/register`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-800">Admin Panel</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {(["groups", "plans", "users"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-green-700 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t}{t === "users" && ` (${users.length})`}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Groups ({groups.filter(g => !g.is_archived).length} active)</h2>
            <Link to="/admin/groups/new" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + New Group
            </Link>
          </div>
          {groups.length === 0 && <p className="text-gray-400 text-sm">No groups yet.</p>}
          <div className="space-y-2">
            {groups.map(g => (
              <div key={g.id} className={`bg-white border rounded-xl p-4 ${g.is_archived ? "opacity-50 border-gray-200" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/group/${g.id}`} className="font-medium text-green-800 hover:underline">{g.name}</Link>
                      {g.is_archived && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">archived</span>}
                      {g.plan_id && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {plans.find(p => p.id === g.plan_id)?.name ?? "Plan assigned"}
                        </span>
                      )}
                    </div>
                    {g.description && <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!g.is_archived && (
                      <Link to={`/admin/groups/${g.id}/edit`} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition-colors">
                        Edit / Members
                      </Link>
                    )}
                    <Link to={`/group/${g.id}/progress`} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors">Progress</Link>
                    {!g.is_archived && (
                      <button onClick={() => archiveGroup(g.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-colors">Archive</button>
                    )}
                    <button onClick={() => deleteGroup(g.id, g.name)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Reading Plans ({plans.length})</h2>
            <Link to="/admin/plans/new" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">+ New Plan</Link>
          </div>
          {plans.length === 0 ? <p className="text-gray-400 text-sm">No plans yet.</p> : (
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.start_date} to {p.end_date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/plan/${p.id}`} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors">View</Link>
                    <button onClick={() => deletePlan(p.id, p.name)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h2 className="font-semibold text-green-800 mb-1">Invite Users</h2>
            <p className="text-sm text-gray-600 mb-3">
              Share this link with anyone you want to join. They register themselves and appear here automatically.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
                {registrationUrl}
              </code>
              <button
                onClick={copyRegisterLink}
                className="shrink-0 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
          {users.length === 0 ? (
            <p className="text-gray-400 text-sm">No registered users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as "admin" | "member")}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    {u.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(u.id, u.username)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}