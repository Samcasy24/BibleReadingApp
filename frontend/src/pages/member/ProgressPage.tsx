import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { ReadingLog, PlanEntry } from '../../types';
import { format, parseISO } from 'date-fns';

interface LogWithEntry extends ReadingLog { plan_entry: PlanEntry; }

export default function ProgressPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<LogWithEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const { data } = await supabase
        .from('reading_logs')
        .select('*, plan_entry:plan_entries(*)')
        .eq('user_id', profile!.id)
        .order('logged_at', { ascending: false });
      setLogs((data as LogWithEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const complete = logs.filter(l => l.status === 'complete').length;
  const skipped = logs.filter(l => l.status === 'skipped').length;
  const streak = calcStreak(logs);

  function formatRef(e: PlanEntry) {
    const start = e.verse_start ? `${e.chapter_start}:${e.verse_start}` : `${e.chapter_start}`;
    const end = e.verse_end ? `${e.chapter_end}:${e.verse_end}` : `${e.chapter_end}`;
    return start === end ? `${e.book} ${start}` : `${e.book} ${start} – ${end}`;
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-800">My Progress</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completed', value: complete, color: 'text-green-700' },
          { label: 'Skipped', value: skipped, color: 'text-gray-500' },
          { label: 'Current Streak', value: `${streak}d`, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Log list */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Reading History</h2>
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm">No readings logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">{formatRef(log.plan_entry)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(log.logged_at), 'MMM d, yyyy')}</p>
                    {log.note && !log.is_private && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{log.note}"</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${log.status === 'complete' ? 'text-green-700' : 'text-gray-400'}`}>
                    {log.status === 'complete' ? '✅' : '⏭'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function calcStreak(logs: LogWithEntry[]): number {
  // Count consecutive days ending today where status === 'complete'
  const completedDates = new Set(
    logs
      .filter(l => l.status === 'complete')
      .map(l => l.plan_entry?.scheduled_date)
      .filter(Boolean)
  );
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = format(d, 'yyyy-MM-dd');
    if (!completedDates.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
