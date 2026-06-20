import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, addDays, parseISO, eachDayOfInterval } from 'date-fns';

interface EntryDraft {
  scheduled_date: string;
  book: string;
  chapter_start: string;
  verse_start: string;
  chapter_end: string;
  verse_end: string;
}

const BIBLE_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Songs',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
  'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
];

function blankEntry(date: string): EntryDraft {
  return { scheduled_date: date, book: 'Genesis', chapter_start: '1', verse_start: '', chapter_end: '1', verse_end: '' };
}

export default function CreatePlanPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Step 1 — plan details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 29), 'yyyy-MM-dd'));

  // Step 2 — entries
  const [step, setStep] = useState<1 | 2>(1);
  const [entries, setEntries] = useState<EntryDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function generateEntries() {
    if (!startDate || !endDate || endDate < startDate) {
      setError('End date must be on or after start date.');
      return;
    }
    setError('');
    const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    setEntries(dates.map(d => blankEntry(format(d, 'yyyy-MM-dd'))));
    setStep(2);
  }

  function updateEntry(idx: number, field: keyof EntryDraft, value: string) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function removeEntry(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  function addEntry() {
    const lastDate = entries.length
      ? format(addDays(parseISO(entries[entries.length - 1].scheduled_date), 1), 'yyyy-MM-dd')
      : startDate;
    setEntries(prev => [...prev, blankEntry(lastDate)]);
  }

  async function savePlan(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (entries.length === 0) { setError('Add at least one reading entry.'); return; }

    // Validate no duplicate dates
    const dates = entries.map(e => e.scheduled_date);
    if (new Set(dates).size !== dates.length) { setError('Two entries share the same date. Each day must be unique.'); return; }

    setSaving(true);
    setError('');

    const { data: plan, error: planErr } = await supabase
      .from('reading_plans')
      .insert({
        name: name.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        created_by: profile.id,
      })
      .select()
      .single();

    if (planErr || !plan) {
      setError(planErr?.message ?? 'Failed to create plan.');
      setSaving(false);
      return;
    }

    const entryRows = entries.map(e => ({
      plan_id: plan.id,
      scheduled_date: e.scheduled_date,
      book: e.book,
      chapter_start: parseInt(e.chapter_start) || 1,
      verse_start: e.verse_start ? parseInt(e.verse_start) : null,
      chapter_end: parseInt(e.chapter_end) || 1,
      verse_end: e.verse_end ? parseInt(e.verse_end) : null,
    }));

    const { error: entryErr } = await supabase.from('plan_entries').insert(entryRows);
    setSaving(false);

    if (entryErr) {
      setError(entryErr.message);
      return;
    }

    navigate('/admin');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => step === 2 ? setStep(1) : navigate('/admin')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-green-800">
          {step === 1 ? 'New Reading Plan' : `Add Readings (${entries.length} days)`}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full font-medium ${step === 1 ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}>1 Plan Details</span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full font-medium ${step === 2 ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'}`}>2 Reading Schedule</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* ── Step 1: Plan details ── */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. New Testament in 90 Days"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">A reading slot will be pre-filled for every day in the date range. You can edit or remove individual days in the next step.</p>
          <button
            onClick={generateEntries}
            disabled={!name.trim()}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Next: Set Up Readings →
          </button>
        </div>
      )}

      {/* ── Step 2: Entry table ── */}
      {step === 2 && (
        <form onSubmit={savePlan} className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr_80px_80px_80px_80px_36px] gap-2 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <span>Date</span><span>Book</span><span>Ch.Start</span><span>Vs.Start</span><span>Ch.End</span><span>Vs.End</span><span></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {entries.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-[140px_1fr_80px_80px_80px_80px_36px] gap-2 px-4 py-2 items-center">
                  <input
                    type="date"
                    value={entry.scheduled_date}
                    onChange={e => updateEntry(idx, 'scheduled_date', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 w-full"
                  />
                  <select
                    value={entry.book}
                    onChange={e => updateEntry(idx, 'book', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 w-full"
                  >
                    {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {(['chapter_start','verse_start','chapter_end','verse_end'] as const).map(field => (
                    <input
                      key={field}
                      type="number"
                      min={1}
                      value={entry[field]}
                      onChange={e => updateEntry(idx, field, e.target.value)}
                      placeholder={field.startsWith('verse') ? '—' : '1'}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 w-full"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                    title="Remove"
                  >×</button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addEntry}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            + Add another day
          </button>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-8 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : '✅ Save Plan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
