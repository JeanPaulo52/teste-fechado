"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  doc, getDoc, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function Comentarios({ slug, tipo }: { slug: string, tipo: 'atividades' | 'artigos' | 'momentos' }) {
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState({ nome: "Professor(a)", foto: null });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            nome: data.displayName || data.name || "Professor(a)",
            foto: data.photoURL || null
          });
        }
      }
    });

    const comentariosRef = collection(db, tipo, slug, 'comentarios');
    const q = query(comentariosRef, orderBy('data', 'desc')); 

    const unsubscribeComentarios = onSnapshot(q, (snap) => {
      const listaComentarios = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComentarios(listaComentarios);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeComentarios();
    };
  }, [slug, tipo]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim() || !user) return;

    setEnviando(true);
    try {
      const comentariosRef = collection(db, tipo, slug, 'comentarios');
      await addDoc(comentariosRef, {
        texto: novoComentario,
        autorId: user.uid,
        autorNome: userData.nome,
        autorFoto: userData.foto,
        data: new Date().toISOString(),
        totalCurtidas: 0,
        quemCurtiu: [] 
      });
      
      // 🌟 NOVA PARTE: NOTIFICAR O DONO DA POSTAGEM 🌟
      const postRef = doc(db, tipo, slug);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data();
        const idDoDono = postData.userId || postData.autorId;

        // Se o dono não for a mesma pessoa comentando, avisa ele!
        if (idDoDono && idDoDono !== user.uid) {
          
          // Constrói o link certinho igual fizemos no Like
          let urlFinal = `/artigos/${slug}`; 
          if (tipo === 'atividades') {
            const mat = postData.materia ? postData.materia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : 'geral';
            urlFinal = `/atividades/${mat}/${slug}`;
          } else if (tipo === 'momentos') {
            urlFinal = `/postagem/${slug}`; 
          }

          let textoNotif = "comentou na sua postagem.";
          if (tipo === 'atividades') textoNotif = "comentou na sua atividade.";
          if (tipo === 'artigos') textoNotif = "comentou no seu artigo.";

          await addDoc(collection(db, 'users', idDoDono, 'notifications'), {
            remetenteId: user.uid,
            remetenteNome: userData.nome,
            remetenteFoto: userData.foto || "",
            texto: textoNotif,
            link: urlFinal,
            lida: false,
            data: Date.now()
          });
        }
      }
      // ===============================================

      setNovoComentario("");
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const excluirComentario = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir seu comentário?")) return;
    try {
      await deleteDoc(doc(db, tipo, slug, 'comentarios', id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  // 🌟 ADICIONAMOS O autorComentarioId COMO PARÂMETRO AQUI 🌟
  const alternarCurtida = async (comentarioId: string, jaCurtiu: boolean, autorComentarioId: string) => {
    if (!user) {
      alert("Faça login para curtir!");
      return;
    }

    const comentarioRef = doc(db, tipo, slug, 'comentarios', comentarioId);

    try {
      if (jaCurtiu) {
        await updateDoc(comentarioRef, {
          totalCurtidas: increment(-1),
          quemCurtiu: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(comentarioRef, {
          totalCurtidas: increment(1),
          quemCurtiu: arrayUnion(user.uid)
        });

        // 🌟 NOVA PARTE: NOTIFICAR O DONO DO COMENTÁRIO PELO LIKE 🌟
        if (autorComentarioId !== user.uid) {
          const postRef = doc(db, tipo, slug);
          const postSnap = await getDoc(postRef);
          
          let urlFinal = `/artigos/${slug}`; 
          if (postSnap.exists()) {
            const postData = postSnap.data();
            if (tipo === 'atividades') {
              const mat = postData.materia ? postData.materia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : 'geral';
              urlFinal = `/atividades/${mat}/${slug}`;
            } else if (tipo === 'momentos') {
              urlFinal = `/postagem/${slug}`; 
            }
          }

          await addDoc(collection(db, 'users', autorComentarioId, 'notifications'), {
            remetenteId: user.uid,
            remetenteNome: userData.nome,
            remetenteFoto: userData.foto || "",
            texto: "curtiu o seu comentário.",
            link: urlFinal,
            lida: false,
            data: Date.now()
          });
        }
        // ==========================================================
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-12">
      <h3 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-500">forum</span>
        Comentários ({comentarios.length})
      </h3>

      {/* Formulário */}
      <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva algo..."
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm text-slate-900 placeholder-slate-400 bg-white"
              disabled={enviando}
            />
            <button type="submit" disabled={enviando || !novoComentario.trim()} className="self-end bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
              {enviando ? "Enviando..." : "Comentar"}
            </button>
          </form>
        ) : (
          <p className="text-center py-4 text-slate-500 text-sm">Faça login para comentar.</p>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-6">
        {comentarios.map((com) => {
          const jaCurtiu = com.quemCurtiu?.includes(user?.uid);
          
          return (
            <div key={com.id} className="flex gap-4 group">
              
              {/* FOTO COM LINK PARA O PERFIL */}
              <Link href={`/profile/${com.autorId}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition-all">
                  {com.autorFoto ? (
                    <img src={com.autorFoto} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="font-bold text-slate-500">{com.autorNome?.charAt(0)}</span>
                  )}
                </div>
              </Link>
              
              <div className="flex-1">
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 relative">
                  <div className="flex justify-between items-center mb-1">
                    
                    {/* NOME COM LINK PARA O PERFIL */}
                    <Link href={`/profile/${com.autorId}`} className="hover:underline decoration-blue-500">
                      <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                        {com.autorNome}
                      </span>
                    </Link>
                    
                    {user?.uid === com.autorId && (
                      <button 
                        onClick={() => excluirComentario(com.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-3">{com.texto}</p>

                  <div className="flex items-center gap-4 border-t border-slate-200 pt-2">
                    <button 
                      // 🌟 PASSANDO O AUTOR DO COMENTÁRIO AQUI 🌟
                      onClick={() => alternarCurtida(com.id, jaCurtiu, com.autorId)}
                      className="flex items-center gap-1"
                    >
                      <span 
                        className={`material-symbols-outlined text-lg ${jaCurtiu ? 'text-red-500 fill-1' : 'text-slate-400'}`}
                        style={{ fontVariationSettings: jaCurtiu ? '"FILL" 1' : '"FILL" 0' }}
                      >
                        favorite
                      </span>
                      <span className={`text-xs font-bold ${jaCurtiu ? 'text-red-500' : 'text-slate-500'}`}>
                        {com.totalCurtidas || 0}
                      </span>
                    </button>
                    
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      {new Date(com.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}