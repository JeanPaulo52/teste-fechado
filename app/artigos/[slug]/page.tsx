import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';
import { Metadata } from 'next';

// === AJUSTE OS CAMINHOS DE IMPORTAÇÃO CONFORME A SUA PASTA ===
import BotaoFavorito from '../../components/BotaoFavorito'; 
import Comentarios from '../../components/Comentarios';
import BotaoCompartilhar from '../../components/BotaoCompartilhar';

// === IMPORTAÇÕES DO FIREBASE ===
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getArtigoData(slug: string) {
  try {
    const fullPath = path.join(process.cwd(), 'conteudo/artigos', `${slug}.md`);
    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      
      const processedContent = await remark().use(html).process(content);
      const contentHtml = processedContent.toString();

      const imagensLista = data.imagens || (data.imagem ? [data.imagem] : []);

      return {
        slug,
        contentHtml,
        titulo: data.titulo || "Artigo Sem Título",
        descricao: data.descricao || "",
        imagens: imagensLista,
        dataPublicacao: data.data || null, 
        autorNome: data.autorNome || data.autor || null,
        autorFoto: data.autorFoto || data.foto || null,
        autorId: data.autorId || null,
        erro: false
      };
    }
  } catch (e) {
    // Ficheiro não existe localmente
  }

  // 2. BUSCA NO FIREBASE
  try {
    const docRef = doc(db, "artigos", slug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const textoFormatado = data.texto ? `<p>${data.texto.replace(/\n/g, '<br/><br/>')}</p>` : '';

      let dataPub = null;
      if (data.createdAt) {
        const dateObj = new Date(data.createdAt.seconds * 1000);
        dataPub = dateObj.toLocaleDateString('pt-BR');
      }

      // ✨ LÓGICA DINÂMICA DO AUTOR (Igual à das Atividades)
      let autorFinal = {
        nome: data.autorNome || "Professor(a) Parceiro(a)",
        foto: data.autorAvatar || null
      };

      if (data.autorId) {
        try {
          const userRef = doc(db, "users", data.autorId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            autorFinal.nome = userData.nome || userData.displayName || autorFinal.nome;
            autorFinal.foto = userData.fotoUrl || userData.photoURL || autorFinal.foto;
          }
        } catch (err) {
          console.error("Erro ao buscar perfil do autor:", err);
        }
      }

      return {
        slug,
        contentHtml: textoFormatado,
        titulo: data.titulo || "Artigo Sem Título",
        descricao: data.descricao || "", 
        imagens: data.capaUrl ? [data.capaUrl] : (data.imagemUrl ? [data.imagemUrl] : []),
        dataPublicacao: dataPub,
        autorNome: autorFinal.nome, // Variável atualizada
        autorFoto: autorFinal.foto, // Variável atualizada
        autorId: data.autorId || null,
        erro: false
      };
    }
  } catch (e) {
    console.error("Erro ao buscar artigo no Firebase:", e);
  }

  return { erro: true };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artigo = await getArtigoData(slug);
  if (artigo.erro) return { title: 'Artigo não encontrado' };
  
  return {
    title: `${artigo.titulo} | Artigos`,
    description: artigo.descricao,
    openGraph: {
      title: artigo.titulo,
      images: artigo.imagens.length > 0 ? [artigo.imagens[0]] : [], 
    }
  };
}

export default async function ArtigoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artigo = await getArtigoData(slug);

  if (artigo.erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold">Artigo não encontrado.</h1>
      </div>
    );
  }

  const imagemCapa = artigo.imagens.length > 0 ? artigo.imagens[0] : "";

  // === COMPONENTE: CARTÃO DO AUTOR ===
  const CartaoAutor = ({ className = "" }: { className?: string }) => {
    const nome = artigo.autorNome || "Professor(a) Parceiro(a)";
    const foto = artigo.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random&color=fff`;
    
    // Rota corrigida com o ID se ele existir
    const perfilUrl = artigo.autorId ? `/profile/${artigo.autorId}` : "#";

    return (
      <Link 
        href={perfilUrl}
        className={`flex items-center gap-4 group ${className}`}
      >
        <img 
          src={foto} 
          alt={`Foto de ${nome}`} 
          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-sm group-hover:border-blue-500 group-hover:scale-105 transition-all"
        />
        <div className="flex flex-col">
          <span className="text-base font-bold text-black group-hover:text-blue-600 transition-colors">
            {nome}
          </span>
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            {artigo.dataPublicacao ? `Publicado em ${artigo.dataPublicacao}` : "Autor(a) Parceiro(a)"}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans">
      
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-6 text-sm text-slate-500 max-w-3xl">
        <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Início</Link> 
        <span className="mx-2 text-slate-300">&gt;</span>
        <Link href="/artigos" className="hover:text-blue-600 transition-colors font-medium">Artigos</Link>
      </div>

      <main className="container mx-auto px-4 md:px-6 max-w-3xl">
        <article className="bg-white rounded-[2rem] border-2 border-black p-6 md:p-10 lg:p-12 shadow-[0px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-8 mb-12">
          
          <header className="flex flex-col gap-6 border-b-2 border-slate-100 pb-8">
            {/* ✨ break-words adicionado aqui no título por precaução */}
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-[1.15] tracking-tight break-words">
              {artigo.titulo}
            </h1>

            {artigo.descricao && (
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed break-words">
                {artigo.descricao}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
              <CartaoAutor />
              
              <div className="flex items-center gap-2 flex-shrink-0 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                <BotaoFavorito 
                  slug={slug} 
                  titulo={artigo.titulo} 
                  imagem={imagemCapa} 
                  tipo="artigos" 
                  variante="minimalista" 
                />
                <a href="#comentarios" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white hover:text-black hover:border-black border-2 border-transparent transition-all" title="Ver comentários">
                  <span className="material-symbols-outlined font-bold text-lg">chat_bubble</span>
                </a>
                <BotaoCompartilhar titulo={artigo.titulo} variante="minimalista" />
              </div>
            </div>
          </header>

          {artigo.imagens.length > 0 && (
            <figure className="w-full">
              <img 
                src={artigo.imagens[0]} 
                alt={`Capa do artigo: ${artigo.titulo}`}
                className="w-full max-h-[400px] object-cover rounded-3xl border-2 border-black bg-slate-100"
              />
            </figure>
          )}

          {/* ✨ break-words adicionado aqui para evitar que o texto saia da caixa */}
          <section 
            className="prose prose-lg md:prose-xl prose-slate max-w-none prose-headings:font-black prose-headings:text-black prose-p:text-slate-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-img:rounded-3xl prose-img:border-2 prose-img:border-black mt-4 break-words"
            dangerouslySetInnerHTML={{ __html: artigo.contentHtml || "" }} 
          />
        </article>

        <div className="scroll-mt-24" id="comentarios">
          <Comentarios slug={slug} tipo="artigos" />
        </div>
      </main>
    </div>
  );
}