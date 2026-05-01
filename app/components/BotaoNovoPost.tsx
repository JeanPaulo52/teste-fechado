"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function BotaoNovoPost() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Garante que o Portal só renderize no lado do cliente (evita erros no Next.js)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Trava o scroll da página de fundo quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Conteúdo do Modal (Separado para podermos teleportá-lo)
  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      {/* Fundo Escuro com clique para fechar */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Caixa do Modal */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-[slideUp_0.2s_ease-out]">
        
        {/* Cabeçalho do Modal (Com o degradê da sua marca) */}
        <div className="bg-gradient-to-r from-blue-600 to-red-600 p-6 text-center relative">
          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          >
            ✕
          </button>
          <h2 className="text-2xl font-extrabold text-white mb-1">Criar Postagem</h2>
          <p className="text-white/90 text-sm font-medium">O que você deseja compartilhar hoje?</p>
        </div>

        {/* Opções de Postagem */}
        <div className="p-6 flex flex-col gap-3">
          
          {/* Opção 1: Atividade */}
          <Link 
            href="/atividades/nova" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-5 p-4 rounded-2xl border-2 border-slate-100 hover:border-cyan-500 hover:bg-cyan-50 hover:shadow-md transition-all group"
          >
            <div className="bg-cyan-100 text-cyan-600 w-14 h-14 rounded-full flex items-center justify-center text-3xl group-hover:bg-cyan-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
              🎨
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-cyan-700 transition-colors">Atividade</h3>
              <p className="text-sm text-slate-500 line-clamp-2">Compartilhe uma foto, título e descrição rápida da tarefa.</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-cyan-500 transition-colors">chevron_right</span>
          </Link>

          {/* Opção 2: Artigo */}
          <Link 
            href="/artigos/novo" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-5 p-4 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all group"
          >
            <div className="bg-purple-100 text-purple-600 w-14 h-14 rounded-full flex items-center justify-center text-3xl group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
              📝
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">Artigo</h3>
              <p className="text-sm text-slate-500 line-clamp-2">Crie um texto longo e detalhado com capa e formatação.</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-purple-500 transition-colors">chevron_right</span>
          </Link>

          {/* Opção 3: Momento */}
          <Link 
            href="/postagem" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-5 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group"
          >
            <div className="bg-blue-100 text-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
              📸
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">Momento</h3>
              <p className="text-sm text-slate-500 line-clamp-2">Registre os imprevistos e o dia a dia na sala de aula.</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
          </Link>

        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Botão de abrir modal na Navbar */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        title="Nova Publicação"
      >
        <span className="material-symbols-outlined text-[20px]">post_add</span>
        <span className="font-bold tracking-wide text-sm">POSTAR</span>
      </button>

      {/* Renderiza o modal lá no final do código (fora da Navbar) */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}