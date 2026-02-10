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
  Moon
} from 'lucide-react';
import ResumeUpload from './components/ResumeUpload';
import JobInput from './components/JobInput';
import MatchResult from './components/MatchResult';
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

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('jobwise-theme');

    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
      return;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
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
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700 dark:text-gray-300">
                Job Description
              </h2>
              <JobInput onDone={onJobDone} />
            </div>
          </div>
        )}

        {tab === 'match' && ready && (
          <button
            onClick={doMatch}
            disabled={matchLoading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg"
          >
            {matchLoading ? 'Analyzing...' : 'Analyze Match'}
          </button>
        )}
      </main>
    </div>
  );
}

export default App;