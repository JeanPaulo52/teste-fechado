"use client";

import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

interface Post {
  id: string;
  autorNome: string;
  autorAvatar: string;
  autorId: string;
  texto: string;
  imagemUrl?: string;
  createdAt: Timestamp;
  curtidas: number;
}

export default function RedeSocialFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [novoTexto, setNovoTexto] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [imagemPrevia, setImagemPrevia] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  
  // Controle da Janela (Modal) de postagem
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitorar Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Buscar Posts do Firebase
  useEffect(() => {
    const q = query(collection(db, "posts_comunidade"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  // Selecionar Foto
  const handleTrocarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemArquivo(file);
      setImagemPrevia(URL.createObjectURL(file));
    }
  };

  // Enviar para o Firebase
  const publicarPost = async () => {
    if (!user) return alert("Você precisa estar logado!");
    if (!novoTexto && !imagemArquivo) return;

    setEnviando(true);

    try {
      let urlFinal = "";
      if (imagemArquivo) {
        const nomeArquivo = `${Date.now()}_${user.uid}`;
        const storageRef = ref(storage, `comunidade/${nomeArquivo}`);
        await uploadBytes(storageRef, imagemArquivo);
        urlFinal = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "posts_comunidade"), {
        autorNome: user.displayName || "Usuário",
        autorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`,
        autorId: user.uid,
        texto: novoTexto,
        imagemUrl: urlFinal,
        createdAt: serverTimestamp(),
        curtidas: 0
      });

      // Limpa os campos e fecha o modal após o sucesso
      setNovoTexto("");
      setImagemArquivo(null);
      setImagemPrevia(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao publicar o post.");
    } finally {
      setEnviando(false);
    }
  };

  // Função para cancelar e fechar a janela
  const fecharModal = () => {
    setIsModalOpen(false);
    setNovoTexto("");
    setImagemPrevia(null);
    setImagemArquivo(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* CABEÇALHO */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 max-w-2xl h-16 flex items-center justify-between">
          <Link href="/" className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center">
            <span className="text-xl font-bold">←</span>
          </Link>
          <h1 className="font-black text-xl text-slate-800">Comunidade</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* FEED DE POSTS */}
      <main className="container mx-auto px-4 pt-6 max-w-2xl">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-center text-amber-800">
            Faça login para participar da comunidade!
          </div>
        )}

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">Nenhuma postagem ainda. Seja o primeiro!</div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <img src={post.autorAvatar} className="w-10 h-10 rounded-full" alt={post.autorNome} />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{post.autorNome}</h3>
                  </div>
                </div>
                {post.texto && <div className="px-4 pb-3 text-slate-800 text-sm whitespace-pre-wrap">{post.texto}</div>}
                {post.imagemUrl && (
                  <div className="bg-slate-100 border-t border-slate-100">
                    <img src={post.imagemUrl} className="w-full h-auto max-h-[500px] object-cover" alt="Post" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* BOTÃO FLUTUANTE (FAB) - Só aparece se o usuário estiver logado */}
      {user && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center transition-transform hover:scale-105 z-40 active:scale-95"
        >
          <span className="text-4xl font-light mb-1">+</span>
        </button>
      )}

      {/* JANELA DE POSTAGEM (MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[slideUp_0.2s_ease-out]">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <button onClick={fecharModal} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full font-bold">
                X
              </button>
              <h2 className="font-bold text-slate-800">Nova Publicação</h2>
              <button 
                onClick={publicarPost}
                disabled={enviando || (!novoTexto && !imagemArquivo)}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-bold py-1.5 px-4 rounded-full transition-all text-sm"
              >
                {enviando ? "..." : "Publicar"}
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="flex gap-3 mb-2">
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} className="w-10 h-10 rounded-full" alt="Você" />
                <textarea 
                  placeholder="O que está acontecendo?"
                  className="w-full bg-transparent text-slate-800 text-lg border-none focus:ring-0 resize-none outline-none mt-1 min-h-[100px]"
                  autoFocus
                  value={novoTexto}
                  onChange={(e) => setNovoTexto(e.target.value)}
                />
              </div>

              {/* Preview da Imagem no Modal */}
              {imagemPrevia && (
                <div className="relative mt-2 ml-13">
                  <img src={imagemPrevia} className="rounded-2xl max-h-72 object-cover w-full border border-slate-200" alt="Preview" />
                  <button onClick={() => {setImagemPrevia(null); setImagemArquivo(null)}} className="absolute top-3 right-3 bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-black font-bold">
                    X
                  </button>
                </div>
              )}
            </div>

            {/* Rodapé do Modal (Botões de Ação) */}
            <div className="p-4 border-t border-slate-100 flex items-center">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleTrocarImagem} />
              <button onClick={() => fileInputRef.current?.click()} className="text-cyan-600 font-medium hover:bg-cyan-50 p-2 rounded-full transition-colors flex items-center gap-2">
                <span className="text-xl">📷</span>
                <span className="text-sm">Foto</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}