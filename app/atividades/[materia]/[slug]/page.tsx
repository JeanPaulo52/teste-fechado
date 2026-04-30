import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';
import { Metadata } from 'next';
import CarrosselImagens from '../../../components/CarrosselImagens';
import BotaoFavorito from '../../../components/BotaoFavorito';
import Comentarios from '../../../components/Comentarios';
import BotaoCompartilhar from '../../../components/BotaoCompartilhar';
import BotaoDownload from '../../../components/BotaoDownload'; 

// === IMPORTAÇÕES DO FIREBASE ===
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getAtividadeData(materia: string, paramSlug: string) {
  // 🔥 O SEGREDO AQUI: Limpa a URL de caracteres como %20 ou %C3
  const slug = decodeURIComponent(paramSlug);
  
  console.log(`🔎 Buscando atividade: Materia [${materia}], Slug [${slug}]`);

  // 1. TENTA BUSCAR NO ARQUIVO LOCAL (.md)
  try {
    const fullPath = path.join(process.cwd(), 'conteudo/atividades', materia, `${slug}.md`);
    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      
      const processedContent = await remark().use(html).process(content);
      const contentHtml = processedContent.toString();

      const imagensLista = data.imagens || (data.imagem ? [data.imagem] : []);

      console.log(`✅ Encontrado LOCALMENTE (.md): ${slug}`);

      return {
        slug,
        materia,
        contentHtml,
        titulo: data.titulo || "Atividade Sem Título",
        descricao: data.descricao || "",
        imagens: imagensLista,
        pdf: data.pdf || null,
        idade: data.idade || null,
        habilidades: data.habilidades || null,
        materiais: data.materiais || null,
        autorNome: data.autorNome || data.autor || null,
        autorFoto: data.autorFoto || data.foto || null,
        erro: false
      };
    }
  } catch (e) {
    // Arquivo não existe localmente, seguimos a vida
  }

  // 2. SE NÃO ACHOU LOCAL, BUSCA NO FIREBASE
  try {
    // 🔥 Remove o "fb-" do slug se ele existir, para pegar o ID real do banco!
    const firebaseId = slug.startsWith('fb-') ? slug.replace('fb-', '') : slug;
    
    const docRef = doc(db, "atividades", firebaseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`🔥 Encontrado no FIREBASE: ${slug}`);
      const data = docSnap.data();
      const descFormatada = data.descricao ? `<p>${data.descricao.replace(/\n/g, '<br/>')}</p>` : '';

      // Fallback inicial
      let autorFinal = {
        nome: data.autorNome || "Professor Parceiro",
        foto: data.autorAvatar || null
      };

      // Busca dados atualizados do usuário
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
          console.error("⚠️ Erro ao buscar perfil do autor:", err);
        }
      }

      return {
        slug,
        materia: data.materia || materia,
        contentHtml: descFormatada,
        titulo: data.titulo || "Sem Título",
        descricao: data.descricao || "",
        imagens: data.imagemUrl ? [data.imagemUrl] : [],
        pdf: null, // Deixamos null pois não tem PDF, será baixada a imagem
        idade: data.idade || null,
        habilidades: data.habilidades || null,
        materiais: data.materiais || null,
        autorId: data.autorId || null,
        autorNome: autorFinal.nome, 
        autorFoto: autorFinal.foto, 
        erro: false
      };
    } else {
       console.log(`❌ Não encontrado no Firebase. O ID ${slug} realmente existe lá?`);
    }
  } catch (e) {
    console.error("🔥 Erro catastrófico ao buscar no Firebase:", e);
  }

  // 3. SE NÃO ACHOU EM LUGAR NENHUM
  return { erro: true };
}

export async function generateMetadata({ params }: { params: Promise<{ materia: string; slug: string }> }): Promise<Metadata> {
  const { materia, slug } = await params;
  const atividade = await getAtividadeData(materia, slug);
  if (atividade.erro) return { title: 'Atividade não encontrada' };
  
  return {
    title: `${atividade.titulo} | Atividade Adaptada`,
    description: atividade.descricao,
    openGraph: {
      title: atividade.titulo,
      images: atividade.imagens.length > 0 ? [atividade.imagens[0]] : [], 
    }
  };
}

export default async function AtividadePage({ params }: { params: Promise<{ materia: string; slug: string }> }) {
  const { materia, slug } = await params;
  const atividade = await getAtividadeData(materia, slug);

  if (atividade.erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-500">Atividade não encontrada. 😢</h1>
      </div>
    );
  }

  const nomeMateria = materia.charAt(0).toUpperCase() + materia.slice(1).replace('-', ' ');
  const imagemCapa = atividade.imagens.length > 0 ? atividade.imagens[0] : "";

  // =========================================================================
  // MINI-COMPONENTES
  // =========================================================================

  const CartaoAutor = ({ className = "" }: { className?: string }) => {
    const nome = atividade.autorNome || "Professor Parceiro";
    const foto = atividade.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random&color=fff`;
    
    const perfilUrl = atividade.autorId ? `/profile/${atividade.autorId}` : "#";

    return (
      <Link 
        href={perfilUrl}
        className={`bg-white rounded-3xl border-2 border-black p-5 flex items-center gap-4 shadow-sm transition-all hover:bg-slate-50 hover:border-blue-500 group ${className}`}
      >
        <img 
          src={foto} 
          alt={`Foto de ${nome}`} 
          className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
        />
        
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
            Enviado por
          </span>
          <span className="text-base font-bold text-black leading-tight group-hover:text-blue-600 transition-colors">
            {nome}
          </span>
        </div>

        <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-blue-500 transition-colors text-sm">
          arrow_forward_ios
        </span>
      </Link>
    );
  };

  const CartaoDetalhes = ({ className = "" }: { className?: string }) => (
    <div className={`bg-white rounded-3xl border-2 border-black p-6 md:p-8 h-fit shadow-sm ${className}`}>
      <h3 className="font-extrabold text-xl mb-6 text-black border-b-2 border-slate-100 pb-3">Detalhes</h3>
      <div className="space-y-5 text-sm">
        {atividade.idade && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 border border-orange-200">
              <span className="material-symbols-outlined text-orange-600 text-[20px]">face</span>
            </div>
            <div>
              <strong className="block text-black">Idade Recomendada</strong>
              <span className="text-slate-600">{atividade.idade}</span>
            </div>
          </div>
        )}
        {atividade.habilidades && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">psychology</span>
            </div>
            <div>
              <strong className="block text-black">Habilidades</strong>
              <span className="text-slate-600">{atividade.habilidades}</span>
            </div>
          </div>
        )}
        {atividade.materiais && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border border-green-200">
              <span className="material-symbols-outlined text-green-600 text-[20px]">architecture</span>
            </div>
            <div>
              <strong className="block text-black">Materiais</strong>
              <span className="text-slate-600">{atividade.materiais}</span>
            </div>
          </div>
        )}
        {!atividade.idade && !atividade.habilidades && !atividade.materiais && (
           <div className="text-slate-500 italic">Nenhum detalhe adicional informado.</div>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // RENDERIZAÇÃO DA PÁGINA
  // =========================================================================

  // ✨ Lógica para descobrir o que baixar
  const urlDownload = atividade.pdf || (atividade.imagens?.length > 0 ? atividade.imagens[0] : null);
  const ehPdf = !!atividade.pdf;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-4 text-sm text-slate-500 max-w-6xl">
        <Link href="/" className="hover:text-blue-600 transition-colors">Início</Link> <span className="mx-2">&gt;</span>
        <Link href="/atividades" className="hover:text-blue-600 transition-colors">Atividades</Link> <span className="mx-2">&gt;</span>
        <Link href={`/atividades/${materia}`} className="hover:text-blue-600 transition-colors">{nomeMateria}</Link>
      </div>

      <main className="container mx-auto px-4 md:px-6 max-w-6xl mt-2">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          <div className="flex-1 space-y-6 flex flex-col">
            
            {/* 🌟 NOVO CONTAINER UNIFICADO (Postagem + Descrição) 🌟 */}
            <div className="order-1 bg-white rounded-3xl border-2 border-black shadow-sm flex flex-col overflow-hidden">
              
              {/* Parte 1: Cabeçalho e Imagem */}
              <div className="p-5 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                    {atividade.titulo}
                  </h1>
                  <div className="flex items-center gap-3">
                    <BotaoFavorito slug={slug} titulo={atividade.titulo} imagem={imagemCapa} materia={materia} variante="minimalista" tipo="atividades" />
                    <a href="#comentarios" className="w-12 h-12 flex items-center justify-center border-2 border-black rounded-full text-black hover:bg-slate-100 transition-colors active:scale-95" title="Ver comentários">
                      <span className="material-symbols-outlined font-bold text-xl">chat_bubble</span>
                    </a>
                    <BotaoCompartilhar titulo={atividade.titulo} variante="minimalista" />
                  </div>
                </div>

                <div className="relative border-2 border-black rounded-2xl overflow-hidden bg-slate-100">
                  <CarrosselImagens imagens={atividade.imagens} titulo={atividade.titulo} />
                </div>

                {/* Botão de Download na versão Mobile */}
                {urlDownload && (
                  <div className="flex justify-center mt-4 lg:hidden">
                    <BotaoDownload urlParaDownload={urlDownload} titulo={atividade.titulo} isPdf={ehPdf} />
                  </div>
                )}
              </div>

              {/* Parte 2: Descrição (Agora dentro do mesmo bloco) */}
              <div className="p-5 md:p-8 border-t-2 border-slate-100 bg-white">
                <h3 className="font-extrabold text-xl mb-6 text-black border-b-2 border-slate-100 pb-3">Descrição</h3>
                <div 
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-black prose-p:leading-relaxed text-slate-700 text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: atividade.contentHtml || "" }} 
                />
              </div>
            </div>
            {/* 🌟 FIM DO CONTAINER UNIFICADO 🌟 */}

            <CartaoAutor className="order-3 lg:hidden" />
            <CartaoDetalhes className="order-4 lg:hidden" />

            <div className="order-5 scroll-mt-24 pt-2" id="comentarios">
              <Comentarios slug={slug} tipo="atividades" />
            </div>
          </div>

          <aside className="hidden lg:block lg:w-[320px] xl:w-[360px] flex-shrink-0">
            <div className="sticky top-28 space-y-6">
              {/* Botão de Download na versão Desktop (Aside) */}
              {urlDownload && <BotaoDownload urlParaDownload={urlDownload} titulo={atividade.titulo} isPdf={ehPdf} />}
              <CartaoAutor />
              <CartaoDetalhes />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}