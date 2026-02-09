import { useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { createJD } from '../services/api';

export default function JobInput({ onDone }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!title.trim() || !text.trim()) {
      setErr('Need a title and the job description text');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const res = await createJD({
        title: title.trim(),
        raw_text: text.trim(),
        company: company.trim() || null,
        url: url.trim() || null,
      });
      onDone?.(res);
      setTitle('');
      setCompany('');
      setText('');
      setUrl('');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Something went wrong saving that');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-800">Add Job Description</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Job Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <input
          type="url"
          placeholder="Job URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <textarea
          placeholder="Paste the full job description here *"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
        />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-primary-600 text-white rounded-lg py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving...' : 'Save Job Description'}
        </button>
      </div>
    </div>
  );
}