"use client";

import { useState, useRef, useEffect } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function CriarMomento() {
  const [user, setUser] = useState<User | null>(null);
  const [descricao, setDescricao] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✨ A super trava contra cliques duplos!
  const lockEnvio = useRef(false);

  // Verificar se está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Você precisa estar logado para compartilhar um momento!");
        router.push('/');
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  // Lidar com a seleção de múltiplas imagens
  const handleSelecionarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setArquivos(prev => [...prev, ...files]);
      
      const novasPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...novasPreviews]);
    }
  };

  // Remover uma imagem da lista antes de enviar
  const removerFoto = (indexParaRemover: number) => {
    setArquivos(prev => prev.filter((_, index) => index !== indexParaRemover));
    setPreviews(prev => prev.filter((_, index) => index !== indexParaRemover));
  };

  const salvarMomento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bloqueia qualquer tentativa de segundo clique instantaneamente
    if (lockEnvio.current) return;
    
    if (!user || !descricao) {
      alert("Por favor, escreva uma descrição para o seu momento!");
      return;
    }

    if (arquivos.length === 0) {
      alert("Por favor, adicione pelo menos uma foto!");
      return;
    }

    // Aciona a trava e o estado de carregamento
    lockEnvio.current = true;
    setEnviando(true);

    try {
      const urlsImagens: string[] = [];

      // 1. Upload de todas as fotos para o Storage
      for (let i = 0; i < arquivos.length; i++) {
        const file = arquivos[i];
        const nomeArquivo = `momentos/${Date.now()}_${i}_${user.uid}`;
        const storageRef = ref(storage, nomeArquivo);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urlsImagens.push(url);
      }

      // 2. Salva os dados no Firestore com o ID garantido
      await addDoc(collection(db, "momentos"), {
        descricao: descricao,
        imagens: urlsImagens,
        autorNome: user.displayName || "Professor(a)",
        autorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'P'}`,
        autorId: user.uid, 
        createdAt: serverTimestamp(),
        likes: 0,
        comentariosCount: 0
      });

      alert("Momento compartilhado com sucesso!");
      router.push('/'); 
      
    } catch (error) {
      console.error("Erro ao salvar momento:", error);
      alert("Ocorreu um erro ao compartilhar o momento.");
      // Se der erro, destrava para o usuário tentar novamente
      lockEnvio.current = false;
      setEnviando(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">Cancelar</button>
          <h1 className="font-bold text-lg text-slate-800">Novo Momento</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl p-4 pt-8 pb-20">
        <form onSubmit={salvarMomento} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          
          {/* Área de Perfil Rápido */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'P'}`} 
              alt="Seu perfil" 
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="font-bold text-slate-800">{user?.displayName || "Professor(a)"}</p>
              <p className="text-xs text-slate-500">Compartilhando com a comunidade</p>
            </div>
          </div>

          {/* Corpo do Texto (Legenda) */}
          <div>
            <textarea 
              placeholder="O que está acontecendo nesta foto? Como foi a aula?..."
              className="w-full p-0 text-lg md:text-xl text-slate-700 leading-relaxed border-none outline-none placeholder:text-slate-400 focus:ring-0 bg-transparent min-h-[120px] resize-y"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          {/* Galeria de Fotos Adicionadas */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200">
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removerFoto(index)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              
              {/* Botão de adicionar MAIS fotos */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl text-slate-400">add_photo_alternate</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Adicionar</span>
              </div>
            </div>
          )}

          {/* Botão Gigante de Adicionar Foto (Aparece se não houver fotos) */}
          {previews.length === 0 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <span className="text-4xl block mb-2">📸</span>
              <p className="text-blue-600 font-bold">Adicionar Fotos</p>
              <p className="text-blue-400 text-sm mt-1">Selecione uma ou mais imagens</p>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleSelecionarFotos} 
          />

          {/* Botão Publicar */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={enviando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-200 transition-all disabled:bg-slate-300 disabled:shadow-none text-lg w-full md:w-auto flex items-center justify-center gap-2"
            >
              {enviando ? (
                "Publicando..."
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Publicar Momento
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}