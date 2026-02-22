import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Loader2, Plus } from 'lucide-react';

const styles = `
  .ru-wrap { display: flex; flex-direction: column; gap: 12px; }

  .ru-dropzone {
    background: rgba(13,17,23,0.8);
    border: 1px dashed rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    transition: all 0.2s;
    cursor: pointer;
  }
  .ru-dropzone:hover, .ru-dropzone.drag-over {
    border-color: rgba(79,142,255,0.4);
    background: rgba(79,142,255,0.04);
  }
  .ru-dropzone-left { display: flex; align-items: center; gap: 12px; }
  .ru-dropzone-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: rgba(79,142,255,0.1);
    border: 1px solid rgba(79,142,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f8eff;
    flex-shrink: 0;
  }
  .ru-dropzone-title {
    font-size: 13px;
    font-weight: 500;
    color: #f0f4ff;
    margin-bottom: 2px;
  }
  .ru-dropzone-sub { font-size: 11px; color: #4a5568; }
  .ru-file-name { font-size: 12px; color: #4f8eff; margin-top: 3px; font-family: 'DM Mono', monospace; }

  .ru-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: #fff;
    background: #4f8eff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.15s;
    box-shadow: 0 0 0 1px rgba(79,142,255,0.5), 0 4px 12px rgba(79,142,255,0.2);
  }
  .ru-upload-btn:hover:not(:disabled) {
    background: #6ba3ff;
    transform: translateY(-1px);
  }
  .ru-upload-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .ru-list {
    background: rgba(13,17,23,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    overflow: hidden;
  }
  .ru-list-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ru-list-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4a5568; }
  .ru-list-count {
    font-size: 11px;
    font-weight: 500;
    color: #4f8eff;
    background: rgba(79,142,255,0.1);
    border: 1px solid rgba(79,142,255,0.2);
    padding: 1px 8px;
    border-radius: 20px;
  }
  .ru-list-body { max-height: 220px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .ru-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
  }
  .ru-item:last-child { border-bottom: none; }
  .ru-item:hover { background: rgba(255,255,255,0.02); }
  .ru-item-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .ru-item-icon {
    width: 30px; height: 30px;
    border-radius: 7px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    color: #4a5568;
    flex-shrink: 0;
  }
  .ru-item-name { font-size: 12.5px; font-weight: 500; color: #f0f4ff; truncate: true; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ru-item-date { font-size: 11px; color: #4a5568; margin-top: 1px; }
  .ru-delete-btn {
    padding: 5px;
    color: #4a5568;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .ru-delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function ResumeUpload({ onDone }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadResumes(); }, []);

  const loadResumes = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/resumes/');
      const data = await resp.json();
      setResumes(data);
    } catch (err) { console.error('Failed to load resumes:', err); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await fetch('http://localhost:8000/api/resumes/upload', { method: 'POST', body: formData });
      const data = await resp.json();
      onDone(data);
      setFile(null);
      loadResumes();
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    try {
      await fetch(`http://localhost:8000/api/resumes/${id}`, { method: 'DELETE' });
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ru-wrap">
        {/* Drop zone */}
        <div
          className={`ru-dropzone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="ru-dropzone-left">
            <div className="ru-dropzone-icon">
              <Upload size={16} />
            </div>
            <div>
              <div className="ru-dropzone-title">
                {file ? 'Ready to upload' : 'Upload resume'}
              </div>
              <div className="ru-dropzone-sub">PDF only · Click or drag & drop</div>
              {file && <div className="ru-file-name">{file.name}</div>}
            </div>
          </div>
          <button
            className="ru-upload-btn"
            disabled={!file || uploading}
            onClick={e => { e.stopPropagation(); handleUpload(); }}
          >
            {uploading ? <><Loader2 size={13} className="spin" /> Uploading...</> : <><Plus size={13} /> Upload</>}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />

        {/* Saved resumes */}
        {resumes.length > 0 && (
          <div className="ru-list">
            <div className="ru-list-header">
              <span className="ru-list-title">Saved Resumes</span>
              <span className="ru-list-count">{resumes.length}</span>
            </div>
            <div className="ru-list-body">
              {resumes.map(resume => (
                <div key={resume.id} className="ru-item">
                  <div className="ru-item-left">
                    <div className="ru-item-icon"><FileText size={13} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="ru-item-name">{resume.filename}</div>
                      <div className="ru-item-date">{new Date(resume.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button className="ru-delete-btn" onClick={() => handleDelete(resume.id)}>
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