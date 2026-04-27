"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function BarraPesquisa() {
  const [isOpen, setIsOpen] = useState(false);
  const [termo, setTermo] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const aoPesquisar = (e: React.FormEvent) => {
    e.preventDefault();
    if (termo.trim().length > 0) {
      setIsOpen(false);
      // Redireciona para a página de pesquisa com o parâmetro "q"
      router.push(`/pesquisa?q=${encodeURIComponent(termo)}`);
      setTermo('');
    }
  };

  const fecharPesquisa = () => {
    setIsOpen(false);
    setTermo('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
      >
        <span className="material-symbols-outlined">search</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center pt-20 bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={fecharPesquisa}></div>
          
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10">
            {/* FORMULÁRIO QUE GERENCIA O ENTER */}
            <form onSubmit={aoPesquisar} className="flex items-center p-4 border-b border-slate-100">
              <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Digite e aperte Enter para pesquisar..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="flex-1 outline-none text-lg text-slate-800 bg-transparent"
                autoFocus
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Pesquisar</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}