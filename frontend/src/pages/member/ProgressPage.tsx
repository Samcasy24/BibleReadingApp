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
    return start === end ? `${e.book} ${start}` : `${e.book} ${start} â€“ ${end}`;
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Progress</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{complete}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-400">{skipped}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Skipped</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-amber-500">{streak}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Day Streak</p>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Reading History</h2>
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            No readings logged yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-base ${log.status === 'complete' ? 'text-green-500' : 'text-slate-300'}`}>
                    {log.status === 'complete' ? 'âœ“' : 'â€“'}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{formatRef(log.plan_entry)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(log.logged_at), 'MMM d, yyyy')}</p>
                    {log.enjoyment && !log.is_private && (
                      <p className="text-xs text-slate-500 mt-1.5 italic leading-relaxed">"{log.enjoyment}"</p>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  log.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function calcStreak(logs: LogWithEntry[]): number {
  const completedDates = new Set(
    logs.filter(l => l.status === 'complete').map(l => l.plan_entry?.scheduled_date).filter(Boolean)
  );
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!completedDates.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
