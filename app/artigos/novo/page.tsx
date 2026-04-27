"use client";

import { useState, useRef, useEffect } from 'react';
import { db, auth, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function NovoArtigo() {
  const [user, setUser] = useState<User | null>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaPrevia, setCapaPrevia] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Você precisa estar logado para escrever um artigo!");
        router.push('/');
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  const handleTrocarCapa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapaArquivo(file);
      setCapaPrevia(URL.createObjectURL(file));
    }
  };

  const salvarArtigo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✨ ATUALIZADO: Agora só exige Título e Texto (Capa não é mais obrigatória)
    if (!user || !titulo || !texto) {
      alert("Por favor, preencha o título e o texto do artigo!");
      return;
    }

    setEnviando(true);

    try {
      let urlCapa = ""; // Começa vazio

      // ✨ ATUALIZADO: Só tenta fazer upload se o usuário escolheu um arquivo
      if (capaArquivo) {
        const nomeArquivo = `${Date.now()}_${user.uid}`;
        const storageRef = ref(storage, `artigos/${nomeArquivo}`);
        await uploadBytes(storageRef, capaArquivo);
        urlCapa = await getDownloadURL(storageRef);
      }

      // 2. Salva os dados no Firestore (Coleção: artigos)
      await addDoc(collection(db, "artigos"), {
        titulo: titulo,
        texto: texto,
        capaUrl: urlCapa, // Vai enviar a URL da imagem OU ficará vazio ("")
        autorNome: user.displayName || "Professor(a)",
        autorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
        autorId: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
        comentariosCount: 0
      });

      alert("Artigo publicado com sucesso!");
      router.push('/'); // Volta para a página inicial
    } catch (error) {
      console.error("Erro ao salvar artigo:", error);
      alert("Ocorreu um erro ao salvar o artigo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-500 font-bold hover:text-purple-600 transition-colors">Cancelar</button>
          <h1 className="font-bold text-lg text-purple-900">Escrever Artigo</h1>
          <div className="w-16"></div> {/* Espaçador para centralizar o título */}
        </div>
      </div>

      <main className="container mx-auto max-w-3xl p-4 pt-8 pb-20">
        <form onSubmit={salvarArtigo} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          
          {/* Capa do Artigo (Estilo "Banner") */}
          <div>
            <label className="block text-slate-700 font-bold mb-2">Capa do Artigo <span className="text-slate-400 font-normal">(Opcional)</span></label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 md:h-64 bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors overflow-hidden relative group"
            >
              {capaPrevia ? (
                <>
                  <img src={capaPrevia} className="w-full h-full object-cover" alt="Capa Preview" />
                  <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                    <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">Trocar Capa</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <span className="text-4xl block mb-2">🖼️</span>
                  <p className="text-purple-600 font-medium">Clique para fazer upload da capa</p>
                  <p className="text-purple-400 text-sm mt-1">Recomendado: imagem na horizontal</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleTrocarCapa} />
            </div>
          </div>

          {/* Título do Artigo */}
          <div>
            <input 
              type="text" 
              placeholder="Título do seu artigo..."
              className="w-full p-2 text-3xl md:text-4xl font-black text-slate-800 border-none outline-none placeholder:text-slate-300 focus:ring-0 bg-transparent"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <hr className="border-slate-100" />

          {/* Corpo do Texto */}
          <div>
            <textarea 
              placeholder="Escreva o conteúdo do seu artigo aqui..."
              className="w-full p-2 text-lg text-slate-700 leading-relaxed border-none outline-none placeholder:text-slate-300 focus:ring-0 bg-transparent min-h-[400px] resize-y"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
            />
          </div>

          {/* Botão Publicar */}
          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              disabled={enviando}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-200 transition-all disabled:bg-slate-300 disabled:shadow-none text-lg"
            >
              {enviando ? "Publicando..." : "Publicar Artigo"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}