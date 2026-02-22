import { useState, useEffect } from 'react';
import { Briefcase, Trash2, Loader2, Sparkles, Plus } from 'lucide-react';

const styles = `
  .ji-wrap { display: flex; flex-direction: column; gap: 12px; }

  .ji-card {
    background: rgba(13,17,23,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ji-textarea {
    width: 100%;
    height: 110px;
    padding: 10px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    color: #f0f4ff;
    background: rgba(8,12,20,0.6);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    resize: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    line-height: 1.55;
  }
  .ji-textarea::placeholder { color: #4a5568; }
  .ji-textarea:focus {
    outline: none;
    border-color: rgba(79,142,255,0.35);
    box-shadow: 0 0 0 3px rgba(79,142,255,0.08);
  }

  .ji-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .ji-input-wrap { position: relative; }
  .ji-input {
    width: 100%;
    padding: 8px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    color: #f0f4ff;
    background: rgba(8,12,20,0.6);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    transition: border-color 0.15s;
  }
  .ji-input::placeholder { color: #4a5568; }
  .ji-input:focus {
    outline: none;
    border-color: rgba(79,142,255,0.35);
    box-shadow: 0 0 0 3px rgba(79,142,255,0.08);
  }
  .ji-input-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #4f8eff;
  }

  .ji-submit {
    width: 100%;
    padding: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    background: #4f8eff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: all 0.15s;
    box-shadow: 0 0 0 1px rgba(79,142,255,0.4), 0 4px 12px rgba(79,142,255,0.15);
  }
  .ji-submit:hover:not(:disabled) {
    background: #6ba3ff;
    transform: translateY(-1px);
  }
  .ji-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .ji-list {
    background: rgba(13,17,23,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    overflow: hidden;
  }
  .ji-list-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ji-list-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4a5568; }
  .ji-list-count {
    font-size: 11px;
    font-weight: 500;
    color: #4f8eff;
    background: rgba(79,142,255,0.1);
    border: 1px solid rgba(79,142,255,0.2);
    padding: 1px 8px;
    border-radius: 20px;
  }
  .ji-list-body { max-height: 220px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  .ji-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
  }
  .ji-item:last-child { border-bottom: none; }
  .ji-item:hover { background: rgba(255,255,255,0.02); }
  .ji-item-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .ji-item-icon {
    width: 30px; height: 30px;
    border-radius: 7px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    color: #4a5568;
    flex-shrink: 0;
  }
  .ji-item-name { font-size: 12.5px; font-weight: 500; color: #f0f4ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ji-item-date { font-size: 11px; color: #4a5568; margin-top: 1px; }
  .ji-delete-btn {
    padding: 5px;
    color: #4a5568;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .ji-delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

  .extracting-pulse { animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function JobInput({ onDone }) {
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/jobs/');
      const data = await resp.json();
      setJobs(data);
    } catch (err) { console.error('Failed to load jobs:', err); }
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
      basicExtract(text);
    } finally { setExtracting(false); }
  };

  const basicExtract = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const firstLine = lines[0]?.trim() || '';
    const extractedTitle = firstLine.length < 100 ? firstLine : '';
    const companyMatch = text.match(/(?:at|@)\s+([A-Z][A-Za-z\s&,.]{2,40})(?:\n|,|·)/);
    const extractedCompany = companyMatch ? companyMatch[1].trim() : '';
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    setTitle(extractedTitle);
    setCompany(extractedCompany);
    setUrl(urlMatch ? urlMatch[1] : '');
  };

  const handlePaste = (e) => {
    const pastedText = e.target.value;
    setRawText(pastedText);
    if (pastedText.length > 100) smartExtract(pastedText);
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
      setRawText(''); setTitle(''); setCompany(''); setUrl('');
      loadJobs();
    } catch (err) { console.error('Submit failed:', err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job description?')) return;
    try {
      await fetch(`http://localhost:8000/api/jobs/${id}`, { method: 'DELETE' });
      setJobs(jobs.filter(j => j.id !== id));
    } catch (err) { console.error('Delete failed:', err); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ji-wrap">
        <div className="ji-card">
          <textarea
            className="ji-textarea"
            value={rawText}
            onChange={handlePaste}
            placeholder="Paste job description from LinkedIn or any job site..."
          />

          <div className="ji-fields">
            <div className="ji-input-wrap">
              <input
                className="ji-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Job title"
                style={{ paddingRight: extracting ? '32px' : '12px' }}
              />
              {extracting && (
                <span className="ji-input-icon extracting-pulse">
                  <Sparkles size={13} />
                </span>
              )}
            </div>
            <input
              className="ji-input"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company"
            />
          </div>

          <input
            className="ji-input"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Job URL"
          />

          <button
            className="ji-submit"
            onClick={handleSubmit}
            disabled={!rawText.trim() || loading}
          >
            {loading
              ? <><Loader2 size={14} className="spin" /> Processing...</>
              : <><Plus size={14} /> Add Job Description</>
            }
          </button>
        </div>

        {jobs.length > 0 && (
          <div className="ji-list">
            <div className="ji-list-header">
              <span className="ji-list-title">Saved Jobs</span>
              <span className="ji-list-count">{jobs.length}</span>
            </div>
            <div className="ji-list-body">
              {jobs.map(job => (
                <div key={job.id} className="ji-item">
                  <div className="ji-item-left">
                    <div className="ji-item-icon"><Briefcase size={13} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="ji-item-name">{job.company} — {job.title}</div>
                      <div className="ji-item-date">{new Date(job.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button className="ji-delete-btn" onClick={() => handleDelete(job.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}