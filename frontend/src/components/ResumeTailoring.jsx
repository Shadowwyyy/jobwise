import { useState } from 'react';
import { Loader2, Check, X, Download, ChevronDown, ChevronUp, Sparkles, FileText, Zap } from 'lucide-react';

export default function ResumeTailoring({ darkMode, activeRes, activeJob, resumes, jobs }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [generating, setGenerating] = useState(false);

  const resume = resumes.find(r => r.id === activeRes);
  const job = jobs.find(j => j.id === activeJob);

  const generateSuggestions = async () => {
    if (!activeRes || !activeJob) return;
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/api/tailor/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: activeRes, jd_id: activeJob })
      });
      const data = await resp.json();
      setSuggestions(data);
      const expanded = {};
      Object.keys(data.suggestions).forEach(section => { expanded[section] = false; });
      setExpandedSections(expanded);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = (section) => {
    setApprovals(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const approvedCount = Object.values(approvals).filter(Boolean).length;
  const totalCount = suggestions ? Object.keys(suggestions.suggestions).length : 0;

  const downloadResume = async () => {
    setGenerating(true);
    const approvedSections = {};
    Object.keys(approvals).forEach(section => {
      if (approvals[section]) {
        approvedSections[section] = suggestions.suggestions[section].improved;
      }
    });
    try {
      const resp = await fetch('http://localhost:8000/api/tailor/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: activeRes,
          jd_id: activeJob,
          approved_sections: approvedSections,
          first_name: "Jeet",
          last_name: "Sharma"
        })
      });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jeet_Sharma_${job?.company?.replace(/\s+/g, '_') || 'Resume'}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate resume:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (!activeRes || !activeJob) {
    return (
      <>
        <style>{styles}</style>
        <div className="tailor-empty">
          <div className="tailor-empty-icon">
            <FileText size={28} />
          </div>
          <p className="tailor-empty-title">No resume or job selected</p>
          <p className="tailor-empty-sub">Go to Setup and select a resume and job description to get started</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="tailor-root">

        {/* Header */}
        <div className="tailor-header">
          <div className="tailor-header-left">
            <div className="tailor-header-badge">
              <Sparkles size={13} />
              AI-Powered
            </div>
            <h1 className="tailor-title">Resume Tailoring</h1>
            <p className="tailor-subtitle">
              <span className="tailor-pill">{resume?.filename}</span>
              <span className="tailor-arrow">→</span>
              <span className="tailor-pill">{job?.company} · {job?.title}</span>
            </p>
          </div>

          <div className="tailor-header-right">
            {!suggestions ? (
              <button
                onClick={generateSuggestions}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Analyzing resume...
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Generate Suggestions
                  </>
                )}
              </button>
            ) : (
              <div className="tailor-header-actions">
                <div className="tailor-progress-badge">
                  <div
                    className="tailor-progress-fill"
                    style={{ width: totalCount ? `${(approvedCount / totalCount) * 100}%` : '0%' }}
                  />
                  <span>{approvedCount}/{totalCount} approved</span>
                </div>
                <button
                  onClick={downloadResume}
                  disabled={generating || approvedCount === 0}
                  className="btn-success"
                >
                  {generating ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      Building PDF...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Download Resume
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="tailor-skeleton-wrap">
            {[1, 2, 3].map(i => (
              <div key={i} className="tailor-skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="skel-line skel-short" />
                <div className="skel-line skel-long" />
                <div className="skel-line skel-mid" />
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions && (
          <div className="tailor-sections">
            {Object.keys(suggestions.suggestions).map((section, idx) => {
              const sug = suggestions.suggestions[section];
              const isApproved = approvals[section];
              const isExpanded = expandedSections[section];

              return (
                <div
                  key={section}
                  className={`tailor-card ${isApproved ? 'tailor-card--approved' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Card header */}
                  <div className="tailor-card-header" onClick={() => toggleSection(section)}>
                    <div className="tailor-card-left">
                      <div className={`tailor-section-dot ${isApproved ? 'dot--green' : 'dot--gray'}`} />
                      <span className="tailor-section-name">{section}</span>
                      {sug.changes?.length > 0 && (
                        <span className="tailor-changes-badge">{sug.changes.length} changes</span>
                      )}
                    </div>
                    <div className="tailor-card-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleApproval(section)}
                        className={`btn-approval ${isApproved ? 'btn-approval--on' : 'btn-approval--off'}`}
                      >
                        {isApproved ? <><Check size={13} /> Approved</> : <><X size={13} /> Approve</>}
                      </button>
                      <button className="btn-chevron" onClick={() => toggleSection(section)}>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="tailor-card-body">

                      {/* Reasoning */}
                      {sug.reasoning && (
                        <div className="tailor-reasoning">
                          <span className="tailor-reasoning-label">Reasoning</span>
                          <p>{sug.reasoning}</p>
                        </div>
                      )}

                      {/* Changes list */}
                      {sug.changes?.length > 0 && (
                        <div className="tailor-changes">
                          <span className="tailor-changes-label">Key Changes</span>
                          <ul>
                            {sug.changes.map((change, i) => (
                              <li key={i}>
                                <span className="change-dot" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Before / After */}
                      <div className="tailor-diff">
                        <div className="tailor-diff-col">
                          <div className="diff-label diff-label--before">Before</div>
                          <div className="diff-box diff-box--before">
                            <pre>{sug.original}</pre>
                          </div>
                        </div>
                        <div className="tailor-diff-divider" />
                        <div className="tailor-diff-col">
                          <div className="diff-label diff-label--after">After</div>
                          <div className="diff-box diff-box--after">
                            <pre>{sug.improved}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');

  .tailor-root {
    font-family: 'Geist', 'SF Pro Display', system-ui, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
    color: #e2e8f0;
  }

  /* ── Header ── */
  .tailor-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }
  .tailor-header-left { display: flex; flex-direction: column; gap: 8px; }
  .tailor-header-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #818cf8;
    background: rgba(129,140,248,0.1);
    border: 1px solid rgba(129,140,248,0.2);
    padding: 3px 10px;
    border-radius: 20px;
    width: fit-content;
  }
  .tailor-title {
    font-size: 26px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .tailor-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    margin: 0;
    flex-wrap: wrap;
  }
  .tailor-pill {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 2px 10px;
    border-radius: 20px;
    color: #94a3b8;
    font-size: 12px;
  }
  .tailor-arrow { color: #334155; font-size: 14px; }

  .tailor-header-right { display: flex; align-items: center; }
  .tailor-header-actions { display: flex; align-items: center; gap: 12px; }

  .tailor-progress-badge {
    position: relative;
    font-size: 12px;
    color: #64748b;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 6px 14px;
    border-radius: 8px;
    overflow: hidden;
    min-width: 110px;
    text-align: center;
  }
  .tailor-progress-fill {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    background: rgba(34,197,94,0.12);
    border-right: 1px solid rgba(34,197,94,0.3);
    transition: width 0.4s ease;
    pointer-events: none;
  }
  .tailor-progress-badge span { position: relative; z-index: 1; }

  /* ── Buttons ── */
  .btn-primary, .btn-success {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .btn-primary {
    background: #6366f1;
    color: #fff;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.5), 0 4px 12px rgba(99,102,241,0.25);
  }
  .btn-primary:hover:not(:disabled) {
    background: #5558e8;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.7), 0 6px 16px rgba(99,102,241,0.35);
    transform: translateY(-1px);
  }
  .btn-success {
    background: #16a34a;
    color: #fff;
    box-shadow: 0 0 0 1px rgba(22,163,74,0.5), 0 4px 12px rgba(22,163,74,0.2);
  }
  .btn-success:hover:not(:disabled) {
    background: #15803d;
    transform: translateY(-1px);
  }
  .btn-primary:disabled, .btn-success:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Skeleton ── */
  .tailor-skeleton-wrap { display: flex; flex-direction: column; gap: 12px; }
  .tailor-skeleton {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: skeletonPulse 1.4s ease-in-out infinite alternate;
  }
  .skel-line {
    height: 10px;
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
  }
  .skel-short { width: 30%; }
  .skel-long { width: 85%; }
  .skel-mid { width: 60%; }
  @keyframes skeletonPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }

  /* ── Section cards ── */
  .tailor-sections { display: flex; flex-direction: column; gap: 10px; }
  .tailor-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    animation: fadeSlideIn 0.3s ease both;
  }
  .tailor-card:hover { border-color: rgba(255,255,255,0.12); }
  .tailor-card--approved {
    border-color: rgba(34,197,94,0.35) !important;
    box-shadow: 0 0 0 1px rgba(34,197,94,0.1), 0 4px 20px rgba(34,197,94,0.06);
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tailor-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    cursor: pointer;
    user-select: none;
    gap: 12px;
  }
  .tailor-card-header:hover { background: rgba(255,255,255,0.02); }

  .tailor-card-left { display: flex; align-items: center; gap: 10px; }
  .tailor-section-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .dot--green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6); }
  .dot--gray { background: #334155; }

  .tailor-section-name {
    font-size: 14px;
    font-weight: 500;
    color: #cbd5e1;
    text-transform: capitalize;
    letter-spacing: 0.01em;
  }
  .tailor-changes-badge {
    font-size: 11px;
    font-weight: 500;
    color: #818cf8;
    background: rgba(129,140,248,0.1);
    border: 1px solid rgba(129,140,248,0.18);
    padding: 2px 8px;
    border-radius: 20px;
  }

  .tailor-card-right { display: flex; align-items: center; gap: 8px; }

  .btn-approval {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-approval--off {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
    color: #64748b;
  }
  .btn-approval--off:hover {
    background: rgba(34,197,94,0.08);
    border-color: rgba(34,197,94,0.25);
    color: #86efac;
  }
  .btn-approval--on {
    background: rgba(34,197,94,0.15);
    border-color: rgba(34,197,94,0.35);
    color: #86efac;
  }
  .btn-chevron {
    background: none;
    border: none;
    color: #475569;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    transition: color 0.15s;
  }
  .btn-chevron:hover { color: #94a3b8; }

  /* ── Card body ── */
  .tailor-card-body {
    padding: 0 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .tailor-reasoning {
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 8px;
    padding: 12px 14px;
    margin-top: 14px;
  }
  .tailor-reasoning-label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #818cf8;
    margin-bottom: 5px;
  }
  .tailor-reasoning p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
  }

  .tailor-changes { display: flex; flex-direction: column; gap: 6px; }
  .tailor-changes-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
  }
  .tailor-changes ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tailor-changes li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
  }
  .change-dot {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #475569;
    flex-shrink: 0;
    margin-top: 7px;
  }

  /* ── Diff ── */
  .tailor-diff {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: 0;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    overflow: hidden;
  }
  .tailor-diff-divider { background: rgba(255,255,255,0.06); }
  .tailor-diff-col { display: flex; flex-direction: column; }

  .diff-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .diff-label--before { color: #64748b; background: rgba(255,255,255,0.02); }
  .diff-label--after { color: #4ade80; background: rgba(34,197,94,0.04); }

  .diff-box { flex: 1; padding: 12px 14px; }
  .diff-box--before { background: rgba(0,0,0,0.15); }
  .diff-box--after { background: rgba(34,197,94,0.03); }
  .diff-box pre {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11.5px;
    line-height: 1.65;
    color: #94a3b8;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
  .diff-box--after pre { color: #cbd5e1; }

  /* ── Empty state ── */
  .tailor-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 24px;
    text-align: center;
  }
  .tailor-empty-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    margin-bottom: 4px;
  }
  .tailor-empty-title {
    font-size: 15px;
    font-weight: 500;
    color: #475569;
    margin: 0;
  }
  .tailor-empty-sub {
    font-size: 13px;
    color: #334155;
    margin: 0;
    max-width: 300px;
    line-height: 1.5;
  }

  /* ── Spin ── */
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;