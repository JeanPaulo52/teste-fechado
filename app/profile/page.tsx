"use client";
import { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase'; 
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
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

// Importando os novos componentes que você criou!
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); 
  
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
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [activeTab, setActiveTab] = useState('posts'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // ESTADOS DOS NOVOS ALERTAS E MODAIS
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Limites de caracteres
  const NAME_MAX_LENGTH = 50; 
  const BIO_MAX_LENGTH = 160; 

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(imageRef, file);
      const novaFotoUrl = await getDownloadURL(imageRef);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: novaFotoUrl });
      }

      await setDoc(doc(db, 'users', user.uid), { photoURL: novaFotoUrl }, { merge: true });
      setToast({ message: "Foto atualizada com sucesso!", type: "success" });
      
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      setToast({ message: "Erro ao atualizar a foto.", type: "error" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { 
        displayName: editName.substring(0, NAME_MAX_LENGTH),
        bio: editBio.substring(0, BIO_MAX_LENGTH) 
      }, { merge: true });
      setIsEditing(false);
      
      // Chamando nosso balão bonitão em vez do alert do navegador
      setToast({ message: "Perfil atualizado com sucesso!", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao salvar perfil.", type: "error" });
    }
  };

  // Função que apenas abre a janela (modal) de confirmação
  const handleRemoverFavorito = (favoritoId: string) => {
    setItemToDelete(favoritoId);
  };

  // Função que realmente apaga do banco de dados (chamada pelo botão "Sim" do Modal)
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setFavorites((prevFavorites) => prevFavorites.filter(fav => fav.id !== itemToDelete));

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'favorites', itemToDelete));
      setToast({ message: "Favorito removido!", type: "info" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Erro ao remover favorito.", type: "error" });
    } finally {
      setItemToDelete(null); // Fecha o modal após terminar
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-10 text-slate-800">
      
      {/* CAPA (COVER) */}
      <div className="w-full h-48 md:h-72 bg-gradient-to-r from-blue-600 via-purple-500 to-red-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <button 
          onClick={() => signOut(auth)} 
          className="absolute top-4 right-4 bg-white/10 hover:bg-red-500 backdrop-blur-md text-white px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-bold z-10 shadow-sm border border-white/20"
          title="Sair da Conta"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden sm:block">Sair</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-24">
        
        {/* CABEÇALHO DO PERFIL */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 p-6 md:p-10">
          
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8 relative">
            
            {/* AVATAR SOBREPOSTO */}
            <div className="relative -mt-16 md:-mt-20 self-start md:self-auto flex-shrink-0">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[4px] bg-gradient-to-tr from-blue-600 to-red-600 shadow-xl cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white relative flex items-center justify-center">
                  {profileData.photoURL || user?.photoURL ? (
                    <img src={profileData.photoURL || user?.photoURL} className="w-full h-full object-cover" alt="Perfil" />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">
                      {(profileData.displayName || user?.email)?.charAt(0).toUpperCase()}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                    <span className="text-white text-xs font-bold mt-1">Trocar Foto</span>
                  </div>

                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* INFORMAÇÕES DO USUÁRIO E EDIÇÃO */}
            <div className="flex-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tighter leading-tight flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-slate-400">lock</span>
                      {profileData.displayName || "Professor(a) Adaptado"}
                    </h1>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-4">{user?.email}</p>
                  
                  {profileData.bio ? (
                    <p className="text-slate-700 max-w-2xl leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words">
                      {profileData.bio}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Nenhuma biografia adicionada.</p>
                  )}
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="bg-slate-50/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 w-full animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Editando Perfil
                  </h3>
                  
                  <div className="relative mb-3">
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value.substring(0, NAME_MAX_LENGTH))} 
                      maxLength={NAME_MAX_LENGTH}
                      placeholder="Seu nome completo" 
                      className="w-full px-4 py-3 pr-16 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1">
                      <span className={`text-[11px] font-bold ${editName.length >= NAME_MAX_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                        {editName.length} / {NAME_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative mb-4">
                    <textarea 
                      value={editBio} 
                      onChange={(e) => setEditBio(e.target.value.substring(0, BIO_MAX_LENGTH))} 
                      maxLength={BIO_MAX_LENGTH}
                      placeholder="Conte um pouco sobre você e sua experiência..." 
                      rows={3} 
                      className="w-full px-4 py-3 pb-8 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" 
                    />
                    <div className="absolute bottom-2 right-3 flex items-center gap-1">
                      <span className={`text-[11px] font-bold ${editBio.length >= BIO_MAX_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                        {editBio.length} / {BIO_MAX_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2.5 rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
                      Salvar Alterações
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white text-slate-700 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors border border-slate-200">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* AÇÕES E ESTATÍSTICAS */}
            <div className="flex flex-col items-start md:items-end gap-5 w-full md:w-auto mt-4 md:mt-0">
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full md:w-auto bg-slate-950 text-white font-bold py-2.5 px-8 rounded-full hover:bg-blue-600 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.1)] text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Editar Perfil
                </button>
              )}

              <div className="flex gap-6 md:gap-8 w-full justify-between md:justify-end border-t md:border-0 border-slate-100 pt-5 md:pt-0 mt-2 md:mt-0 px-2 sm:px-0">
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{totalPosts}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Posts</span>
                </div>
                <button onClick={() => openFollowModal('seguidores')} className="flex flex-col items-center md:items-end hover:opacity-70 transition-opacity">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{seguidores}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Seguidores</span>
                </button>
                <button onClick={() => openFollowModal('seguindo')} className="flex flex-col items-center md:items-end hover:opacity-70 transition-opacity">
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{seguindo}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Seguindo</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex mt-10 border-b border-slate-200 gap-1 sm:gap-4 px-1">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`flex-1 md:flex-none md:w-48 pb-4 flex items-center justify-center gap-2.5 font-bold text-sm transition-all relative group ${activeTab === 'posts' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="material-symbols-outlined text-[22px]">grid_on</span>
            Minhas Publicações
            {activeTab === 'posts' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_4px_rgba(37,99,235,0.2)] animate-in fade-in"></span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('favorites')} 
            className={`flex-1 md:flex-none md:w-48 pb-4 flex items-center justify-center gap-2.5 font-bold text-sm transition-all relative group ${activeTab === 'favorites' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="material-symbols-outlined text-[24px]">bookmark</span>
            Itens Salvos
            {activeTab === 'favorites' && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-950 rounded-t-full shadow-[0_-2px_4px_rgba(0,0,0,0.1)] animate-in fade-in"></span>}
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="py-8 min-h-[400px]">
          
          {activeTab === 'posts' && user?.uid && (
            <div className="animate-in fade-in duration-300">
              <MinhasPostagens perfilId={user.uid} nomeUsuario={profileData.displayName || "Usuário"} />
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="animate-in fade-in duration-300 pb-24 md:pb-0">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-5xl">bookmark</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Nada salvo ainda</h3>
                  <p className="text-slate-500 text-sm max-w-sm">Quando você favoritar atividades ou artigos de outros professores, eles aparecerão aqui para você ver mais tarde.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-4 rounded-xl overflow-hidden md:overflow-visible p-1">
                  {favorites.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="relative group aspect-square bg-slate-100 rounded-lg md:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                      <Link href={item.url || "#"} className="block w-full h-full relative">
                        <img src={item.image || "https://placehold.co/600x600/e2e8f0/475569?text=Favorito"} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 md:p-4 text-left">
                          <p className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-snug">{item.title}</p>
                        </div>
                      </Link>

                      <button 
                        onClick={(e) => { e.preventDefault(); handleRemoverFavorito(item.id); }} 
                        className="absolute top-2 right-2 bg-white/90 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500 hover:text-white"
                        title="Remover Favorito"
                      >
                        <span className="material-symbols-outlined text-[18px]">bookmark_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE SEGUIDORES/SEGUINDO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">group</span>
                {modalType === 'seguidores' ? 'Meus Seguidores' : 'Pessoas que Sigo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="text-center text-slate-500 py-10 px-4">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                  <p className="text-sm">
                    {modalType === 'seguidores' ? "Ninguém está te seguindo ainda." : "Você ainda não segue ninguém."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 p-1">
                  {modalUsers.map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-full border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative">
                        {u.photoURL ? (
                          <img src={u.photoURL} className="w-full h-full object-cover" alt={u.displayName} />
                        ) : (
                          <span className="font-bold text-lg text-slate-400">{u.displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-slate-900 text-sm truncate leading-snug">{u.displayName}</p>
                        {u.bio && <p className="text-xs text-slate-500 truncate mt-0.5">{u.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZA O NOSSO TOAST (BALÃO DE AVISO) SE ELE TIVER ALGUMA MENSAGEM */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* RENDERIZA O MODAL DE CONFIRMAÇÃO CASO O USUÁRIO CLIQUE EM APAGAR */}
      <ConfirmModal 
        isOpen={itemToDelete !== null}
        title="Remover Favorito?"
        message="Você tem certeza que deseja remover esta atividade dos seus favoritos? Você não a encontrará mais aqui."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

    </main>
  );
}