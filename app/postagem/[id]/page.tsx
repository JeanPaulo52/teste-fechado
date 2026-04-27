import Link from 'next/link';
import { Metadata } from 'next';

// === SEUS COMPONENTES (Caminhos ajustados para a pasta da postagem) ===
import CarrosselImagens from '../../components/CarrosselImagens';
import BotaoFavorito from '../../components/BotaoFavorito';
import Comentarios from '../../components/Comentarios';
import BotaoCompartilhar from '../../components/BotaoCompartilhar';

// === IMPORTAÇÕES DO FIREBASE ===
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Função para buscar os dados do momento no Firebase
async function getPostagemData(paramId: string) {
  try {
    // Limpamos o ID para evitar erros de cache
    const firebaseId = paramId.startsWith('fb-mom-') ? paramId.replace('fb-mom-', '') : paramId;
    
    const docRef = doc(db, "momentos", firebaseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Formata as quebras de linha para o HTML entender
      const descFormatada = data.descricao ? `<p>${data.descricao.replace(/\n/g, '<br/>')}</p>` : '';

      // Fallback inicial do autor
      let autorFinal = {
        nome: data.autorNome || "Professor",
        foto: data.autorAvatar || null
      };

      // Busca dados atualizados do usuário (igual você faz nas atividades)
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
        id: firebaseId,
        contentHtml: descFormatada,
        descricao: data.descricao || "",
        imagens: data.imagens || [],
        autorId: data.autorId || null,
        autorNome: autorFinal.nome, 
        autorFoto: autorFinal.foto, 
        erro: false
      };
    } else {
       console.log(`❌ Não encontrado no Firebase. O ID ${firebaseId} realmente existe lá?`);
    }
  } catch (e) {
    console.error("🔥 Erro ao buscar no Firebase:", e);
  }

  return { erro: true };
}

// Gera as tags para o link ficar bonito quando compartilhado no WhatsApp
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const postagem = await getPostagemData(id);
  
  if (postagem.erro) return { title: 'Postagem não encontrada' };
  
  return {
    title: `Postagem de ${postagem.autorNome}`,
    description: postagem.descricao.substring(0, 150) + "...",
    openGraph: {
      title: `Postagem de ${postagem.autorNome}`,
      images: postagem.imagens.length > 0 ? [postagem.imagens[0]] : [], 
    }
  };
}

export default async function PaginaMomento({ params }: { params: Promise<{ id: string }> }) {
  // Desempacotando o ID (Next.js 15)
  const { id } = await params;
  const postagem = await getPostagemData(id);

  if (postagem.erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-500">Postagem não encontrada. 😢</h1>
      </div>
    );
  }

  const imagemCapa = postagem.imagens.length > 0 ? postagem.imagens[0] : "";
  const tituloPostagem = `Postagem de ${postagem.autorNome}`;

  // =========================================================================
  // MINI-COMPONENTE DO AUTOR (Idêntico ao seu!)
  // =========================================================================

  const CartaoAutor = ({ className = "" }: { className?: string }) => {
    const nome = postagem.autorNome;
    const foto = postagem.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random&color=fff`;
    const perfilUrl = postagem.autorId ? `/profile/${postagem.autorId}` : "#";

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
            Publicado por
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

  // =========================================================================
  // RENDERIZAÇÃO DA PÁGINA
  // =========================================================================

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Navegação de Topo */}
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-4 text-sm text-slate-500 max-w-6xl">
        <Link href="/" className="hover:text-blue-600 transition-colors">Início</Link> <span className="mx-2">&gt;</span>
        <span className="text-slate-800 font-medium">Postagem</span>
      </div>

      <main className="container mx-auto px-4 md:px-6 max-w-6xl mt-2">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Lado Esquerdo (Conteúdo Principal) */}
          <div className="flex-1 space-y-6 flex flex-col">
            
            {/* Bloco de Imagens e Ações */}
            <div className="order-1 bg-white rounded-3xl border-2 border-black p-5 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  {tituloPostagem}
                </h1>
                
                {/* Seus botões de ação! */}
                <div className="flex items-center gap-3">
                  <BotaoFavorito slug={postagem.id || ""} titulo={tituloPostagem} imagem={imagemCapa} materia="gerais" variante="minimalista" tipo="momentos" />
                  <a href="#comentarios" className="w-12 h-12 flex items-center justify-center border-2 border-black rounded-full text-black hover:bg-slate-100 transition-colors active:scale-95" title="Ver comentários">
                    <span className="material-symbols-outlined font-bold text-xl">chat_bubble</span>
                  </a>
                  <BotaoCompartilhar titulo={tituloPostagem} variante="minimalista" />
                </div>
              </div>

              {/* Só mostra o carrossel se a postagem tiver imagens */}
              {postagem.imagens.length > 0 && (
                <div className="relative border-2 border-black rounded-2xl overflow-hidden bg-slate-100">
                  <CarrosselImagens imagens={postagem.imagens} titulo={tituloPostagem} />
                </div>
              )}
            </div>

            {/* Bloco de Descrição (Texto) */}
            {postagem.contentHtml && (
              <div className="order-2 bg-white rounded-3xl border-2 border-black p-6 md:p-8 shadow-sm">
                <h3 className="font-extrabold text-xl mb-6 text-black border-b-2 border-slate-100 pb-3">Descrição</h3>
                <div 
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-black prose-p:leading-relaxed text-slate-700 text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: postagem.contentHtml }} 
                />
              </div>
            )}

            {/* Cartão do Autor no Mobile */}
            <CartaoAutor className="order-3 lg:hidden" />

            {/* Bloco de Comentários */}
            <div className="order-5 scroll-mt-24 pt-2" id="comentarios">
              {/* Passando o tipo="momentos" para o seu componente já existente */}
              <Comentarios slug={postagem.id || ""} tipo="momentos" />
            </div>
          </div>

          {/* Lado Direito (Desktop) */}
          <aside className="hidden lg:block lg:w-[320px] xl:w-[360px] flex-shrink-0">
            <div className="sticky top-28 space-y-6">
              <CartaoAutor />
              {/* O CartaoDetalhes foi removido daqui a seu pedido! */}
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}