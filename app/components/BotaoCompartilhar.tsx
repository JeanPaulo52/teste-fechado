"use client";

import { useState } from 'react';

interface BotaoCompartilharProps {
  titulo: string;
  variante?: 'padrao' | 'minimalista';
}

export default function BotaoCompartilhar({ 
  titulo, 
  variante = 'padrao' 
}: BotaoCompartilharProps) {
  const [copiado, setCopiado] = useState(false);

  const compartilhar = async () => {
    const urlDaPagina = window.location.href; 

    // Tenta usar a partilha nativa do telemóvel/browser
    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text: `Confira esta atividade: ${titulo}`,
          url: urlDaPagina,
        });
      } catch (error) {
        console.log("Partilha cancelada ou falhou", error);
      }
    } else {
      // Plano B: Copia o link para a área de transferência
      try {
        await navigator.clipboard.writeText(urlDaPagina);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch (error) {
        console.error("Erro ao copiar link", error);
      }
    }
  };

  // Definição dos estilos baseados na variante
  const classeMinimalista = "w-12 h-12 flex items-center justify-center border-2 border-black rounded-full bg-transparent hover:bg-slate-100 transition-colors active:scale-95 group";
  const classePadrao = "flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 group";

  return (
    <button 
      onClick={compartilhar}
      title="Partilhar atividade"
      className={variante === 'minimalista' ? classeMinimalista : classePadrao}
    >
      <span 
        className={`material-symbols-outlined font-bold transition-colors duration-300 ${
          copiado 
            ? 'text-green-500' 
            : variante === 'minimalista' 
              ? 'text-black' 
              : 'text-slate-400 group-hover:text-blue-500'
        }`}
      >
        {copiado ? 'check_circle' : 'share'}
      </span>

      {/* Mostra o texto apenas se não for minimalista */}
      {variante !== 'minimalista' && (
        <span className={`font-bold text-sm ${copiado ? 'text-green-500' : 'text-slate-700'}`}>
          {copiado ? 'Copiado!' : 'Partilhar'}
        </span>
      )}
    </button>
  );
}