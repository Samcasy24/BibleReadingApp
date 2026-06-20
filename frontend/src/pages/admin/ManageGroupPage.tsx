import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ReadingPlan, Profile } from '../../types';

export default function ManageGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const isEdit = !!groupId;
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState('');
  const [maxMembers, setMaxMembers] = useState(50);

  // Data
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Member search
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, [groupId]);

  async function loadData() {
    setLoading(true);

    const [{ data: planData }, { data: userData }] = await Promise.all([
      supabase.from('reading_plans').select('*').order('name'),
      supabase.from('profiles').select('*').order('username'),
    ]);
    setPlans(planData ?? []);
    setAllUsers(userData ?? []);

    if (isEdit && groupId) {
      const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (groupData) {
        setName(groupData.name);
        setDescription(groupData.description ?? '');
        setPlanId(groupData.plan_id ?? '');
        setMaxMembers(groupData.max_members);
      }

      const { data: memberData } = await supabase
        .from('group_memberships')
        .select('profiles(*)')
        .eq('group_id', groupId);
      const memberProfiles = memberData?.map((m: any) =>
        Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      ).filter(Boolean) as Profile[];
      setMembers(memberProfiles ?? []);
    }

    setLoading(false);
  }

  async function saveGroup(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');

    if (isEdit) {
      const { error } = await supabase.from('groups').update({
        name: name.trim(),
        description: description.trim(),
        plan_id: planId || null,
        max_members: maxMembers,
      }).eq('id', groupId!);
      setSaving(false);
      if (error) { setError(error.message); return; }
      setSuccessMsg('Group updated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      const { data, error } = await supabase.from('groups').insert({
        name: name.trim(),
        description: description.trim(),
        plan_id: planId || null,
        max_members: maxMembers,
        is_archived: false,
      }).select().single();
      setSaving(false);
      if (error || !data) { setError(error?.message ?? 'Failed to create group.'); return; }
      // Navigate to edit page so members can be added immediately
      navigate(`/admin/groups/${data.id}/edit`, { replace: true });
    }
  }

  async function addMember(user: Profile) {
    if (!groupId) return;
    setError('');
    const { error } = await supabase.from('group_memberships').insert({
      group_id: groupId,
      user_id: user.id,
    });
    if (error) { setError(error.message); return; }
    setMembers(prev => [...prev, user]);
  }

  async function removeMember(userId: string) {
    if (!groupId) return;
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) { setError(error.message); return; }
    setMembers(prev => prev.filter(m => m.id !== userId));
  }

  const memberIds = new Set(members.map(m => m.id));
  const nonMembers = allUsers.filter(u =>
    !memberIds.has(u.id) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-gray-600 text-sm">← Back to Admin</button>
        <h1 className="text-2xl font-bold text-green-800">{isEdit ? 'Edit Group' : 'New Group'}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{successMsg}</div>
      )}

      {/* ── Group details form ── */}
      <form onSubmit={saveGroup} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Group Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Morning Bible Study"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Reading Plan</label>
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">— None —</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Max Members</label>
            <input
              type="number"
              min={2}
              max={500}
              value={maxMembers}
              onChange={e => setMaxMembers(parseInt(e.target.value) || 50)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Group & Add Members →'}
        </button>
      </form>

      {/* ── Member management (only shown after group exists) ── */}
      {isEdit && (
        <div className="space-y-4">
          {/* Current members */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Current Members ({members.length})</h2>
              <span className="text-xs text-gray-400">Max: {maxMembers}</span>
            </div>
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm">No members yet. Add some below.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.username}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add members */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
            <h2 className="font-semibold text-gray-700">Add Members</h2>
            <input
              type="text"
              placeholder="Search by username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {nonMembers.length === 0 ? (
              <p className="text-gray-400 text-sm">{search ? 'No users match your search.' : 'All registered users are already in this group.'}</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {nonMembers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.username}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <button
                      onClick={() => addMember(u)}
                      disabled={members.length >= maxMembers}
                      className="text-xs bg-green-50 hover:bg-green-100 disabled:opacity-40 text-green-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
