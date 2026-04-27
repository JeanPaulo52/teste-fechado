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

  // Calcula total de posts para o design estilo Instagram
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

        // 🌟 NOVA PARTE: DISPARAR NOTIFICAÇÃO DE NOVO SEGUIDOR 🌟
        await addDoc(collection(db, 'users', perfilId, 'notifications'), {
          remetenteId: usuarioLogado.uid,
          remetenteNome: usuarioLogado.displayName || "Alguém",
          remetenteFoto: usuarioLogado.photoURL || "",
          texto: "começou a seguir você.",
          link: `/profile/${usuarioLogado.uid}`, // Direciona para o perfil de quem seguiu
          lida: false,
          data: Date.now()
        });
        // ==========================================================
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
    }
  };

  const handleStartChat = async () => {
    if (!usuarioLogado) return alert("Faça login para enviar mensagens");

    // 1. Procurar se já existe um chat entre os dois
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', usuarioLogado.uid));
    const querySnapshot = await getDocs(q);
    
    let chatId = null;

    // Verifica se nos chats encontrados, o perfilId também é participante
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(perfilId)) {
        chatId = doc.id;
      }
    });

    if (chatId) {
      // Se já existe, só navega
      router.push(`/mensagens/${chatId}`);
    } else {
      // Se não existe, cria um novo "quarto" de chat
      const newChat = await addDoc(collection(db, 'chats'), {
        participants: [usuarioLogado.uid, perfilId],
        updatedAt: Date.now(),
        lastMessage: ""
      });
      router.push(`/mensagens/${newChat.id}`);
    }
  };

  const eMeuPerfil = usuarioLogado?.uid === perfilId;

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse text-blue-600 font-bold">Carregando Perfil...</div>;

  return (
    <main className="min-h-screen bg-slate-50 md:py-10 text-slate-800">
      
      {/* Container Principal estilo Mobile/App */}
      <div className="max-w-3xl mx-auto bg-white md:border md:border-slate-200 md:rounded-2xl overflow-hidden min-h-screen md:min-h-0 shadow-sm">
        
        {/* Header Superior estilo Instagram */}
        <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-bold text-lg flex-1">
            {profileData.displayName?.split(' ')[0] || "Perfil"}
          </h1>
          <button className="text-slate-600 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>

        {/* Informações do Perfil */}
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-6 md:gap-10">
            
            {/* AVATAR */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border border-slate-200 overflow-hidden flex-shrink-0">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <span className="text-3xl font-black text-slate-400">
                    {profileData.displayName?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* ESTATÍSTICAS */}
            <div className="flex-1 flex justify-around text-center">
              <div>
                <span className="block font-bold text-lg md:text-xl text-slate-900">{totalPosts}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Publicações</span>
              </div>
              <div>
                <span className="block font-bold text-lg md:text-xl text-slate-900">{seguidores}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Seguidores</span>
              </div>
              <div>
                <span className="block font-bold text-lg md:text-xl text-slate-900">{seguindo}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Seguindo</span>
              </div>
            </div>
          </div>

          {/* NOME E BIOGRAFIA */}
          <div className="mt-4 md:mt-6">
            <h2 className="font-bold text-slate-900 leading-tight">{profileData.displayName || "Usuário"}</h2>
            {profileData.bio && (
              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{profileData.bio}</p>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="mt-4 flex gap-2">
            {eMeuPerfil ? (
              <Link href="/perfil" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-center font-semibold py-1.5 rounded-lg text-sm transition-colors">
                Editar Meu Perfil
              </Link>
            ) : (
              <>
                <button 
                  onClick={handleToggleFollow}
                  className={`flex-1 font-semibold py-1.5 rounded-lg text-sm transition-colors ${
                    isFollowing 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>

                <button 
                  onClick={handleStartChat}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-1.5 rounded-lg text-sm transition-colors"
                >
                  Mensagem
                </button>
              </>
            )}
          </div>
        </div>

        {/* TABS ESTILO INSTAGRAM */}
        <div className="flex border-t border-slate-200">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${activeTab === 'posts' ? 'border-t-[1px] border-slate-900 text-slate-900 -mt-[1px]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-[22px]">grid_on</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider hidden sm:block">Publicações</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('favorites')} 
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${activeTab === 'favorites' ? 'border-t-[1px] border-slate-900 text-slate-900 -mt-[1px]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-[24px]">bookmark_border</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider hidden sm:block">Salvos</span>
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="min-h-[400px] bg-slate-50 md:bg-white pb-10">
          
          {/* ABA POSTS */}
          {activeTab === 'posts' && (
            <div className="p-1 md:p-4">
              <MinhasPostagens perfilId={perfilId} nomeUsuario={profileData.displayName || "Usuário"} />
            </div>
          )}

          {/* ABA FAVORITOS */}
          {activeTab === 'favorites' && (
            <div className="p-1 md:p-4 h-full">
              {eMeuPerfil ? (
                favorites.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-slate-300">bookmark_border</span>
                    </div>
                    <p className="text-slate-500 text-sm">Nenhum favorito salvo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
                    {favorites.map((item: any) => (
                      <div key={item.id} className="relative group aspect-square bg-slate-100 overflow-hidden cursor-pointer">
                        <Link href={item.url || "#"} className="block w-full h-full">
                          <img src={item.image || "https://placehold.co/600x600/e2e8f0/475569"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                            <p className="text-white text-xs md:text-sm font-bold line-clamp-2">{item.title}</p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-200 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-slate-300">lock</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Favoritos Privados</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Os itens salvos por {profileData.displayName?.split(' ')[0] || "este usuário"} são ocultos.
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