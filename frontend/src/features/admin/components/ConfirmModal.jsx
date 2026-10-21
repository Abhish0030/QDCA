import { X } from "lucide-react";

/**
 * ConfirmModal — white rounded-2xl modal matching app style.
 * Props: open, title, description, confirmLabel, confirmVariant ('danger'|'primary'), onConfirm, onCancel
 */
export default function ConfirmModal({
  open, title, description,
  confirmLabel = "Confirm", confirmVariant = "primary",
  onConfirm, onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white
                ${confirmVariant === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-200"
                  : "bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
