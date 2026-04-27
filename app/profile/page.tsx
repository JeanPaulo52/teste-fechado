"use client";
import { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase'; // 👈 Adicionamos o storage aqui
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'; // 👈 updateProfile adicionado
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // 👈 Funções do Storage
import { 
  doc, 
  onSnapshot, 
  collection, 
  setDoc,
  deleteDoc,
  query, 
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MinhasPostagens from '../components/MinhasPostagens'; 

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); // 👈 Referência para o input de foto invisível
  
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [favorites, setFavorites] = useState<any[]>([]);
  
  const [activities, setActivities] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [momentos, setMomentos] = useState<any[]>([]); 
  
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'seguidores' | 'seguindo'>('seguidores');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false); // 👈 Estado de carregamento da foto
  const [activeTab, setActiveTab] = useState('posts'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // Calcula total de posts para o design estilo Instagram
  const totalPosts = activities.length + articles.length + momentos.length;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const profileRef = doc(db, 'users', currentUser.uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfileData(data);
            setEditName(data.displayName || '');
            setEditBio(data.bio || '');
          }
        });

        const unsubSeguidores = onSnapshot(collection(db, 'users', currentUser.uid, 'seguidores'), (snap) => {
          setSeguidores(snap.docs.length);
        });
        
        const unsubSeguindo = onSnapshot(collection(db, 'users', currentUser.uid, 'seguindo'), (snap) => {
          setSeguindo(snap.docs.length);
        });

        const unsubFav = onSnapshot(collection(db, 'users', currentUser.uid, 'favorites'), (snap) => {
          const listaFavoritos = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          listaFavoritos.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
          setFavorites(listaFavoritos);
        });

        const qAtividades = query(collection(db, 'atividades'), where('autorId', '==', currentUser.uid));
        const unsubAtiv = onSnapshot(qAtividades, (snap) => setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qArtigos = query(collection(db, 'artigos'), where('autorId', '==', currentUser.uid));
        const unsubArt = onSnapshot(qArtigos, (snap) => setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qMomentos = query(collection(db, 'postagens'), where('autorId', '==', currentUser.uid));
        const unsubMom = onSnapshot(qMomentos, (snap) => setMomentos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        setLoading(false);
        return () => {
          unsubProfile(); unsubAtiv(); unsubFav(); unsubArt(); unsubMom();
          unsubSeguidores(); unsubSeguindo(); 
        };
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  // ==========================================
  // NOVA FUNÇÃO: TROCAR FOTO DE PERFIL
  // ==========================================
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(imageRef, file);
      const novaFotoUrl = await getDownloadURL(imageRef);

      // Atualiza no Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: novaFotoUrl });
      }

      // Atualiza no banco de dados Firestore
      await setDoc(doc(db, 'users', user.uid), { photoURL: novaFotoUrl }, { merge: true });
      
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      alert("Houve um erro ao atualizar sua foto.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { displayName: editName, bio: editBio }, { merge: true });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    }
  };

  const handleRemoverFavorito = async (favoritoId: string) => {
    if (!window.confirm("Deseja remover esta atividade dos seus favoritos?")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'favorites', favoritoId));
    } catch (error) {
      console.error(error);
    }
  };

  const openFollowModal = async (type: 'seguidores' | 'seguindo') => {
    setModalType(type);
    setIsModalOpen(true);
    setLoadingModal(true);
    setModalUsers([]); 

    try {
      const q = collection(db, 'users', user.uid, type);
      const snap = await getDocs(q);
      const userIds = snap.docs.map(d => d.id);

      const profiles = [];
      for (const id of userIds) {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profiles.push({ id, ...userSnap.data() });
        }
      }
      setModalUsers(profiles);
    } catch (error) {
      console.error("Erro ao buscar usuários do modal:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse text-blue-600 font-bold">Carregando Perfil...</div>;

  return (
    <main className="min-h-screen bg-slate-50 md:py-10 text-slate-800">
      
      {/* Container Principal estilo Mobile/App */}
      <div className="max-w-3xl mx-auto bg-white md:border md:border-slate-200 md:rounded-2xl overflow-hidden min-h-screen md:min-h-0 shadow-sm">
        
        {/* Header Superior estilo Instagram (Visível principalmente no mobile) */}
        <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex justify-between items-center">
          <h1 className="font-bold text-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[20px]">lock</span>
            {profileData.displayName?.split(' ')[0] || "Perfil"}
          </h1>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500 transition-colors" title="Sair da Conta">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        {/* Informações do Perfil */}
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-6 md:gap-10">
            
            {/* AVATAR COM FUNÇÃO DE UPLOAD */}
            <div 
              className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border border-slate-200 overflow-hidden flex-shrink-0 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profileData.photoURL || user?.photoURL ? (
                <img src={profileData.photoURL || user?.photoURL} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <span className="text-3xl font-black text-slate-400">
                    {(profileData.displayName || user?.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Overlay Hover e Indicador de Carregamento */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-blue-500">progress_activity</span>
                </div>
              )}

              {/* Input Invisível */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* ESTATÍSTICAS (Posts, Seguidores, Seguindo) */}
            <div className="flex-1 flex justify-around text-center">
              <div>
                <span className="block font-bold text-lg md:text-xl text-slate-900">{totalPosts}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Publicações</span>
              </div>
              <button onClick={() => openFollowModal('seguidores')} className="hover:opacity-70 transition-opacity">
                <span className="block font-bold text-lg md:text-xl text-slate-900">{seguidores}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Seguidores</span>
              </button>
              <button onClick={() => openFollowModal('seguindo')} className="hover:opacity-70 transition-opacity">
                <span className="block font-bold text-lg md:text-xl text-slate-900">{seguindo}</span>
                <span className="text-[11px] md:text-sm text-slate-500">Seguindo</span>
              </button>
            </div>
          </div>

          {/* NOME E BIOGRAFIA */}
          <div className="mt-4 md:mt-6">
            <h2 className="font-bold text-slate-900 leading-tight">{profileData.displayName || "Usuário"}</h2>
            <p className="text-sm text-slate-500 mb-2">{user?.email}</p>
            {profileData.bio && (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{profileData.bio}</p>
            )}
          </div>

          {/* BOTÃO E FORMULÁRIO DE EDIÇÃO */}
          <div className="mt-4">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Seu nome completo" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 mb-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Sua biografia" rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-500 text-white font-bold py-1.5 rounded-lg text-sm">Salvar</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-sm">Cancelar</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-1.5 rounded-lg text-sm transition-colors">
                Editar Perfil
              </button>
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
          
          {activeTab === 'posts' && user?.uid && (
            <div className="p-1 md:p-4">
              {/* O seu componente original de postagens continua funcionando aqui! */}
              <MinhasPostagens perfilId={user.uid} nomeUsuario={profileData.displayName || "Usuário"} />
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="p-1 md:p-4">
              {favorites.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-slate-300">bookmark_border</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Nenhum favorito ainda</h3>
                  <p className="text-slate-500 text-sm mt-1">Salve conteúdos para vê-los aqui mais tarde.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
                  {favorites.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="relative group aspect-square bg-slate-100 overflow-hidden cursor-pointer">
                      <Link href={item.url || "#"} className="block w-full h-full">
                        <img src={item.image || "https://placehold.co/600x600/e2e8f0/475569?text=Favorito"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {/* Overlay Escuro com Título no Hover (Estilo Grid Insta) */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                          <p className="text-white text-xs md:text-sm font-bold line-clamp-2">{item.title}</p>
                        </div>
                      </Link>

                      {/* Botão de Remover Favorito */}
                      <button 
                        onClick={(e) => { e.preventDefault(); handleRemoverFavorito(item.id); }} 
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                        title="Remover Favorito"
                      >
                        <span className="material-symbols-outlined text-[14px] md:text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* JANELA MODAL DE SEGUIDORES (MANTIDA EXATAMENTE IGUAL) */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 capitalize">
                {modalType === 'seguidores' ? 'Seguidores' : 'Seguindo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                </div>
              ) : modalUsers.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">
                  {modalType === 'seguidores' ? "Ninguém está te seguindo ainda." : "Você ainda não segue ninguém."}
                </p>
              ) : (
                <div className="flex flex-col">
                  {modalUsers.map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} className="w-full h-full object-cover" alt={u.displayName} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <span className="font-black text-slate-400">{u.displayName?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-slate-800 text-sm truncate">{u.displayName}</p>
                        {u.bio && <p className="text-xs text-slate-500 truncate">{u.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}