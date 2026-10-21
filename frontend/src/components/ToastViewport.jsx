import { useEffect, useState } from 'react';
import { TOAST_EVENT_NAME } from '../lib/toast.js';

function ToastViewport() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timeoutId;

    const handleToast = (event) => {
      window.clearTimeout(timeoutId);
      setToast(event.detail);
      timeoutId = window.setTimeout(() => setToast(null), 3200);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);
    };
  }, []);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50 pointer-events-none">
      <div className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
        {toast.message}
      </div>
    </div>
  );
}

export default ToastViewport;
