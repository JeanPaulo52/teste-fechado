"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function BotaoNovoPost() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* O Botão de + */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-cyan-600 hover:bg-cyan-700 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
        title="Nova Publicação"
      >
        <span className="text-2xl font-light mb-1">+</span>
      </button>

      {/* O Modal de Escolha */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-[slideUp_0.2s_ease-out]">
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              X
            </button>

            <h2 className="text-xl font-bold text-slate-800 text-center mb-6">O que você deseja compartilhar?</h2>

            <div className="flex flex-col gap-4">
              
              {/* Opção 1: Atividade */}
              <Link 
                href="/atividades/nova" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
              >
                <div className="bg-cyan-100 text-cyan-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  🎨
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">Atividade</h3>
                  <p className="text-sm text-slate-500">Foto, título e descrição rápida.</p>
                </div>
              </Link>

              {/* Opção 2: Artigo */}
              <Link 
                href="/artigos/novo" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  📝
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">Artigo</h3>
                  <p className="text-sm text-slate-500">Texto longo com capa e formatação.</p>
                </div>
              </Link>

              {/* ✨ NOVA OPÇÃO: Momento / Postagem */}
              <Link 
                href="/postagem" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  📸
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">Momento</h3>
                  <p className="text-sm text-slate-500">Fotos e dia a dia na sala de aula.</p>
                </div>
              </Link>

            </div>

          </div>
        </div>
      )}
    </>
  );
}