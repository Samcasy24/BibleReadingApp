import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { PlanEntry, ReadingLog } from '../../types';
import { format, parseISO } from 'date-fns';
import { bibleUrl } from '../../lib/bibleUrl';

export default function TodayReadingPage() {
  const { profile } = useAuth();
  const [entry, setEntry] = useState<PlanEntry | null>(null);
  const [log, setLog] = useState<ReadingLog | null>(null);
  const [note, setNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const { data: entryData } = await supabase
        .from('plan_entries')
        .select('*')
        .eq('scheduled_date', today)
        .limit(1)
        .maybeSingle();
      setEntry(entryData ?? null);

      if (entryData) {
        const { data: logData } = await supabase
          .from('reading_logs')
          .select('*')
          .eq('user_id', profile!.id)
          .eq('plan_entry_id', entryData.id)
          .maybeSingle();
        if (logData) {
          setLog(logData);
          setNote(logData.note ?? '');
          setIsPrivate(logData.is_private);
        }
      }
      setLoading(false);
    }
    load();
  }, [profile, today]);

  async function markAs(status: 'complete' | 'skipped') {
    if (!profile || !entry) return;
    setSaving(true);
    setMessage('');

    const payload = {
      user_id: profile.id,
      plan_entry_id: entry.id,
      status,
      note: note.slice(0, 500) || null,
      is_private: isPrivate,
      logged_at: new Date().toISOString(),
    };

    const { data, error } = log
      ? await supabase.from('reading_logs').update(payload).eq('id', log.id).select().single()
      : await supabase.from('reading_logs').insert(payload).select().single();

    setSaving(false);
    if (error) { setMessage('Error saving. Please try again.'); return; }
    setLog(data);
    setMessage(status === 'complete' ? 'Marked as complete!' : 'Marked as skipped.');
  }

  function formatReference(e: PlanEntry) {
    const start = e.verse_start ? `${e.chapter_start}:${e.verse_start}` : `${e.chapter_start}`;
    const end = e.verse_end ? `${e.chapter_end}:${e.verse_end}` : `${e.chapter_end}`;
    return start === end ? `${e.book} ${start}` : `${e.book} ${start} - ${end}`;
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Today's Reading</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {!entry ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No reading scheduled for today.
        </div>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-xs uppercase tracking-wider text-green-600 font-semibold mb-2">Recovery Version</p>
            <h2 className="text-2xl font-bold text-green-900">{formatReference(entry)}</h2>
            <p className="text-sm text-gray-500 mt-2">Scheduled: {format(parseISO(entry.scheduled_date), 'MMMM d, yyyy')}</p>
            <a
              href={bibleUrl(entry.book, entry.chapter_start)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-green-700 font-medium hover:underline"
            >
              Read {formatReference(entry)} online
            </a>
            {log && (
              <span className={`block mt-3 w-fit px-3 py-1 rounded-full text-xs font-medium ${log.status === 'complete' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                {log.status === 'complete' ? 'Completed' : 'Skipped'}
              </span>
            )}
          </div>

          {!log && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enjoyment &amp; Enlightenment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 500))}
                maxLength={500}
                rows={4}
                placeholder="Share your enjoyment in brief with other saints..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="accent-green-700"
                  />
                  Keep note private
                </label>
                <span className="text-xs text-gray-400">{note.length}/500</span>
              </div>
            </div>
          )}

          {message && <p className="text-sm font-medium text-green-700">{message}</p>}

          {!log && (
            <div className="flex gap-3">
              <button
                onClick={() => markAs('complete')}
                disabled={saving}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Mark as Complete'}
              </button>
              <button
                onClick={() => markAs('skipped')}
                disabled={saving}
                className="px-5 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}