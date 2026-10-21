const TOAST_EVENT_NAME = 'qdca-toast';

function emitToast(type, message) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: { type, message } }));
}

export const toast = {
  success: (message) => emitToast('success', message),
  error: (message) => emitToast('error', message),
};

export { TOAST_EVENT_NAME };
