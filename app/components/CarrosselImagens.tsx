"use client";

import { useState } from 'react';

export default function CarrosselImagens({ imagens, titulo }: { imagens: string[], titulo: string }) {
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!imagens || imagens.length === 0) return null;

  const irParaAnterior = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPaginaAtual((atual) => (atual === 0 ? imagens.length - 1 : atual - 1));
  };

  const irParaProxima = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPaginaAtual((atual) => (atual === imagens.length - 1 ? 0 : atual + 1));
  };

  const renderLightbox = () => {
    if (!isLightboxOpen) return null;
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
        <button onClick={() => setIsLightboxOpen(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-[10000]">
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <img src={imagens[paginaAtual]} className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
        
        {imagens.length > 1 && (
          <>
            <button onClick={irParaAnterior} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full w-14 h-14 flex items-center justify-center"><span className="material-symbols-outlined text-4xl">chevron_left</span></button>
            <button onClick={irParaProxima} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full w-14 h-14 flex items-center justify-center"><span className="material-symbols-outlined text-4xl">chevron_right</span></button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm font-bold">{paginaAtual + 1} de {imagens.length}</div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
        <div 
          className="relative w-full pt-[141.42%] rounded-md overflow-hidden shadow-inner bg-slate-100 cursor-zoom-in group border border-slate-200"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img 
            src={imagens[paginaAtual]} 
            className="absolute top-0 left-0 w-full h-full object-contain p-2 transition-opacity duration-300" 
          />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-700 opacity-0 group-hover:opacity-100 drop-shadow-sm text-5xl transition-opacity">zoom_in</span>
          </div>
          
          {imagens.length > 1 && (
            <>
              <button onClick={irParaAnterior} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"><span className="material-symbols-outlined">chevron_left</span></button>
              <button onClick={irParaProxima} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"><span className="material-symbols-outlined">chevron_right</span></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {imagens.map((_, index) => (
                  <button key={index} onClick={(e) => { e.stopPropagation(); setPaginaAtual(index); }} className={`w-2 h-2 rounded-full shadow-sm ${index === paginaAtual ? 'bg-blue-600 w-4' : 'bg-slate-300'}`} />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none">{paginaAtual + 1} / {imagens.length}</div>
        </div>
      </div>
      {renderLightbox()}
    </>
  );
}