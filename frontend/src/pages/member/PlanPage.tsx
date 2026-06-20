import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { PlanEntry, ReadingLog, ReadingPlan } from '../../types';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';

export default function PlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const { profile } = useAuth();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [logs, setLogs] = useState<Record<string, ReadingLog>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId || !profile) return;
    async function load() {
      const [{ data: planData }, { data: entryData }] = await Promise.all([
        supabase.from('reading_plans').select('*').eq('id', planId!).single(),
        supabase.from('plan_entries').select('*').eq('plan_id', planId!).order('scheduled_date'),
      ]);
      setPlan(planData ?? null);
      setEntries(entryData ?? []);

      if (entryData?.length) {
        const entryIds = entryData.map((e: PlanEntry) => e.id);
        const { data: logData } = await supabase
          .from('reading_logs')
          .select('*')
          .eq('user_id', profile!.id)
          .in('plan_entry_id', entryIds);
        const logMap: Record<string, ReadingLog> = {};
        logData?.forEach((l: ReadingLog) => { logMap[l.plan_entry_id] = l; });
        setLogs(logMap);
      }
      setLoading(false);
    }
    load();
  }, [planId, profile]);

  function statusColor(entry: PlanEntry) {
    const log = logs[entry.id];
    if (log?.status === 'complete') return 'border-green-400 bg-green-50';
    if (log?.status === 'skipped') return 'border-gray-300 bg-gray-50';
    const d = parseISO(entry.scheduled_date);
    if (isToday(d)) return 'border-yellow-400 bg-yellow-50';
    if (isPast(d)) return 'border-red-200 bg-red-50';
    return 'border-gray-200 bg-white';
  }

  function formatRef(e: PlanEntry) {
    const start = e.verse_start ? `${e.chapter_start}:${e.verse_start}` : `${e.chapter_start}`;
    const end = e.verse_end ? `${e.chapter_end}:${e.verse_end}` : `${e.chapter_end}`;
    return start === end ? `${e.book} ${start}` : `${e.book} ${start} – ${end}`;
  }

  const completed = entries.filter(e => logs[e.id]?.status === 'complete').length;
  const pct = entries.length ? Math.round((completed / entries.length) * 100) : 0;

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!plan) return <p className="text-red-500">Plan not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-800">{plan.name}</h1>
        {plan.description && <p className="text-gray-500 text-sm mt-1">{plan.description}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {format(parseISO(plan.start_date), 'MMM d, yyyy')} – {format(parseISO(plan.end_date), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span className="font-semibold">{completed}/{entries.length} ({pct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Entry list */}
      <div className="space-y-2">
        {entries.map(entry => {
          const log = logs[entry.id];
          const d = parseISO(entry.scheduled_date);
          return (
            <div key={entry.id} className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${statusColor(entry)}`}>
              <div>
                <p className="font-medium text-gray-800">{formatRef(entry)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(d, 'EEE, MMM d')}</p>
                {log?.enjoyment && !log.is_private && (
                  <p className="text-xs text-gray-500 mt-2 italic">"{log.enjoyment}"</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-medium">
                {log?.status === 'complete' && <span className="text-green-700">✅</span>}
                {log?.status === 'skipped' && <span className="text-gray-500">⏭</span>}
                {!log && isToday(d) && <span className="text-yellow-600">Today</span>}
                {!log && isPast(d) && !isToday(d) && <span className="text-red-400">Missed</span>}
                {!log && isFuture(d) && <span className="text-gray-300">—</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
