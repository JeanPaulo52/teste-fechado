'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export default function CarrosselInstagram() {
  // Lista das páginas da atividade
  const paginas = [
    '/Atividade_Missao_Impacto_Pg1.webp',
    '/Atividade_Missao_Impacto_Pg2.webp',
    '/Atividade_Missao_Impacto_Pg3.webp' // Adicione quantas quiser
  ];

  const [paginaAtual, setPaginaAtual] = useState(0);
  const carrosselRef = useRef<HTMLDivElement>(null);

  // Atualiza a bolinha (dot) quando o usuário arrasta a foto pelo celular
  const handleScroll = () => {
    if (carrosselRef.current) {
      const scrollPos = carrosselRef.current.scrollLeft;
      const largura = carrosselRef.current.clientWidth;
      const indexAtual = Math.round(scrollPos / largura);
      setPaginaAtual(indexAtual);
    }
  };

  // Função para os botões de seta (Desktop)
  const rolarPara = (index: number) => {
    if (carrosselRef.current) {
      const largura = carrosselRef.current.clientWidth;
      carrosselRef.current.scrollTo({
        left: largura * index,
        behavior: 'smooth'
      });
      setPaginaAtual(index);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      
      {/* CONTAINER DAS IMAGENS (Arrastável) */}
      <div 
        ref={carrosselRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {paginas.map((pagina, index) => (
          <div key={index} className="w-full flex-shrink-0 snap-center relative aspect-[1/1.414]">
            <Image 
              src={pagina} 
              alt={`Página ${index + 1}`} 
              fill 
              className="object-cover"
              priority={index === 0} // Carrega a primeira foto mais rápido
            />
          </div>
        ))}
      </div>

      {/* BOTÃO VOLTAR (Só aparece se não for a primeira foto) */}
      {paginaAtual > 0 && (
        <button 
          onClick={() => rolarPara(paginaAtual - 1)}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-8 h-8 flex items-center justify-center rounded-full shadow backdrop-blur-sm transition-all"
          title="Página anterior"
        >
          &#10094;
        </button>
      )}

      {/* BOTÃO AVANÇAR (Só aparece se não for a última foto) */}
      {paginaAtual < paginas.length - 1 && (
        <button 
          onClick={() => rolarPara(paginaAtual + 1)}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-8 h-8 flex items-center justify-center rounded-full shadow backdrop-blur-sm transition-all"
          title="Próxima página"
        >
          &#10095;
        </button>
      )}

      {/* BOLINHAS (Indicadores de página estilo Instagram) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {paginas.map((_, index) => (
          <button
            key={index}
            onClick={() => rolarPara(index)}
            className={`transition-all duration-300 rounded-full ${
              paginaAtual === index 
                ? 'bg-blue-500 w-4 h-2' // Bolinha ativa (fica mais larguinha e azul)
                : 'bg-white/70 w-2 h-2 hover:bg-white' // Bolinhas inativas
            }`}
            aria-label={`Ir para página ${index + 1}`}
          />
        ))}
      </div>
      
    </div>
  );
}