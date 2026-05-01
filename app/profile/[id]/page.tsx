"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  setDoc,
  deleteDoc,
  addDoc, 
  getDocs
} from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MinhasPostagens from '../../components/MinhasPostagens'; 

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const perfilId = params.id as string; 

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [momentos, setMomentos] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const [isFollowing, setIsFollowing] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);

  // Calcula total de posts para o design
  const totalPosts = activities.length + articles.length + momentos.length;

  // 1. Identificar usuário logado
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuarioLogado(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Buscar Dados do Perfil e Postagens
  useEffect(() => {
    if (!perfilId) return;

    const profileRef = doc(db, 'users', perfilId);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfileData(snap.data());
    });

    const unsubSeguidores = onSnapshot(collection(db, 'users', perfilId, 'seguidores'), (snap) => {
      setSeguidores(snap.docs.length);
    });
    
    const unsubSeguindo = onSnapshot(collection(db, 'users', perfilId, 'seguindo'), (snap) => {
      setSeguindo(snap.docs.length);
    });

    const qAtiv = query(collection(db, 'atividades'), where('autorId', '==', perfilId));
    const unsubAtiv = onSnapshot(qAtiv, (snap) => setActivities(snap.docs.map(d => d.data())));

    const qArt = query(collection(db, 'artigos'), where('autorId', '==', perfilId));
    const unsubArt = onSnapshot(qArt, (snap) => setArticles(snap.docs.map(d => d.data())));

    const qMom = query(collection(db, 'postagens'), where('autorId', '==', perfilId));
    const unsubMom = onSnapshot(qMom, (snap) => setMomentos(snap.docs.map(d => d.data())));

    const unsubFav = onSnapshot(collection(db, 'users', perfilId, 'favorites'), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFavorites(lista);
    });

    setLoading(false);
    return () => {
      unsubProfile(); unsubAtiv(); unsubArt(); unsubMom(); unsubFav();
      unsubSeguidores(); unsubSeguindo();
    };
  }, [perfilId]);

  // 3. Verificar se EU já sigo essa pessoa
  useEffect(() => {
    if (usuarioLogado && perfilId) {
      const docRef = doc(db, 'users', usuarioLogado.uid, 'seguindo', perfilId);
      const unsubIsFollowing = onSnapshot(docRef, (docSnap) => {
        setIsFollowing(docSnap.exists());
      });
      return () => unsubIsFollowing();
    }
  }, [usuarioLogado, perfilId]);

  // Função para Seguir / Deixar de Seguir
  const handleToggleFollow = async () => {
    if (!usuarioLogado) return alert("Faça login para seguir este usuário!");
    
    const meuSeguindoRef = doc(db, 'users', usuarioLogado.uid, 'seguindo', perfilId);
    const perfilSeguidoresRef = doc(db, 'users', perfilId, 'seguidores', usuarioLogado.uid);

    try {
      if (isFollowing) {
        // Deixar de seguir
        await deleteDoc(meuSeguindoRef);
        await deleteDoc(perfilSeguidoresRef);
      } else {
        // Começar a seguir
        await setDoc(meuSeguindoRef, { date: Date.now() });
        await setDoc(perfilSeguidoresRef, { date: Date.now() });

        // 🌟 NOTIFICAÇÃO DE NOVO SEGUIDOR 🌟
        await addDoc(collection(db, 'users', perfilId, 'notifications'), {
          remetenteId: usuarioLogado.uid,
          remetenteNome: usuarioLogado.displayName || "Alguém",
          remetenteFoto: usuarioLogado.photoURL || "",
          texto: "começou a seguir você.",
          link: `/profile/${usuarioLogado.uid}`, 
          lida: false,
          data: Date.now()
        });
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
    }
  };

  const handleStartChat = async () => {
    if (!usuarioLogado) return alert("Faça login para enviar mensagens");

    // Procurar se já existe um chat entre os dois
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', usuarioLogado.uid));
    const querySnapshot = await getDocs(q);
    
    let chatId = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(perfilId)) {
        chatId = doc.id;
      }
    });

    if (chatId) {
      router.push(`/mensagens/${chatId}`);
    } else {
      const newChat = await addDoc(collection(db, 'chats'), {
        participants: [usuarioLogado.uid, perfilId],
        updatedAt: Date.now(),
        lastMessage: ""
      });
      router.push(`/mensagens/${newChat.id}`);
    }
  };

  const eMeuPerfil = usuarioLogado?.uid === perfilId;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-10 text-slate-800">
      
      {/* ====================================================
          CAPA (COVER) COM BOTÃO DE VOLTAR E IDENTIDADE VISUAL
          ==================================================== */}
      <div className="w-full h-48 md:h-72 bg-gradient-to-r from-blue-600 via-purple-500 to-red-600 relative overflow-hidden">
        {/* Efeito de brilho de fundo (Glassmorphism) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        {/* Botão de Voltar Flutuante */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-bold z-10 shadow-sm border border-white/20"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="hidden sm:block">Voltar</span>
        </button>

        {/* Botão de Opções (Visual) */}
        <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 shadow-sm border border-white/20">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>

      {/* ÁREA PRINCIPAL DO PERFIL */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-24">
        
        {/* CABEÇALHO DO PERFIL */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 p-6 md:p-10">
          
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8 relative">
            
            {/* AVATAR SOBREPOSTO */}
            <div className="relative -mt-16 md:-mt-20 self-start md:self-auto flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[4px] bg-gradient-to-tr from-blue-600 to-red-600 shadow-xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white flex items-center justify-center">
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} className="w-full h-full object-cover" alt="Perfil" />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">
                      {profileData.displayName?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* INFORMAÇÕES DO USUÁRIO */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tighter leading-tight">
                {profileData.displayName || "Usuário"}
              </h1>
              
              {profileData.bio ? (
                <p className="text-slate-700 max-w-2xl leading-relaxed text-sm md:text-base whitespace-pre-wrap mt-2">
                  {profileData.bio}
                </p>
              ) : (
                <p className="text-slate-400 italic text-sm mt-2">Nenhuma biografia adicionada.</p>
              )}
            </div>

            {/* AÇÕES E ESTATÍSTICAS */}
            <div className="flex flex-col items-start md:items-end gap-5 w-full md:w-auto mt-4 md:mt-0">
              
              {/* BOTÕES: SEGUIR E MENSAGEM */}
              <div className="flex gap-3 w-full md:w-auto">
                {eMeuPerfil ? (
                  <Link href="/perfil" className="w-full md:w-auto bg-slate-950 text-white font-bold py-2.5 px-8 rounded-full hover:bg-slate-800 transition-colors shadow-md text-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Editar Meu Perfil
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleToggleFollow}
                      className={`flex-1 md:flex-none font-bold py-2.5 px-6 rounded-full text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                        isFollowing 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 shadow-none' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isFollowing ? 'person_check' : 'person_add'}
                      </span>
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>

                    <button 
                      onClick={handleStartChat}
                      className="flex-1 md:flex-none bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-full text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Mensagem
                    </button>
                  </>
                )}
              </div>

              {/* MÉTRIQUES */}
              <div className="flex gap-6 md:gap-8 w-full justify-between md:justify-end border-t md:border-0 border-slate-100 pt-5 md:pt-0 mt-2 md:mt-0 px-2 sm:px-0">
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{totalPosts}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Posts</span>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{seguidores}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Seguidores</span>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{seguindo}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Seguindo</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ====================================================
            TABS (ABAS)
            ==================================================== */}
        <div className="flex mt-10 border-b border-slate-200 gap-1 sm:gap-4 px-1">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`flex-1 md:flex-none md:w-48 pb-4 flex items-center justify-center gap-2.5 font-bold text-sm transition-all relative group ${activeTab === 'posts' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="material-symbols-outlined text-[22px]">grid_on</span>
            Publicações
            {activeTab === 'posts' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_4px_rgba(37,99,235,0.2)] animate-in fade-in"></span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('favorites')} 
            className={`flex-1 md:flex-none md:w-48 pb-4 flex items-center justify-center gap-2.5 font-bold text-sm transition-all relative group ${activeTab === 'favorites' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="material-symbols-outlined text-[24px]">bookmark</span>
            Salvos
            {activeTab === 'favorites' && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-950 rounded-t-full shadow-[0_-2px_4px_rgba(0,0,0,0.1)] animate-in fade-in"></span>}
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="py-8 min-h-[400px]">
          
          {/* ABA POSTS */}
          {activeTab === 'posts' && (
            <div className="animate-in fade-in duration-300">
              <MinhasPostagens perfilId={perfilId} nomeUsuario={profileData.displayName || "Usuário"} />
            </div>
          )}

          {/* ABA FAVORITOS */}
          {activeTab === 'favorites' && (
            <div className="animate-in fade-in duration-300 pb-24 md:pb-0">
              {eMeuPerfil ? (
                favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-5">
                      <span className="material-symbols-outlined text-5xl">bookmark</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Nada salvo ainda</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-4 rounded-xl overflow-hidden md:overflow-visible p-1">
                    {favorites.map((item: any) => (
                      <div key={item.id} className="relative group aspect-square bg-slate-100 rounded-lg md:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                        <Link href={item.url || "#"} className="block w-full h-full relative">
                          <img src={item.image || "https://placehold.co/600x600/e2e8f0/475569"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Favorito" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 md:p-4 text-left">
                            <p className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-snug">{item.title}</p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // TELA DE BLOQUEIO DE FAVORITOS (Para visitantes)
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
                    <span className="material-symbols-outlined text-5xl">lock</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Favoritos Privados</h3>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                    Os itens salvos por {profileData.displayName?.split(' ')[0] || "este usuário"} são ocultos e apenas ele tem acesso.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </main>
  );
}