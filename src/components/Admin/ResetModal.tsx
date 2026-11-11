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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121A2B] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          Confirm Competition Reset
        </h3>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          This is an irreversible administrative action. It will delete all registered participants, clear answer submissions, erase scores, and reset the competition clock to initial state.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Type <span className="text-rose-400 font-mono select-all font-bold">RESET COMPETITION</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="RESET COMPETITION"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-rose-500/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-600 text-sm font-mono outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

