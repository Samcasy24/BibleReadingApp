import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Group, ReadingPlan } from '../../types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [plans, setPlans] = useState<Record<string, ReadingPlan>>({});
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      // Fetch groups the user belongs to
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('group_id, groups(*)')
        .eq('user_id', profile!.id);

      const userGroups: Group[] = memberships?.map((m: any) => m.groups).filter(Boolean) ?? [];
      setGroups(userGroups);

      // Fetch plans for those groups
      const planIds = [...new Set(userGroups.map(g => g.plan_id).filter(Boolean))] as string[];
      if (planIds.length) {
        const { data: planData } = await supabase.from('reading_plans').select('*').in('id', planIds);
        const planMap: Record<string, ReadingPlan> = {};
        planData?.forEach((p: ReadingPlan) => { planMap[p.id] = p; });
        setPlans(planMap);
      }

      // Check if today's reading is complete
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayEntry } = await supabase
        .from('plan_entries')
        .select('id')
        .eq('scheduled_date', today)
        .limit(1)
        .maybeSingle();

      if (todayEntry) {
        const { data: log } = await supabase
          .from('reading_logs')
          .select('id')
          .eq('user_id', profile!.id)
          .eq('plan_entry_id', todayEntry.id)
          .eq('status', 'complete')
          .maybeSingle();
        setCompletedToday(!!log);
      }

      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Welcome, {profile?.username} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Today's status banner */}
      <div className={`rounded-xl p-5 flex items-center justify-between ${completedToday ? 'bg-green-100 border border-green-300' : 'bg-yellow-50 border border-yellow-300'}`}>
        <div>
          <p className="font-semibold text-lg">{completedToday ? "✅ Today's reading complete!" : "📖 Today's reading is waiting"}</p>
          <p className="text-sm text-gray-600 mt-1">{completedToday ? "Great job keeping up!" : "Don't forget to read and mark it complete."}</p>
        </div>
        {!completedToday && (
          <Link to="/reading/today" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Read Now
          </Link>
        )}
      </div>

      {/* Groups */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">My Groups</h2>
        {groups.length === 0 ? (
          <p className="text-gray-400 text-sm">You haven't been added to any group yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(group => (
              <Link
                key={group.id}
                to={`/group/${group.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-green-800">{group.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                {group.plan_id && plans[group.plan_id] && (
                  <p className="text-xs text-gray-400 mt-3">Plan: {plans[group.plan_id].name}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/reading/today', label: "Today's Reading", icon: '📅' },
          { to: '/progress', label: 'My Progress', icon: '📊' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
