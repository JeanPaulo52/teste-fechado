import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import FeedPrincipal from '../components/FeedPrincipal'; // Ajuste se a pasta for outra
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const IMAGEM_PADRAO_ARTIGO = "https://placehold.co/600x600/e2e8f0/475569?text=Artigo";

// 1. FUNÇÃO PARA BUSCAR DADOS LOCAIS
function getConteudoLocal() {
  const conteudo: any[] = [];

  const atividadesPath = path.join(process.cwd(), 'conteudo/atividades');
  if (fs.existsSync(atividadesPath)) {
    const materias = fs.readdirSync(atividadesPath);
    materias.forEach(materia => {
      const materiaPath = path.join(atividadesPath, materia);
      if (fs.statSync(materiaPath).isDirectory()) {
        const files = fs.readdirSync(materiaPath);
        files.forEach(file => {
          if (file.endsWith('.md')) {
            const fileContents = fs.readFileSync(path.join(materiaPath, file), 'utf8');
            const { data } = matter(fileContents);
            conteudo.push({
              tipo: 'atividade',
              id: `local-ativ-${materia}-${file}`,
              slug: file.replace(/\.md$/, ''),
              materia,
              titulo: data.titulo || "Sem título",
              descricao: data.descricao || "", 
              imagemCapa: data.imagens?.[0] || data.imagem || IMAGEM_PADRAO_ARTIGO,
              isFirebase: false,
              dataCriacao: data.data ? new Date(data.data).getTime() : Date.now()
            });
          }
        });
      }
    });
  }

  const artigosPath = path.join(process.cwd(), 'conteudo/artigos');
  if (fs.existsSync(artigosPath)) {
    const files = fs.readdirSync(artigosPath);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const fileContents = fs.readFileSync(path.join(artigosPath, file), 'utf8');
        const { data } = matter(fileContents);
        conteudo.push({
          tipo: 'artigo',
          id: `local-art-${file}`,
          slug: file.replace(/\.md$/, ''),
          titulo: data.titulo || "Artigo Sem Título",
          descricao: data.descricao || data.resumo || "", 
          imagemCapa: data.imagens?.[0] || data.imagem || IMAGEM_PADRAO_ARTIGO,
          autorNome: data.autorNome || data.autor || "Equipe",
          isFirebase: false,
          dataCriacao: data.data ? new Date(data.data).getTime() : Date.now()
        });
      }
    });
  }

  return conteudo;
}

// 2. FUNÇÃO PARA BUSCAR FIREBASE
async function getConteudoFirebase() {
  const itens: any[] = [];
  try {
    const snapAtividades = await getDocs(collection(db, "atividades"));
    snapAtividades.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'atividade',
        id: doc.id,
        slug: doc.id,
        materia: d.materia || 'geral',
        titulo: d.titulo || d.descricao || "Sem título",
        descricao: d.descricao || "",
        imagemCapa: d.imagemUrl || d.imagens?.[0] || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        autorAvatar: d.autorAvatar,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : (d.data ? new Date(d.data).getTime() : Date.now())
      });
    });

    const snapArtigos = await getDocs(collection(db, "artigos"));
    snapArtigos.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'artigo',
        id: doc.id,
        slug: doc.id,
        titulo: d.titulo || "Artigo Sem Título",
        descricao: d.descricao || "",
        imagemCapa: d.capaUrl || d.imagemUrl || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        autorAvatar: d.autorAvatar,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()
      });
    });

    const snapMomentos = await getDocs(collection(db, "postagens"));
    snapMomentos.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'momento',
        id: doc.id,
        slug: doc.id,
        descricao: d.descricao || d.texto || "",
        imagens: d.imagens || (d.imagemUrl ? [d.imagemUrl] : []),
        autorNome: d.autorNome,
        autorAvatar: d.autorAvatar,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()
      });
    });
  } catch (error) {
    console.error("Erro ao buscar conteúdo do Firebase:", error);
  }
  return itens;
}

// 3. FUNÇÃO DE NORMALIZAÇÃO DE TEXTO
const normalizarTexto = (texto: string) => {
  if (!texto) return '';
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// 4. PÁGINA PRINCIPAL DE PESQUISA
// Adicionamos a tipagem "any" e o "await" para garantir que leia a URL no Next.js 13, 14 e 15+
export default async function PesquisaPage({ searchParams }: any) {
  
  // O SEGREDO ESTÁ AQUI: Aguardamos os parâmetros carregarem para evitar que fique em branco!
  const params = await searchParams; 
  const queryParam = params?.q || '';
  
  // Busca tudo
  const itensLocais = getConteudoLocal();
  const itensFirebase = await getConteudoFirebase();
  const todosOsItens = [...itensFirebase, ...itensLocais].sort((a, b) => b.dataCriacao - a.dataCriacao);

  let itensFiltrados: any[] = [];

  // SÓ FILTRA SE A PESQUISA NÃO ESTIVER VAZIA
  if (queryParam.trim() !== '') {
    const queryNormalizada = normalizarTexto(queryParam);
    const palavrasChave = queryNormalizada.split(' ').filter(p => p.length > 2);

    itensFiltrados = todosOsItens.filter(item => {
      // Junta título, descrição, matéria e autor num textão só
      const textoCompleto = normalizarTexto(
        `${item.titulo || ''} ${item.descricao || ''} ${item.materia || ''} ${item.autorNome || ''}`
      );

      // Se achar a frase exata
      if (textoCompleto.includes(queryNormalizada)) return true;
      
      // Se achar pelo menos uma palavra-chave principal
      if (palavrasChave.length > 0) {
        return palavrasChave.some(palavra => textoCompleto.includes(palavra));
      }
      
      return false;
    });
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans">
      <section className="pt-12 pb-10 px-4 text-center">
        {queryParam.trim() === '' ? (
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Pesquisa em Branco
          </h1>
        ) : (
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Resultados para: <span className="text-blue-600 bg-blue-50 px-2 rounded-lg">"{queryParam}"</span>
          </h1>
        )}
        
        <p className="text-slate-500 font-medium">
          {queryParam.trim() === '' 
            ? "Digite algo na barra de pesquisa para encontrar atividades e artigos."
            : `Encontramos ${itensFiltrados.length} resultados relacionados à sua busca.`}
        </p>
      </section>

      <main className="container mx-auto px-4 md:px-6 max-w-[1400px]">
        {itensFiltrados.length > 0 ? (
          <FeedPrincipal itensLocais={itensFiltrados} />
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-3xl mx-auto mt-8">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
              {queryParam.trim() === '' ? 'keyboard' : 'travel_explore'}
            </span>
            <p className="text-slate-600 font-bold text-xl mb-2">
              {queryParam.trim() === '' ? 'O que você está procurando?' : 'Nenhum resultado encontrado'}
            </p>
            <p className="text-slate-400 font-medium">
              {queryParam.trim() === '' 
                ? 'Use a barra de pesquisa no topo da página.' 
                : 'Tente buscar usando palavras diferentes, como "Geografia" ou "Matemática".'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}