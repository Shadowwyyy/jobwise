import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, Edit2, Check, X } from 'lucide-react';

export default function ApplicationTracker({ darkMode, resumes, jobs }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const statuses = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];
  const statusColors = {
    saved: 'bg-gray-500',
    applied: 'bg-blue-500',
    interviewing: 'bg-yellow-500',
    offer: 'bg-green-500',
    rejected: 'bg-red-500'
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/applications/');
      const data = await resp.json();
      setApplications(data.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const addApplication = async (resumeId, jdId) => {
    try {
      await fetch('http://localhost:8000/api/applications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeId,
          jd_id: jdId,
          status: 'saved'
        })
      });
      loadApplications();
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add application:', err);
    }
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      await fetch(`http://localhost:8000/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          applied_date: newStatus === 'applied' ? new Date().toISOString() : undefined
        })
      });
      loadApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const saveNotes = async (appId) => {
    try {
      await fetch(`http://localhost:8000/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes })
      });
      loadApplications();
      setEditingId(null);
      setEditNotes('');
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  const deleteApp = async (appId) => {
    if (!confirm('Delete this application?')) return;
    
    try {
      await fetch(`http://localhost:8000/api/applications/${appId}`, {
        method: 'DELETE'
      });
      setApplications(applications.filter(a => a.id !== appId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Application Tracker</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </button>
      </div>

      {/* Add application modal */}
      {showAdd && (
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Add New Application</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" id="resume-select">
              <option value="">Select Resume</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" id="job-select">
              <option value="">Select Job</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.company} - {j.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const rId = document.getElementById('resume-select').value;
                const jId = document.getElementById('job-select').value;
                if (rId && jId) addApplication(rId, jId);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Applications grid by status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statuses.map(status => (
          <div key={status} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
              <h3 className="font-semibold text-sm uppercase text-gray-700 dark:text-gray-300">
                {status}
              </h3>
              <span className="text-xs text-gray-500">
                ({applications.filter(a => a.status === status).length})
              </span>
            </div>
            
            <div className="space-y-2">
              {applications
                .filter(a => a.status === status)
                .map(app => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {app.job.company}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {app.job.title}
                    </p>
                    
                    {/* Status dropdown */}
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 mb-2"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    
                    {/* Notes */}
                    {editingId === app.id ? (
                      <div>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add notes..."
                          className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 mb-1"
                          rows={3}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveNotes(app.id)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditNotes(''); }}
                            className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                          >
                            <X className="w-3 h-3 mx-auto" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {app.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {app.notes}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingId(app.id); setEditNotes(app.notes || ''); }}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Notes
                          </button>
                          <button
                            onClick={() => deleteApp(app.id)}
                            className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                    
                    {app.applied_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.applied_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No applications tracked yet. Click "Add Application" to start tracking your job search!
        </div>
      )}
    </div>
  );
}