import { useState } from 'react';
import { Loader2, Check, X, Download, ChevronDown, ChevronUp } from 'lucide-react';

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
        body: JSON.stringify({
          resume_id: activeRes,
          jd_id: activeJob
        })
      });
      const data = await resp.json();
      setSuggestions(data);
      
      // Initialize all sections as collapsed
      const expanded = {};
      Object.keys(data.suggestions).forEach(section => {
        expanded[section] = false;
      });
      setExpandedSections(expanded);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = (section) => {
    setApprovals(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
          first_name: "Jeet",  // TODO: Extract from resume
          last_name: "Sharma"
        })
      });
      
      const data = await resp.json();
      
      // Download as text file (PDF generation would need additional backend setup)
      const blob = new Blob([data.resume_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename.replace('.pdf', '.txt');
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
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Please select a resume and job description first
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Tailoring</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tailoring {resume?.filename} for {job?.company} - {job?.title}
          </p>
        </div>
        
        {!suggestions ? (
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              'Generate Suggestions'
            )}
          </button>
        ) : (
          <button
            onClick={downloadResume}
            disabled={generating || Object.values(approvals).every(v => !v)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Tailored Resume
              </>
            )}
          </button>
        )}
      </div>

      {suggestions && (
        <div className="space-y-4">
          {Object.keys(suggestions.suggestions).map(section => {
            const sug = suggestions.suggestions[section];
            const isApproved = approvals[section];
            const isExpanded = expandedSections[section];
            
            return (
              <div
                key={section}
                className={`bg-white dark:bg-gray-800 border-2 rounded-lg overflow-hidden transition-all ${
                  isApproved 
                    ? 'border-green-500 dark:border-green-600' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Section header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSection(section)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <h3 className="font-semibold text-lg capitalize">{section}</h3>
                    {sug.changes.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                        {sug.changes.length} changes
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleApproval(section)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isApproved
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Approved
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Not Approved
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Reasoning */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        💡 {sug.reasoning}
                      </p>
                    </div>

                    {/* Changes list */}
                    {sug.changes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Key Changes:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {sug.changes.map((change, idx) => (
                            <li key={idx}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Before/After comparison */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Before:</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {sug.original}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">After:</h4>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {sug.improved}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {Object.values(approvals).filter(v => v).length} of {Object.keys(suggestions.suggestions).length} sections approved
            </p>
          </div>
        </div>
      )}
    </div>
  );
}