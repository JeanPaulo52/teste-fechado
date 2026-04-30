import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import FeedPrincipal from '../components/FeedPrincipal';
import { db } from '../lib/firebase';
// ✨ ADICIONAMOS 'doc' e 'getDoc' AQUI também!
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const IMAGEM_PADRAO_ARTIGO = "https://placehold.co/600x600/e2e8f0/475569?text=Artigo";

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

async function getConteudoFirebase() {
  const itens: any[] = [];
  try {
    const snapAtividades = await getDocs(collection(db, "atividades"));
    // Trocamos 'doc' por 'documento' aqui para não dar conflito com a função doc() do Firebase
    snapAtividades.forEach(documento => {
      const d = documento.data();
      itens.push({
        tipo: 'atividade',
        id: documento.id,
        slug: documento.id,
        materia: d.materia || 'geral',
        titulo: d.titulo || d.descricao || "Sem título",
        descricao: d.descricao || "",
        imagemCapa: d.imagemUrl || d.imagens?.[0] || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : (d.data ? new Date(d.data).getTime() : Date.now())
      });
    });

    const snapArtigos = await getDocs(collection(db, "artigos"));
    snapArtigos.forEach(documento => {
      const d = documento.data();
      itens.push({
        tipo: 'artigo',
        id: documento.id,
        slug: documento.id,
        titulo: d.titulo || "Artigo Sem Título",
        descricao: d.descricao || "",
        imagemCapa: d.capaUrl || d.imagemUrl || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()
      });
    });

    // ✨ MAGIA AQUI TAMBÉM: Agora a pesquisa busca a foto do autor!
    const snapMomentos = await getDocs(collection(db, "momentos"));
    const promessasMomentos = snapMomentos.docs.map(async (documento) => {
      const d = documento.data();
      let nomeFinal = d.autorNome || "Professor(a)";
      let avatarFinal = d.autorAvatar || null;

      if (d.autorId) {
        try {
          const userRef = doc(db, "users", d.autorId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            nomeFinal = userData.nome || userData.displayName || nomeFinal;
            avatarFinal = userData.fotoUrl || userData.photoURL || avatarFinal;
          }
        } catch (e) {
          console.error("Erro ao buscar perfil na pesquisa:", e);
        }
      }

      return {
        tipo: 'momento',
        id: documento.id,
        slug: documento.id,
        descricao: d.descricao || d.texto || "",
        imagens: d.imagens || (d.imagemUrl ? [d.imagemUrl] : []),
        autorNome: nomeFinal,
        // Garante que se não tiver foto de jeito nenhum, coloca as iniciais como antes!
        autorAvatar: avatarFinal || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeFinal)}&background=random&color=fff`,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()
      };
    });

    // Esperamos todos os momentos buscarem as fotos e então juntamos com os itens
    const momentosResolvidos = await Promise.all(promessasMomentos);
    itens.push(...momentosResolvidos);

  } catch (error) {
    console.error("Erro ao buscar no Firebase:", error);
  }
  return itens;
}

const normalizarTexto = (texto: string) => {
  if (!texto) return '';
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default async function PesquisaPage({ searchParams }: any) {
  const params = await searchParams; 
  const queryParam = params?.q || '';
  
  const itensLocais = getConteudoLocal();
  const itensFirebase = await getConteudoFirebase();
  const todosOsItens = [...itensFirebase, ...itensLocais].sort((a, b) => b.dataCriacao - a.dataCriacao);

  let itensFiltrados: any[] = [];

  if (queryParam.trim() !== '') {
    const queryNormalizada = normalizarTexto(queryParam);
    const palavrasChave = queryNormalizada.split(' ').filter(p => p.length > 2);

    itensFiltrados = todosOsItens.filter(item => {
      const textoCompleto = normalizarTexto(
        `${item.titulo || ''} ${item.descricao || ''} ${item.materia || ''} ${item.autorNome || ''}`
      );
      if (textoCompleto.includes(queryNormalizada)) return true;
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
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Pesquisa em Branco</h1>
        ) : (
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Resultados para: <span className="text-blue-600 bg-blue-50 px-2 rounded-lg">"{queryParam}"</span>
          </h1>
        )}
        <p className="text-slate-500 font-medium">
          {queryParam.trim() === '' 
            ? "Digite algo na barra de pesquisa para encontrar conteúdos."
            : `Encontramos ${itensFiltrados.length} resultados relacionados à sua busca.`}
        </p>
      </section>

      <main className="container mx-auto px-4 md:px-6 max-w-[1400px]">
        {itensFiltrados.length > 0 ? (
          <FeedPrincipal itensLocais={itensFiltrados} modoPesquisa={true} />
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-3xl mx-auto mt-8">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
              {queryParam.trim() === '' ? 'keyboard' : 'travel_explore'}
            </span>
            <p className="text-slate-600 font-bold text-xl mb-2">
              {queryParam.trim() === '' ? 'O que você está procurando?' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}