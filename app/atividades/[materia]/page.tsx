import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Metadata } from 'next';

// 👇 NOVOS IMPORTS DO FIREBASE PARA O SISTEMA MISTO
import { db } from '../../lib/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic'; // Garante que a página sempre busque postagens novas do Firebase

// Formata o nome da matéria para ficar bonito no título (ex: 'matematica' -> 'Matemática')
const formatarNomeMateria = (materia: string) => {
  const nomesEspeciais: Record<string, string> = {
    'matematica': 'Matemática',
    'portugues': 'Português',
    'historia': 'História',
    'geografia': 'Geografia',
    'ciencias': 'Ciências',
    'artes': 'Artes',
    'educacao-fisica': 'Educação Física',
    'ingles': 'Inglês'
  };
  return nomesEspeciais[materia] || materia.charAt(0).toUpperCase() + materia.slice(1);
};

// Gera os metadados para SEO dinamicamente
export async function generateMetadata({ params }: { params: Promise<{ materia: string }> }): Promise<Metadata> {
  const { materia } = await params;
  return {
    title: `Atividades de ${formatarNomeMateria(materia)} | Nosso Site`,
    description: `Explore nossa galeria de atividades de ${formatarNomeMateria(materia)}.`,
  };
}

// 1. FUNÇÃO: Busca as atividades LOCAIS (.md) - SEO Antigo
function getAtividadesLocais(materia: string) {
  const directory = path.join(process.cwd(), 'conteudo/atividades', materia);
  let atividades: any[] = [];

  try {
    if (!fs.existsSync(directory)) return [];

    const files = fs.readdirSync(directory);
    
    files.forEach((file) => {
      if (file.endsWith('.md')) {
        const filePath = path.join(directory, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        
        const slug = file.replace(/\.md$/, '');
        const imagemCapa = data.imagens && data.imagens.length > 0 ? data.imagens[0] : (data.imagem || "");

        if (imagemCapa) { 
          atividades.push({
            slug,
            titulo: data.titulo || "Sem título",
            imagemCapa,
            materia,
            origem: "local" // Identificador para debugar
          });
        }
      }
    });
  } catch (error) {
    console.error(`Erro ao buscar atividades locais de ${materia}:`, error);
  }

  return atividades.reverse(); 
}

// 2. FUNÇÃO: Busca as atividades NOVAS no FIREBASE
async function getAtividadesFirebase(materia: string) {
  let atividades: any[] = [];
  
  try {
    const q = query(collection(db, "atividades"), where("materia", "==", materia));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Montamos o objeto igual ao local para a tela não perceber a diferença
      atividades.push({
        slug: doc.id, // No Firebase, o ID do documento atua como "slug" da URL
        titulo: data.titulo || "Sem título",
        imagemCapa: data.imagemUrl || "", 
        materia: data.materia || materia,
        origem: "firebase"
      });
    });
  } catch (error) {
    console.error(`Erro ao buscar atividades do Firebase para ${materia}:`, error);
  }
  
  return atividades;
}

export default async function MateriaPage({ params }: { params: Promise<{ materia: string }> }) {
  const { materia } = await params;
  
  // 3. EXECUTA AS DUAS BUSCAS
  const atividadesLocais = getAtividadesLocais(materia);
  const atividadesFirebase = await getAtividadesFirebase(materia);
  
  // 4. JUNTA TUDO EM UMA LISTA SÓ (Firebase primeiro, Locais depois)
  const todasAtividades = [...atividadesFirebase, ...atividadesLocais];
  
  const nomeMateriaFormatado = formatarNomeMateria(materia);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* NAVEGAÇÃO DE TOPO (BREADCRUMB) */}
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-4 text-sm text-slate-500 max-w-7xl">
        <Link href="/" className="hover:text-blue-600 transition-colors">Início</Link> <span className="mx-2">&gt;</span>
        <Link href="/atividades" className="hover:text-blue-600 transition-colors">Disciplinas</Link> <span className="mx-2">&gt;</span>
        <span className="font-medium text-slate-800">{nomeMateriaFormatado}</span>
      </div>

      {/* CABEÇALHO DO CATÁLOGO DA MATÉRIA */}
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-8">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 text-center mb-4">
          {nomeMateriaFormatado}
        </h1>
        <p className="text-slate-500 text-center text-lg max-w-2xl mx-auto mb-10">
          Inspirações e atividades visuais de {nomeMateriaFormatado.toLowerCase()}. Clique na imagem para ver os detalhes completos.
        </p>

        {/* GRADE ESTILO PINTEREST (MASONRY) */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
          
          {todasAtividades.map((atividade) => (
  <div key={`${atividade.origem}-${atividade.slug}`} className="break-inside-avoid">
              <Link href={`/atividades/${atividade.materia}/${atividade.slug}`}>
                <div className="relative group rounded-2xl overflow-hidden bg-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                  
                  <img 
                    src={atividade.imagemCapa} 
                    alt={atividade.titulo} 
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 sm:p-5">
                    <h2 className="text-white font-bold text-sm sm:text-base leading-tight">
                      {atividade.titulo}
                    </h2>
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] font-bold">
                      open_in_new
                    </span>
                  </div>

                </div>
              </Link>
            </div>
          ))}

        </div>

        {todasAtividades.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto mt-8">
            <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">inventory_2</span>
            <p className="text-lg font-medium">Nenhuma atividade com imagem encontrada em {nomeMateriaFormatado}.</p>
            <p className="text-sm mt-1">Adicione arquivos no Firebase ou .md na pasta <code>conteudo/atividades/{materia}</code>.</p>
          </div>
        )}

      </div>
    </div>
  );
}