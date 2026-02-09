import { useState, useEffect } from 'react';
import { FileText, Briefcase, PenTool, MessageSquare, Target, Loader2, Copy, Check } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Jobwise</h1>
              <p className="text-xs text-gray-500">RAG-powered career toolkit</p>
            </div>
          </div>

          <nav className="flex gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
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
        {/* setup */}
        {tab === 'setup' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Resume</h2>
              <ResumeUpload onDone={onResumeDone} />
              {resumes.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm text-gray-600 block mb-1">Active resume:</label>
                  <select
                    value={activeRes}
                    onChange={(e) => setActiveRes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a resume</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.filename}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Job Description</h2>
              <JobInput onDone={onJobDone} />
              {jobs.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm text-gray-600 block mb-1">Active job:</label>
                  <select
                    value={activeJob}
                    onChange={(e) => setActiveJob(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a job</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}{j.company ? ` — ${j.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* match */}
        {tab === 'match' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Select a resume and job description in Setup first.</p>
              </div>
            ) : (
              <div>
                <button
                  onClick={doMatch}
                  disabled={matchLoading}
                  className="mb-6 bg-primary-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {matchLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {matchLoading ? 'Analyzing...' : 'Analyze Match'}
                </button>
                <MatchResult data={matchData} />
              </div>
            )}
          </div>
        )}

        {/* cover letter */}
        {tab === 'cover' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500">
                <PenTool className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Select a resume and job description in Setup first.</p>
              </div>
            ) : (
              <div>
                <button
                  onClick={doCover}
                  disabled={coverLoading}
                  className="mb-6 bg-primary-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {coverLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {coverLoading ? 'Writing...' : 'Generate Cover Letter'}
                </button>
                {letter && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
                    <button
                      onClick={() => copy(letter)}
                      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {letter}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* interview prep */}
        {tab === 'interview' && (
          <div>
            {!ready ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Select a resume and job description in Setup first.</p>
              </div>
            ) : (
              <div>
                <button
                  onClick={doPrep}
                  disabled={prepLoading}
                  className="mb-6 bg-primary-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {prepLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {prepLoading ? 'Generating...' : 'Generate Interview Questions'}
                </button>
                {questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm pr-4">
                            {i + 1}. {q.question}
                          </h4>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                            q.category === 'technical' ? 'bg-blue-100 text-blue-700' :
                            q.category === 'behavioral' ? 'bg-purple-100 text-purple-700' :
                            q.category === 'system design' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {q.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 italic">{q.why_asked}</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Suggested Answer</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.suggested_answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;