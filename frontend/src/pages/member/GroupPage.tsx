import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Group, ReadingPlan, Profile } from '../../types';
import ProgressBar from '../../components/ProgressBar';

interface MemberRow { id: string; username: string; completed: number; skipped: number; latestEnjoyment: string | null; }

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

      const { data: mData } = await supabase
        .from('group_memberships').select('user_id, profiles(*)').eq('group_id', groupId!);

      const rows: MemberRow[] = [];
      for (const m of mData ?? []) {
        const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as Profile | null;
        const { data: logs } = await supabase.from('reading_logs').select('status, enjoyment, is_private').eq('user_id', m.user_id);
        const logList = (logs ?? []) as { status: string; enjoyment: string | null; is_private: boolean }[];
        const completed = logList.filter(l => l.status === 'complete').length;
        const skipped = logList.filter(l => l.status === 'skipped').length;
        const latestWithNote = logList.find(l => l.enjoyment && !l.is_private);
        rows.push({ id: m.user_id, username: p?.username ?? 'Unknown', completed, skipped, latestEnjoyment: latestWithNote?.enjoyment ?? null });
      }
      rows.sort((a, b) => b.completed - a.completed);
      setMembers(rows);
      setLoading(false);
    }
    load();
  }, [groupId]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!group) return <p className="text-red-500">Group not found.</p>;

  const myRow = members.find(m => m.id === profile?.id);
  const myPct = totalEntries && myRow ? Math.round((myRow.completed / totalEntries) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
          {group.description && <p className="text-slate-500 text-sm mt-0.5">{group.description}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {plan && (
            <Link to={`/plan/${plan.id}`} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              View Plan
            </Link>
          )}
          {isAdmin && (
            <Link to={`/group/${group.id}/progress`} className="text-sm bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg transition-colors">
              Full Report
            </Link>
          )}
        </div>
      </div>

      {/* My progress card */}
      {myRow && totalEntries > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-800">My Progress</p>
              {plan && <p className="text-xs text-slate-400 mt-0.5">{plan.name}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">{myPct}%</p>
              <p className="text-xs text-slate-400">{myRow.completed} of {totalEntries}</p>
            </div>
          </div>
          <ProgressBar value={myPct} height="h-3" />
        </div>
      )}

      {/* Team progress */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Team ({members.length} members)</h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {members.map((m, i) => {
            const pct = totalEntries ? Math.round((m.completed / totalEntries) * 100) : 0;
            const isMe = m.id === profile?.id;
            return (
              <div key={m.id} className={`px-5 py-4 ${isMe ? 'bg-green-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-800 text-sm">
                      {m.username}
                      {isMe && <span className="ml-1.5 text-xs text-green-600 font-normal">(you)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{m.completed}/{totalEntries}</span>
                    <span className="font-semibold text-slate-700 w-9 text-right">{pct}%</span>
                  </div>
                </div>
                <ProgressBar
                  value={pct}
                  height="h-2"
                  color={isMe ? 'bg-green-500' : 'bg-slate-400'}
                />
                {m.latestEnjoyment && (
                  <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">"{m.latestEnjoyment}"</p>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="px-5 py-8 text-center text-slate-400 text-sm">No members yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
