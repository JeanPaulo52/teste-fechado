import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artigos e Leituras | Nosso Site',
  description: 'Explore nossos artigos, dicas e textos educativos.',
};

// Imagem padrão à prova de falhas (um quadrado cinza escrito "Artigo").
// Quando quiser usar sua própria imagem, coloque ela na pasta "public" e mude aqui para:
// const IMAGEM_PADRAO = "/capa-padrao.jpg";
const IMAGEM_PADRAO = "https://placehold.co/600x600/e2e8f0/475569?text=Artigo";

function getTodosArtigos() {
  const directory = path.join(process.cwd(), 'conteudo/artigos');
  let artigos: any[] = [];

  try {
    if (!fs.existsSync(directory)) {
      return [];
    }

    const files = fs.readdirSync(directory);
    
    files.forEach((file) => {
      if (file.endsWith('.md')) {
        const filePath = path.join(directory, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        
        const slug = file.replace(/\.md$/, '');
        const imagemCapa = data.imagens && data.imagens.length > 0 ? data.imagens[0] : (data.imagem || null);

        artigos.push({
          slug,
          titulo: data.titulo || "Artigo Sem Título",
          imagemCapa: imagemCapa || IMAGEM_PADRAO,
          descricao: data.descricao || "",
          autorNome: data.autorNome || data.autor || "Equipe",
          dataPublicacao: data.data || ""
        });
      }
    });
  } catch (error) {
    console.error("Erro ao buscar artigos:", error);
  }

  return artigos.reverse(); 
}

export default function CatalogoArtigosPage() {
  const artigos = getTodosArtigos();

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-8">
        

        {/* GRADE DE ARTIGOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          
          {artigos.map((artigo) => (
            <Link key={artigo.slug} href={`/artigos/${artigo.slug}`}>
              
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-300 flex flex-col group h-full">
                
                {/* ÁREA DA IMAGEM QUADRADA */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-100 border-b-2 border-slate-100">
                  <img 
                    src={artigo.imagemCapa} 
                    alt={artigo.titulo} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Etiqueta pequena indicando que é um artigo */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black text-slate-700 uppercase tracking-wider shadow-sm border border-slate-100">
                    Artigo
                  </div>
                </div>

                {/* ÁREA DO TEXTO */}
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-base md:text-lg text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3 mb-3">
                    {artigo.titulo}
                  </h2>
                  
                  {/* Informações do autor no rodapé do card */}
                  <div className="mt-auto flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    <span className="truncate max-w-[120px]">{artigo.autorNome}</span>
                  </div>
                </div>

              </div>

            </Link>
          ))}

        </div>

        {artigos.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto mt-8">
            <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">article</span>
            <p className="text-lg font-medium">Nenhum artigo encontrado.</p>
            <p className="text-sm mt-1">Adicione arquivos .md na pasta <code>conteudo/artigos</code>.</p>
          </div>
        )}

      </div>
    </div>
  );
}