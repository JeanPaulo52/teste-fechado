"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar", 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex border-t border-slate-100">
          <button 
            onClick={onCancel} 
            className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 transition-colors border-r border-slate-100 text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-4 text-red-600 font-bold hover:bg-red-50 transition-colors text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}