import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const REQUIRED_PHRASE = 'RESET COMPETITION';

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim() === REQUIRED_PHRASE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-soft-lg relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Confirm Competition Reset
        </h3>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          This is an irreversible administrative action. It will delete all registered candidates, clear answer submissions, erase scores, and reset the competition clock to its initial state.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Type <span className="text-rose-600 font-mono select-all font-bold">RESET COMPETITION</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="RESET COMPETITION"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-rose-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10 text-slate-900 placeholder-slate-400 text-sm font-mono outline-none font-semibold"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            disabled={!isConfirmed}
            onClick={() => {
              onConfirm();
              setConfirmationInput('');
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
