import { useState } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState(null);

  const handleError = (err, context = '') => {
    console.error(`Error in ${context}:`, err);
    
    let errorMsg = 'Something went wrong';
    let errorTitle = 'Error';
    
    if (err.response) {
      // API error
      const data = err.response.data;
      errorMsg = data.detail || data.error || data.message || errorMsg;
      
      if (err.response.status === 429) {
        errorTitle = 'Rate Limit Exceeded';
        errorMsg = 'API quota exhausted. Please try again later or check your API key.';
      } else if (err.response.status === 404) {
        errorTitle = 'Not Found';
      } else if (err.response.status === 400) {
        errorTitle = 'Invalid Request';
      }
    } else if (err.message) {
      errorMsg = err.message;
    }
    
    setError({ title: errorTitle, message: errorMsg });
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}