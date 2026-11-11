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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-[#FCA5A5] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-soft-lg relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8E9BAE] hover:text-[#172033] transition-colors p-1.5 rounded-lg hover:bg-[#F8F9FC] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#C2414A] flex items-center justify-center mb-4 shadow-soft-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[#172033] mb-2 tracking-tight">
          Confirm Competition Reset
        </h3>

        <p className="text-xs text-[#647084] mb-5 leading-relaxed">
          This is an irreversible administrative action. It will delete all registered candidates, clear answer submissions, erase scores, and reset the competition clock to its initial state.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-2 font-mono">
            Type <span className="text-[#C2414A] select-all font-black">RESET COMPETITION</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="RESET COMPETITION"
            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FC] border border-[#FCA5A5] focus:border-[#C2414A] focus:ring-2 focus:ring-[#C2414A]/10 text-[#172033] placeholder-[#8E9BAE] text-xs font-mono outline-none font-bold"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7EAF0]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#647084] hover:text-[#172033] hover:bg-[#F8F9FC] transition-colors cursor-pointer"
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
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C2414A] hover:bg-[#991B1B] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
