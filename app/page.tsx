import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import FeedPrincipal from './components/FeedPrincipal'; 

// 👇 IMPORTS NOVOS DO NEXT E FIREBASE
import { cookies } from 'next/headers';
import { db } from './lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const IMAGEM_PADRAO_ARTIGO = "https://placehold.co/600x600/e2e8f0/475569?text=Artigo";

function getConteudoLocal() {
  const conteudo: any[] = [];

  // 1. ATIVIDADES LOCAIS
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
              imagemCapa: data.imagens?.[0] || data.imagem || IMAGEM_PADRAO_ARTIGO,
              isFirebase: false,
              dataCriacao: data.data ? new Date(data.data).getTime() : Date.now()
            });
          }
        });
      }
    });
  }

  // 2. ARTIGOS LOCAIS
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
    // --- BUSCAR ATIVIDADES ---
    const snapAtividades = await getDocs(collection(db, "atividades"));
    snapAtividades.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'atividade',
        id: doc.id, 
        slug: doc.id,
        materia: d.materia || 'geral',
        titulo: d.titulo || d.descricao || "Sem título",
        imagemCapa: d.imagemUrl || d.imagens?.[0] || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        autorAvatar: d.autorAvatar,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : (d.data ? new Date(d.data).getTime() : Date.now())
      });
    });

    // --- BUSCAR ARTIGOS ---
    const snapArtigos = await getDocs(collection(db, "artigos"));
    snapArtigos.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'artigo',
        id: doc.id,
        slug: doc.id,
        titulo: d.titulo || "Artigo Sem Título",
        imagemCapa: d.capaUrl || d.imagemUrl || IMAGEM_PADRAO_ARTIGO,
        autorNome: d.autorNome || "Professor(a)",
        autorAvatar: d.autorAvatar,
        autorId: d.autorId,
        isFirebase: true,
        dataCriacao: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()
      });
    });

    // --- BUSCAR MOMENTOS / POSTAGENS ---
    const snapMomentos = await getDocs(collection(db, "postagens"));
    snapMomentos.forEach(doc => {
      const d = doc.data();
      itens.push({
        tipo: 'momento',
        id: doc.id, 
        slug: doc.id,
        descricao: d.descricao || d.texto,
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

export default async function HomePage() {
  const itensLocais = getConteudoLocal();
  const itensFirebase = await getConteudoFirebase();
  const todosOsItens = [...itensFirebase, ...itensLocais];

  // =========================================================
  // ✨ ALGORITMO DE RECOMENDAÇÃO (O CÉREBRO) ✨
  // =========================================================

  let interessesUsuario: Record<string, number> = {};
  
  // 1. Lê o "crachá" (Cookie) do navegador
  const cookieStore = await cookies();
  const userIdLogado = cookieStore.get('user_uid')?.value;

  // 2. Se o professor estiver logado, busca o perfil dele
  if (userIdLogado) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userIdLogado));
      if (userDoc.exists() && userDoc.data().interesses) {
        interessesUsuario = userDoc.data().interesses;
      }
    } catch (err) {
      console.error("Erro ao buscar perfil do usuário", err);
    }
  }

  // 3. Calcula os pontos de cada atividade
  const itensOrdenados = todosOsItens.map(item => {
    let score = item.dataCriacao; // Começa valendo a data em milissegundos

    if (item.materia) {
      // Deixa a matéria minúscula para não dar erro (ex: Matemática vs matematica)
      const materiaFormatada = item.materia.toLowerCase().trim();
      
      // Se ele tem pontos nessa matéria, a gente empurra a atividade para cima!
      if (interessesUsuario[materiaFormatada]) {
        const pontosDeInteresse = interessesUsuario[materiaFormatada];
        
        // Cada curtida equivale a "voltar no tempo" em 2 dias (vence atividades de outras matérias)
        const bonusDePontos = pontosDeInteresse * (1000 * 60 * 60 * 24 * 2); 
        score += bonusDePontos;
      }
    }

    return { ...item, algorithmScore: score };
  });

  // 4. Ordena do maior Score para o menor
  itensOrdenados.sort((a, b) => b.algorithmScore - a.algorithmScore);

  // =========================================================

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans">
      <div className="h-6"></div> 
{/* h-6 cria um espaço vertical de 24 pixels. Você pode testar h-4 (menor) ou h-8 (maior) */}

      <main className="container mx-auto px-4 md:px-6 max-w-[1400px]">
        {/* Passamos a lista misturada, pontuada e ordenada para o Feed */}
        <FeedPrincipal itensLocais={itensOrdenados} />
      </main>
    </div>
  );
}