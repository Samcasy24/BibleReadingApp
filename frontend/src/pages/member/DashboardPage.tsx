import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Group, ReadingPlan } from '../../types';
import { format } from 'date-fns';
import ProgressBar from '../../components/ProgressBar';

interface PlanProgress { plan: ReadingPlan; total: number; completed: number; }

export default function DashboardPage() {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [planProgress, setPlanProgress] = useState<PlanProgress[]>([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('group_id, groups(*)')
        .eq('user_id', profile!.id);

      const userGroups: Group[] = memberships?.map((m: any) => m.groups).filter(Boolean) ?? [];
      setGroups(userGroups);

      const planIds = [...new Set(userGroups.map(g => g.plan_id).filter(Boolean))] as string[];
      if (planIds.length) {
        const { data: planData } = await supabase.from('reading_plans').select('*').in('id', planIds);
        const progresses: PlanProgress[] = [];
        for (const plan of (planData ?? [])) {
          const { count: total } = await supabase
            .from('plan_entries').select('id', { count: 'exact', head: true }).eq('plan_id', plan.id);
          const { data: entryIds } = await supabase
            .from('plan_entries').select('id').eq('plan_id', plan.id);
          const ids = entryIds?.map((e: any) => e.id) ?? [];
          const { count: completed } = ids.length
            ? await supabase.from('reading_logs').select('id', { count: 'exact', head: true })
                .eq('user_id', profile!.id).eq('status', 'complete').in('plan_entry_id', ids)
            : { count: 0 };
          progresses.push({ plan, total: total ?? 0, completed: completed ?? 0 });
        }
        setPlanProgress(progresses);
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayEntry } = await supabase
        .from('plan_entries').select('id').eq('scheduled_date', today).limit(1).maybeSingle();
      if (todayEntry) {
        const { data: log } = await supabase
          .from('reading_logs').select('id')
          .eq('user_id', profile!.id).eq('plan_entry_id', todayEntry.id).eq('status', 'complete').maybeSingle();
        setCompletedToday(!!log);
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {profile?.username}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Today banner */}
      <div className={`rounded-xl p-5 flex items-center justify-between gap-4 border ${
        completedToday ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{completedToday ? 'âœ…' : 'ðŸ“–'}</span>
          <div>
            <p className="font-semibold text-slate-800">
              {completedToday ? "Today's reading done!" : "Today's reading is waiting"}
            </p>
            <p className="text-sm text-slate-500">
              {completedToday ? 'Great job staying consistent.' : 'Mark it complete after reading.'}
            </p>
          </div>
        </div>
        <Link
          to="/reading/today"
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            completedToday
              ? 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
              : 'bg-green-700 hover:bg-green-800 text-white'
          }`}
        >
          {completedToday ? 'View' : 'Read Now'}
        </Link>
      </div>

      {/* My plan progress */}
      {planProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {planProgress.map(({ plan, total, completed }) => {
            const pct = total ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={plan.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">{plan.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">My overall progress</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">{pct}%</p>
                    <p className="text-xs text-slate-400">{completed}/{total} readings</p>
                  </div>
                </div>
                <ProgressBar
                  value={pct}
                  height="h-3"
                  color={pct === 100 ? 'bg-green-500' : 'bg-green-500'}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700">My Groups</h2>
          <Link to="/progress" className="text-sm text-green-700 hover:underline font-medium">View Progress â†’</Link>
        </div>
        {groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            You haven't been added to any group yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map(group => (
              <Link
                key={group.id}
                to={`/group/${group.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-green-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors">{group.name}</h3>
                    {group.description && <p className="text-sm text-slate-500 mt-1">{group.description}</p>}
                  </div>
                  <span className="text-slate-300 group-hover:text-green-500 transition-colors text-lg">â†’</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


