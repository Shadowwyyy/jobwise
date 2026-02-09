import { useState, useCallback } from 'react';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { uploadResume } from '../services/api';

export default function ResumeUpload({ onDone }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const handle = useCallback(async (file) => {
    if (!file.name.endsWith('.pdf')) {
      setErr('Only PDF files work');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const res = await uploadResume(file);
      setResult(res);
      onDone?.(res);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Upload failed, try again');
    } finally {
      setLoading(false);
    }
  }, [onDone]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handle(f);
  }, [handle]);

  const onChange = (e) => {
    const f = e.target.files[0];
    if (f) handle(f);
  };

  if (result) {
    return (
      <div className="border-2 border-green-200 bg-green-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span className="font-semibold text-green-800">Resume uploaded</span>
        </div>
        <p className="text-sm text-green-700 mb-2">{result.filename}</p>
        <div className="flex flex-wrap gap-2">
          {result.sections?.map((s) => (
            <span key={s} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
              {s}
            </span>
          ))}
        </div>
        <button
          onClick={() => { setResult(null); setErr(''); }}
          className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
        >
          Upload a different resume
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <label className="cursor-pointer flex flex-col items-center gap-3">
          {loading ? (
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-700">
              {loading ? 'Processing resume...' : 'Drop your resume PDF here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={onChange}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>
      {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
    </div>
  );
}