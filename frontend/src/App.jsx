import { useState, useEffect } from 'react';
import {
  FileText, PenTool, MessageSquare, Target,
  Loader2, Copy, Check, Sun, Moon, History, BarChart3, Zap
} from 'lucide-react';
import ResumeUpload from './components/ResumeUpload';
import JobInput from './components/JobInput';
import MatchResult from './components/MatchResult';
import HistoryTab from './components/HistoryTab';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { getResumes, getJDs, runMatch, runCoverLetter, runInterviewPrep } from './services/api';
import ApplicationTracker from './components/ApplicationTracker';
import ResumeTailoring from './components/ResumeTailoring';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg: #080c14;
    --bg-1: #0d1117;
    --bg-2: #111827;
    --bg-3: #1a2235;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.13);
    --text-1: #f0f4ff;
    --text-2: #8b95a8;
    --text-3: #4a5568;
    --accent: #4f8eff;
    --accent-dim: rgba(79,142,255,0.12);
    --accent-border: rgba(79,142,255,0.3);
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.1);
    --red: #ef4444;
    --font: 'DM Sans', system-ui, sans-serif;
    --mono: 'DM Mono', monospace;
  }

  .jw-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-1);
  }

  /* ── Header ── */
  .jw-header {
    background: rgba(8,12,20,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .jw-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .jw-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
  }
  .jw-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .jw-logo-icon {
    width: 34px;
    height: 34px;
    background: linear-gradient(145deg, #0f1f3d, #1a2f5a);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(79,142,255,0.25), 0 0 16px rgba(79,142,255,0.2);
  }
  .jw-logo-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }
  .jw-logo-sub {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.01em;
  }
  .jw-theme-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-2);
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .jw-theme-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-1);
  }

  /* ── Nav ── */
  .jw-nav {
    display: flex;
    gap: 2px;
    padding-bottom: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .jw-nav::-webkit-scrollbar { display: none; }
  .jw-nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    font-family: var(--font);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-3);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    margin-bottom: -1px;
  }
  .jw-nav-btn:hover { color: var(--text-2); }
  .jw-nav-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  /* ── Main ── */
  .jw-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* ── Setup grid ── */
  .jw-setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 768px) {
    .jw-setup-grid { grid-template-columns: 1fr; }
  }
  .jw-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 12px;
  }

  /* ── Select ── */
  .jw-select-wrap {
    margin-top: 12px;
    background: rgba(13,17,23,0.8);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 9px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .jw-select-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-3);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .jw-select {
    flex: 1;
    padding: 4px 26px 4px 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-1);
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  .jw-select:focus {
    outline: none;
    border-color: var(--accent-border);
    box-shadow: 0 0 0 2px var(--accent-dim);
  }

  /* ── Action tabs ── */
  .jw-action-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .jw-action-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }
  .jw-action-sub {
    font-size: 13px;
    color: var(--text-2);
    margin-top: 2px;
  }

  /* ── Buttons ── */
  .jw-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 0 0 1px rgba(79,142,255,0.5), 0 4px 14px rgba(79,142,255,0.2);
  }
  .jw-btn-primary:hover:not(:disabled) {
    background: #6ba3ff;
    transform: translateY(-1px);
    box-shadow: 0 0 0 1px rgba(79,142,255,0.7), 0 6px 18px rgba(79,142,255,0.3);
  }
  .jw-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .jw-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-2);
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .jw-btn-ghost:hover {
    color: var(--text-1);
    border-color: var(--border-hover);
    background: var(--bg-3);
  }

  /* ── Empty state ── */
  .jw-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 80px 24px;
    text-align: center;
  }
  .jw-empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    margin-bottom: 4px;
  }
  .jw-empty-title { font-size: 15px; font-weight: 500; color: var(--text-2); margin: 0; }
  .jw-empty-sub { font-size: 13px; color: var(--text-3); margin: 0; max-width: 280px; line-height: 1.5; }

  /* ── Card ── */
  .jw-card {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .jw-card-body { padding: 20px; }

  /* ── Cover letter ── */
  .jw-cover-card {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-top: 24px;
    overflow: hidden;
  }
  .jw-cover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .jw-cover-title { font-size: 14px; font-weight: 600; color: var(--text-1); }
  .jw-cover-body {
    padding: 20px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-2);
    white-space: pre-wrap;
    font-family: var(--mono);
  }

  /* ── Interview questions ── */
  .jw-q-list { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
  .jw-q-card {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    transition: border-color 0.15s;
  }
  .jw-q-card:hover { border-color: var(--border-hover); }
  .jw-q-num {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .jw-q-text { font-size: 14px; font-weight: 600; color: var(--text-1); margin-bottom: 10px; }
  .jw-q-answer { font-size: 13px; color: var(--text-2); line-height: 1.65; }

  /* ── Spin ── */
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Fade in ── */
  .fade-in { animation: fadeIn 0.3s ease both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
`;

function App() {
  const [tab, setTab] = useState('setup');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeRes, setActiveRes] = useState('');
  const [activeJob, setActiveJob] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [letter, setLetter] = useState('');
  const [questions, setQuestions] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [prepLoading, setPrepLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jobwise-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    localStorage.setItem('jobwise-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const loadData = async () => {
    try {
      const [r, j] = await Promise.all([getResumes(), getJDs()]);
      setResumes(r);
      setJobs(j);
    } catch (e) { console.error('failed to load:', e); }
  };

  const onResumeDone = (res) => { setResumes((prev) => [res, ...prev]); setActiveRes(res.id); };
  const onJobDone = (jd) => { setJobs((prev) => [jd, ...prev]); setActiveJob(jd.id); };

  const doMatch = async () => {
    if (!activeRes || !activeJob) return;
    setMatchLoading(true); setMatchData(null);
    try { const data = await runMatch({ resume_id: activeRes, jd_id: activeJob }); setMatchData(data); }
    catch (e) { console.error(e); } finally { setMatchLoading(false); }
  };

  const doCover = async () => {
    if (!activeRes || !activeJob) return;
    setCoverLoading(true); setLetter('');
    const job = jobs.find((j) => j.id === activeJob);
    try {
      const data = await runCoverLetter({ resume_id: activeRes, jd_id: activeJob, company_name: job?.company || '', job_title: job?.title || '' });
      setLetter(data.cover_letter);
    } catch (e) { console.error(e); } finally { setCoverLoading(false); }
  };

  const doPrep = async () => {
    if (!activeRes || !activeJob) return;
    setPrepLoading(true); setQuestions([]);
    const job = jobs.find((j) => j.id === activeJob);
    try {
      const data = await runInterviewPrep({ resume_id: activeRes, jd_id: activeJob, company_name: job?.company || '' });
      setQuestions(data.questions);
    } catch (e) { console.error(e); } finally { setPrepLoading(false); }
  };

  const copy = (txt) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const tabs = [
    { id: 'setup', label: 'Setup', icon: FileText },
    { id: 'tracker', label: 'Tracker', icon: Target },
    { id: 'tailor', label: 'Tailor Resume', icon: PenTool },
    { id: 'match', label: 'Skill Match', icon: Zap },
    { id: 'cover', label: 'Cover Letter', icon: PenTool },
    { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const ready = activeRes && activeJob;
  const activeJobObj = jobs.find(j => j.id === activeJob);
  const activeResObj = resumes.find(r => r.id === activeRes);

  return (
    <>
      <style>{styles}</style>
      <div className="jw-root">

        {/* Header */}
        <header className="jw-header">
          <div className="jw-header-inner">
            <div className="jw-header-top">
              <div className="jw-logo">
                <div className="jw-logo-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#4f8eff" strokeWidth="1.5" opacity="0.4"/>
                    <circle cx="12" cy="12" r="2" fill="#4f8eff"/>
                    <polygon points="12,3 13.5,10.5 12,9 10.5,10.5" fill="#f0f4ff"/>
                    <polygon points="12,21 10.5,13.5 12,15 13.5,13.5" fill="#4f8eff" opacity="0.6"/>
                    <polygon points="3,12 10.5,10.5 9,12 10.5,13.5" fill="#4f8eff" opacity="0.6"/>
                    <polygon points="21,12 13.5,13.5 15,12 13.5,10.5" fill="#f0f4ff" opacity="0.4"/>
                    <circle cx="12" cy="12" r="1.2" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="jw-logo-name">Jobwise</div>
                  <div className="jw-logo-sub">RAG-powered career toolkit</div>
                </div>
              </div>
              <button className="jw-theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            <nav className="jw-nav">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`jw-nav-btn ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="jw-main">

          {/* Setup */}
          {tab === 'setup' && (
            <div className="jw-setup-grid fade-in">
              <div>
                <div className="jw-section-label">Resume</div>
                <ResumeUpload onDone={onResumeDone} />
                {resumes.length > 0 && (
                  <div className="jw-select-wrap">
                    <span className="jw-select-label">Active resume</span>
                    <select className="jw-select" value={activeRes} onChange={e => setActiveRes(e.target.value)}>
                      <option value="">Select a resume</option>
                      {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <div className="jw-section-label">Job Description</div>
                <JobInput onDone={onJobDone} />
                {jobs.length > 0 && (
                  <div className="jw-select-wrap">
                    <span className="jw-select-label">Active job</span>
                    <select className="jw-select" value={activeJob} onChange={e => setActiveJob(e.target.value)}>
                      <option value="">Select a job</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.company} - {j.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skill Match */}
          {tab === 'match' && (
            <div className="fade-in">
              <div className="jw-action-header">
                <div>
                  <div className="jw-action-title">Skill Match</div>
                  {ready && <div className="jw-action-sub">{activeResObj?.filename} → {activeJobObj?.company} · {activeJobObj?.title}</div>}
                </div>
                {ready && (
                  <button className="jw-btn-primary" onClick={doMatch} disabled={matchLoading}>
                    {matchLoading ? <><Loader2 size={14} className="spin" /> Analyzing...</> : <><Zap size={14} /> Analyze Match</>}
                  </button>
                )}
              </div>
              {!ready ? (
                <div className="jw-empty">
                  <div className="jw-empty-icon"><Zap size={20} /></div>
                  <p className="jw-empty-title">No resume or job selected</p>
                  <p className="jw-empty-sub">Go to Setup and select a resume and job description first</p>
                </div>
              ) : matchData ? (
                <MatchResult data={matchData} darkMode={theme === 'dark'} />
              ) : null}
            </div>
          )}

          {/* Cover Letter */}
          {tab === 'cover' && (
            <div className="fade-in">
              <div className="jw-action-header">
                <div>
                  <div className="jw-action-title">Cover Letter</div>
                  {ready && <div className="jw-action-sub">{activeResObj?.filename} → {activeJobObj?.company} · {activeJobObj?.title}</div>}
                </div>
                {ready && (
                  <button className="jw-btn-primary" onClick={doCover} disabled={coverLoading}>
                    {coverLoading ? <><Loader2 size={14} className="spin" /> Generating...</> : <><PenTool size={14} /> Generate</>}
                  </button>
                )}
              </div>
              {!ready ? (
                <div className="jw-empty">
                  <div className="jw-empty-icon"><PenTool size={20} /></div>
                  <p className="jw-empty-title">No resume or job selected</p>
                  <p className="jw-empty-sub">Go to Setup and select a resume and job description first</p>
                </div>
              ) : letter ? (
                <div className="jw-cover-card">
                  <div className="jw-cover-header">
                    <span className="jw-cover-title">Cover Letter</span>
                    <button className="jw-btn-ghost" onClick={() => copy(letter)}>
                      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                  <div className="jw-cover-body">{letter}</div>
                </div>
              ) : null}
            </div>
          )}

          {/* Interview Prep */}
          {tab === 'interview' && (
            <div className="fade-in">
              <div className="jw-action-header">
                <div>
                  <div className="jw-action-title">Interview Prep</div>
                  {ready && <div className="jw-action-sub">{activeJobObj?.company} · {activeJobObj?.title}</div>}
                </div>
                {ready && (
                  <button className="jw-btn-primary" onClick={doPrep} disabled={prepLoading}>
                    {prepLoading ? <><Loader2 size={14} className="spin" /> Preparing...</> : <><MessageSquare size={14} /> Generate Questions</>}
                  </button>
                )}
              </div>
              {!ready ? (
                <div className="jw-empty">
                  <div className="jw-empty-icon"><MessageSquare size={20} /></div>
                  <p className="jw-empty-title">No resume or job selected</p>
                  <p className="jw-empty-sub">Go to Setup and select a resume and job description first</p>
                </div>
              ) : questions.length > 0 ? (
                <div className="jw-q-list">
                  {questions.map((q, idx) => (
                    <div key={idx} className="jw-q-card">
                      <div className="jw-q-num">Question {idx + 1}</div>
                      <div className="jw-q-text">{q.question}</div>
                      <div className="jw-q-answer">{q.suggested_answer}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {tab === 'history' && <HistoryTab darkMode={theme === 'dark'} />}
          {tab === 'analytics' && <AnalyticsDashboard darkMode={theme === 'dark'} />}
          {tab === 'tracker' && <ApplicationTracker darkMode={theme === 'dark'} resumes={resumes} jobs={jobs} />}
          {tab === 'tailor' && <ResumeTailoring darkMode={theme === 'dark'} activeRes={activeRes} activeJob={activeJob} resumes={resumes} jobs={jobs} />}
        </main>
      </div>
    </>
  );
}

export default App;