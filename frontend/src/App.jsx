import { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  PenTool,
  MessageSquare,
  Target,
  Loader2,
  Copy,
  Check,
  Sun,
  Moon,
  History,
  BarChart3
} from 'lucide-react';
import ResumeUpload from './components/ResumeUpload';
import JobInput from './components/JobInput';
import MatchResult from './components/MatchResult';
import HistoryTab from './components/HistoryTab';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { getResumes, getJDs, runMatch, runCoverLetter, runInterviewPrep } from './services/api';

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('jobwise-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const loadData = async () => {
    try {
      const [r, j] = await Promise.all([getResumes(), getJDs()]);
      setResumes(r);
      setJobs(j);
    } catch (e) {
      console.error('failed to load:', e);
    }
  };

  const onResumeDone = (res) => {
    setResumes((prev) => [res, ...prev]);
    setActiveRes(res.id);
  };

  const onJobDone = (jd) => {
    setJobs((prev) => [jd, ...prev]);
    setActiveJob(jd.id);
  };

  const doMatch = async () => {
    if (!activeRes || !activeJob) return;
    setMatchLoading(true);
    setMatchData(null);
    try {
      const data = await runMatch({ resume_id: activeRes, jd_id: activeJob });
      setMatchData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setMatchLoading(false);
    }
  };

  const doCover = async () => {
    if (!activeRes || !activeJob) return;
    setCoverLoading(true);
    setLetter('');
    const job = jobs.find((j) => j.id === activeJob);
    try {
      const data = await runCoverLetter({
        resume_id: activeRes,
        jd_id: activeJob,
        company_name: job?.company || '',
        job_title: job?.title || '',
      });
      setLetter(data.cover_letter);
    } catch (e) {
      console.error(e);
    } finally {
      setCoverLoading(false);
    }
  };

  const doPrep = async () => {
    if (!activeRes || !activeJob) return;
    setPrepLoading(true);
    setQuestions([]);
    const job = jobs.find((j) => j.id === activeJob);
    try {
      const data = await runInterviewPrep({
        resume_id: activeRes,
        jd_id: activeJob,
        company_name: job?.company || '',
      });
      setQuestions(data.questions);
    } catch (e) {
      console.error(e);
    } finally {
      setPrepLoading(false);
    }
  };

  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'setup', label: 'Setup', icon: FileText },
    { id: 'match', label: 'Skill Match', icon: Target },
    { id: 'cover', label: 'Cover Letter', icon: PenTool },
    { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const ready = activeRes && activeJob;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Jobwise</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  RAG-powered career toolkit
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>

          <nav className="flex gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'setup' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700 dark:text-gray-300">
                Resume
              </h2>
              <ResumeUpload onDone={onResumeDone} />
              
              {resumes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Active resume:
                  </label>
                  <select
                    value={activeRes}
                    onChange={(e) => setActiveRes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">Select a resume</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700 dark:text-gray-300">
                Job Description
              </h2>
              <JobInput onDone={onJobDone} />
              
              {jobs.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Active job:
                  </label>
                  <select
                    value={activeJob}
                    onChange={(e) => setActiveJob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">Select a job</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} - {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'match' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Please upload a resume and add a job description first
              </div>
            ) : (
              <>
                <button
                  onClick={doMatch}
                  disabled={matchLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {matchLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Match'
                  )}
                </button>
                
                {matchData && <MatchResult data={matchData} darkMode={theme === 'dark'} />}
              </>
            )}
          </div>
        )}

        {tab === 'cover' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Please upload a resume and add a job description first
              </div>
            ) : (
              <>
                <button
                  onClick={doCover}
                  disabled={coverLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {coverLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Cover Letter'
                  )}
                </button>
                
                {letter && (
                  <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Cover Letter</h3>
                      <button
                        onClick={() => copy(letter)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">{letter}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'interview' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Please upload a resume and add a job description first
              </div>
            ) : (
              <>
                <button
                  onClick={doPrep}
                  disabled={prepLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {prepLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing...
                    </span>
                  ) : (
                    'Prepare Interview Questions'
                  )}
                </button>
                
                {questions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {questions.map((q, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="font-semibold text-lg mb-2">Q{idx + 1}: {q.question}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'history' && <HistoryTab darkMode={theme === 'dark'} />}
        {tab === 'analytics' && <AnalyticsDashboard darkMode={theme === 'dark'} />}
      </main>
    </div>
  );
}

export default App;