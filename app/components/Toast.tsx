"use client";
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setIsVisible(true);

    // Auto-fechar após 3.5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Espera a animação de saída antes de desmontar
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex items-end justify-end pointer-events-none">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 transform ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        } ${styles[type]} pointer-events-auto`}
      >
        <span className="material-symbols-outlined text-[24px]">
          {icons[type]}
        </span>
        <p className="text-sm font-bold">{message}</p>
        <button 
          onClick={() => setIsVisible(false)} 
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity flex items-center"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}