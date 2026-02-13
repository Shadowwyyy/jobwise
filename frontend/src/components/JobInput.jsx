import { useState, useEffect } from 'react';
import { Briefcase, Trash2, Loader2, Sparkles } from 'lucide-react';

export default function JobInput({ onDone }) {
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/jobs/');
      const data = await resp.json();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const smartExtract = async (text) => {
    setExtracting(true);
    try {
      const resp = await fetch('http://localhost:8000/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      });
      const data = await resp.json();
      
      setTitle(data.title || '');
      setCompany(data.company || '');
      setUrl(data.url || '');
    } catch (err) {
      console.error('Smart extract failed:', err);
      // Fallback to basic regex
      basicExtract(text);
    } finally {
      setExtracting(false);
    }
  };

  const basicExtract = (text) => {
    // Look for first line as title
    const lines = text.split('\n').filter(l => l.trim());
    const firstLine = lines[0]?.trim() || '';
    
    // Title is usually the first non-URL line
    let extractedTitle = firstLine.length < 100 ? firstLine : '';
    
    // Company - look for common patterns
    const companyMatch = text.match(/(?:at|@)\s+([A-Z][A-Za-z\s&,.]{2,40})(?:\n|,|·)/);
    const extractedCompany = companyMatch ? companyMatch[1].trim() : '';
    
    // URL - any https link
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    const extractedUrl = urlMatch ? urlMatch[1] : '';

    setTitle(extractedTitle);
    setCompany(extractedCompany);
    setUrl(extractedUrl);
  };

const handlePaste = (e) => {
  const pastedText = e.target.value;
  setRawText(pastedText);
  
  console.log('Pasted text length:', pastedText.length);
  
  if (pastedText.length > 100) {
    console.log('Calling smartExtract...');
    smartExtract(pastedText);
  }
};

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/api/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Position',
          company: company || 'Unknown Company',
          url: url || '',
          raw_text: rawText,
        }),
      });
      
      const data = await resp.json();
      onDone(data);
      setRawText('');
      setTitle('');
      setCompany('');
      setUrl('');
      loadJobs();
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job description?')) return;

    try {
      await fetch(`http://localhost:8000/api/jobs/${id}`, {
        method: 'DELETE',
      });
      setJobs(jobs.filter(j => j.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <textarea
          value={rawText}
          onChange={handlePaste}
          placeholder="Paste job description from LinkedIn or any job site..."
          className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Auto-extracted fields */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm pr-8"
            />
            {extracting && (
              <Sparkles className="absolute right-2 top-2.5 w-4 h-4 text-blue-500 animate-pulse" />
            )}
          </div>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
          />
        </div>
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Job URL"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm mt-3"
        />

        <button
          onClick={handleSubmit}
          disabled={!rawText.trim() || loading}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Add Job Description'
          )}
        </button>
      </div>

      {/* Saved jobs list */}
      {jobs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Saved Jobs ({jobs.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {job.company} - {job.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}