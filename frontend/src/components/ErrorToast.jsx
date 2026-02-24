import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ErrorToast({ error, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              {error.title || 'Error'}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error.message}
            </p>
          </div>
          <button 
            onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
            className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}