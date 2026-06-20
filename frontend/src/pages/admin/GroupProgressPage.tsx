import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Group, ReadingPlan, PlanEntry } from '../../types';

interface MemberProgress {
  userId: string;
  username: string;
  completed: number;
  skipped: number;
  missed: number;
}

export default function GroupProgressPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [progress, setProgress] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    async function load() {
      const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId!).single();
      setGroup(groupData ?? null);

      if (groupData?.plan_id) {
        const [{ data: planData }, { data: entryData }] = await Promise.all([
          supabase.from('reading_plans').select('*').eq('id', groupData.plan_id).single(),
          supabase.from('plan_entries').select('*').eq('plan_id', groupData.plan_id),
        ]);
        setPlan(planData ?? null);
        setEntries(entryData ?? []);
      }

      const { data: members } = await supabase
        .from('group_memberships')
        .select('user_id, profiles(id, username)')
        .eq('group_id', groupId!);

      const rows: MemberProgress[] = [];
      for (const m of members ?? []) {
        const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as { id: string; username: string } | null;
        const { data: logs } = await supabase
          .from('reading_logs')
          .select('status, plan_entry_id')
          .eq('user_id', m.user_id);

        type LogRow = { status: string; plan_entry_id: string };
        const completed = (logs as LogRow[] | null)?.filter(l => l.status === 'complete').length ?? 0;
        const skipped = (logs as LogRow[] | null)?.filter(l => l.status === 'skipped').length ?? 0;

        rows.push({
          userId: m.user_id,
          username: p?.username ?? 'Unknown',
          completed,
          skipped,
          missed: 0,
        });
      }

      rows.sort((a, b) => b.completed - a.completed);
      setProgress(rows);
      setLoading(false);
    }
    load();
  }, [groupId]);

  const total = entries.length;

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!group) return <p className="text-red-500">Group not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Group Progress</h1>
        <p className="text-gray-500 text-sm mt-1">{group.name}</p>
        {plan && <p className="text-xs text-gray-400 mt-0.5">Plan: {plan.name} · {total} readings</p>}
      </div>

      {progress.length === 0 ? (
        <p className="text-gray-400 text-sm">No members in this group yet.</p>
      ) : (
        <div className="space-y-3">
          {progress.map((m, i) => {
            const pct = total ? Math.round((m.completed / total) * 100) : 0;
            return (
              <div key={m.userId} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">{m.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">{pct}%</p>
                    <p className="text-xs text-gray-400">{m.completed}/{total} complete</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>✅ {m.completed} complete</span>
                  <span>⏭ {m.skipped} skipped</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
