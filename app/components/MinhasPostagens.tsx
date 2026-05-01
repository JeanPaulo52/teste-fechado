"use client";

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';

// Importando nossos componentes personalizados
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

export default function MinhasPostagens({ perfilId, nomeUsuario }: { perfilId: string, nomeUsuario: string }) {
  const [atividades, setAtividades] = useState<any[]>([]);
  const [artigos, setArtigos] = useState<any[]>([]);
  const [momentos, setMomentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState<'atividades' | 'artigos' | 'momentos'>('atividades');

  // Estados para os Alertas e Modais
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, colecaoNome: string, tipo: string } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioAtual(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (perfilId) {
      buscarTudo(perfilId);
    }
  }, [perfilId]);

  const buscarTudo = async (uid: string) => {
    setLoading(true);
    try {
      // Buscar Atividades
      const qAtiv = query(collection(db, "atividades"), where("autorId", "==", uid));
      const snapAtiv = await getDocs(qAtiv);
      setAtividades(snapAtiv.docs.map(d => ({ id: d.id, tipo: 'atividade', colecaoNome: 'atividades', ...d.data() })));

      // Buscar Artigos
      const qArt = query(collection(db, "artigos"), where("autorId", "==", uid));
      const snapArt = await getDocs(qArt);
      setArtigos(snapArt.docs.map(d => ({ id: d.id, tipo: 'artigo', colecaoNome: 'artigos', ...d.data() })));

      // Buscar Momentos (nas 3 variações possíveis)
      let listaM: any[] = [];
      for (const col of ["postagens", "momentos", "postagem"]) {
        const qM = query(collection(db, col), where("autorId", "==", uid));
        const snapM = await getDocs(qM);
        snapM.forEach(doc => {
          listaM.push({ id: doc.id, tipo: 'momento', colecaoNome: col, ...doc.data() });
        });
      }
      // Remover duplicatas por ID
      setMomentos(listaM.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));

    } catch (error) {
      console.error("Erro ao carregar postagens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função que apenas abre o modal
  const handleExcluir = (id: string, colecaoNome: string, tipo: string) => {
    setItemToDelete({ id, colecaoNome, tipo });
  };

  // Função que realmente exclui quando o usuário confirma
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const { id, colecaoNome, tipo } = itemToDelete;

    try {
      await deleteDoc(doc(db, colecaoNome, id));
      
      if (tipo === 'atividade') setAtividades(prev => prev.filter(p => p.id !== id));
      if (tipo === 'artigo') setArtigos(prev => prev.filter(p => p.id !== id));
      if (tipo === 'momento') setMomentos(prev => prev.filter(p => p.id !== id));
      
      setToast({ message: "Postagem excluída com sucesso!", type: "info" });
    } catch (e) { 
      console.error(e); 
      setToast({ message: "Erro ao excluir postagem.", type: "error" });
    } finally {
      setItemToDelete(null); // Fecha o modal após a ação
    }
  };

  const renderGrid = (lista: any[]) => {
    if (lista.length === 0) return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-medium">Nenhuma postagem encontrada nesta categoria.</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {lista.map((post) => {
          let linkDestino = `/atividades/${post.materia || 'geral'}/${post.id}`;
          if (post.tipo === 'artigo') linkDestino = `/artigos/${post.id}`;
          if (post.tipo === 'momento') linkDestino = `/postagem/${post.id}`;

          let imagemCapa = post.imagemUrl || post.imageUrl || post.url || (Array.isArray(post.imagens) ? post.imagens[0] : null);
          const tituloPost = post.titulo || post.descricao || post.texto || "Sem título";
          const likes = post.totalFavoritos ?? post.likes ?? 0;

          return (
            <div key={post.id} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm group relative hover:border-slate-300 transition-all">
              {usuarioAtual?.uid === perfilId && (
                <button 
                  onClick={() => handleExcluir(post.id, post.colecaoNome, post.tipo)} 
                  className="absolute top-3 right-3 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 shadow-md hover:bg-red-700 transition-colors"
                  title="Excluir Postagem"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
              <Link href={linkDestino} className="block h-40 bg-slate-100 overflow-hidden relative">
                <img src={imagemCapa || `https://placehold.co/600x400?text=${post.tipo}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </Link>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 line-clamp-2 text-sm h-10 mb-2">{tituloPost}</h3>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t pt-3">
                  <span className="flex items-center gap-1 text-pink-500">
                    <span className="material-symbols-outlined text-sm">favorite</span> {likes}
                  </span>
                  <span>Ver Detalhes</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="text-center py-10 font-bold text-slate-400">Carregando conteúdos...</div>;

  return (
    <div className="mt-12 relative">
      {/* Navegação por Abas */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-100 pb-4">
        {[
          { id: 'atividades', label: 'Atividades', icon: 'exercise', count: atividades.length },
          { id: 'artigos', label: 'Artigos', icon: 'article', count: artigos.length },
          { id: 'momentos', label: 'Momentos', icon: 'photo_camera', count: momentos.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${
              abaAtiva === tab.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${abaAtiva === tab.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {abaAtiva === 'atividades' && renderGrid(atividades)}
        {abaAtiva === 'artigos' && renderGrid(artigos)}
        {abaAtiva === 'momentos' && renderGrid(momentos)}
      </div>

      {/* RENDERIZA O MODAL DE CONFIRMAÇÃO */}
      <ConfirmModal 
        isOpen={itemToDelete !== null}
        title="Excluir Permanentemente?"
        message="Tem certeza de que deseja excluir esta postagem? Essa ação não poderá ser desfeita e os dados serão perdidos para sempre."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* RENDERIZA O TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}