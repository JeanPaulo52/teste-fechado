"use client";

import { useState } from 'react';

// Aqui dizemos quais informações o botão precisa receber da página
interface BotaoDownloadProps {
  urlParaDownload: string | null;
  titulo: string;
  isPdf: boolean;
  className?: string;
}

export default function BotaoDownload({ urlParaDownload, titulo, isPdf, className = "" }: BotaoDownloadProps) {
  const [baixando, setBaixando] = useState(false);

  if (!urlParaDownload) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBaixando(true);

    try {
      const response = await fetch(urlParaDownload);
      if (!response.ok) throw new Error("Erro ao acessar o arquivo");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Define o nome e a extensão correta do arquivo
      const extensao = isPdf ? 'pdf' : 'png';
      link.download = `${titulo.replace(/\s+/g, '-').toLowerCase()}.${extensao}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback: Se o download direto for bloqueado (CORS), abre na aba ao lado
      window.open(urlParaDownload, '_blank');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={baixando}
      className={`w-full bg-[#FF6B00] hover:bg-[#E66000] disabled:bg-slate-400 text-white font-black text-xl py-4 px-8 rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0px_4px_14px_rgba(255,107,0,0.4)] ${className}`}
    >
      <span className="material-symbols-outlined font-bold text-2xl">
        {baixando ? 'hourglass_empty' : 'download'}
      </span>
      {baixando ? 'BAIXANDO...' : 'DOWNLOAD'}
    </button>
  );
}