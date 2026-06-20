import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Group, ReadingPlan, Profile } from '../../types';


interface MemberRow { id: string; username: string; completed: number; skipped: number; }

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile, isAdmin } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    async function load() {
      const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId!).single();
      setGroup(groupData ?? null);

      if (groupData?.plan_id) {
        const { data: planData } = await supabase.from('reading_plans').select('*').eq('id', groupData.plan_id).single();
        setPlan(planData ?? null);

        const { count } = await supabase.from('plan_entries').select('id', { count: 'exact', head: true }).eq('plan_id', groupData.plan_id);
        setTotalEntries(count ?? 0);
      }

      // Get members
      const { data: mData } = await supabase
        .from('group_memberships')
        .select('user_id, profiles(*)')
        .eq('group_id', groupId!);

      const rows: MemberRow[] = [];
      for (const m of mData ?? []) {
        const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as Profile | null;
        const { data: logs } = await supabase
          .from('reading_logs')
          .select('status')
          .eq('user_id', m.user_id);
        type LogRow = { status: string };
        const completed = (logs as LogRow[] | null)?.filter(l => l.status === 'complete').length ?? 0;
        const skipped = (logs as LogRow[] | null)?.filter(l => l.status === 'skipped').length ?? 0;
        rows.push({ id: m.user_id, username: p?.username ?? 'Unknown', completed, skipped });
      }
      setMembers(rows);
      setLoading(false);
    }
    load();
  }, [groupId]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!group) return <p className="text-red-500">Group not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-800">{group.name}</h1>
          {group.description && <p className="text-gray-500 text-sm mt-1">{group.description}</p>}
        </div>
        {isAdmin && (
          <Link to={`/group/${group.id}/progress`} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Group Progress
          </Link>
        )}
      </div>

      {plan && (
        <Link to={`/plan/${plan.id}`} className="block bg-green-50 border border-green-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Reading Plan</p>
          <p className="font-semibold text-green-900">{plan.name}</p>
          <p className="text-xs text-gray-500 mt-1">{totalEntries} total readings</p>
        </Link>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Members ({members.length})</h2>
        <div className="space-y-2">
          {members.map(m => {
            const pct = totalEntries ? Math.round((m.completed / totalEntries) * 100) : 0;
            const isMe = m.id === profile?.id;
            return (
              <div key={m.id} className={`bg-white border rounded-xl p-4 ${isMe ? 'border-green-300' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{m.username}{isMe && <span className="ml-2 text-xs text-green-600">(you)</span>}</span>
                  <span className="text-sm text-gray-500">{m.completed}/{totalEntries}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
