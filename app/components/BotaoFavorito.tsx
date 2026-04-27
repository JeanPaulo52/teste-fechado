"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
// 1. Adicionei 'collection' e 'addDoc' aqui nas importações
import { doc, getDoc, updateDoc, increment, setDoc, onSnapshot, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface BotaoFavoritoProps {
  slug: string;
  titulo: string;
  imagem: string;
  materia?: string; // Fundamental para o algoritmo de recomendação!
  variante?: 'padrao' | 'minimalista';
  tipo: 'atividades' | 'artigos' | 'momentos';
}

export default function BotaoFavorito({ slug, titulo, imagem, materia, variante = 'padrao', tipo }: BotaoFavoritoProps) {
  const [favoritado, setFavoritado] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Função para padronizar o nome da matéria no banco (ex: "Química" vira "quimica")
  const normalizarMateria = (texto?: string) => {
    if (!texto) return 'geral';
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const favId = `${tipo}_${slug}`; 
        const userFavRef = doc(db, 'users', currentUser.uid, 'favorites', favId);
        getDoc(userFavRef).then((docSnap) => setFavoritado(docSnap.exists()));
      }
    });

    const itemRef = doc(db, tipo, slug);
    const unsubscribeItem = onSnapshot(itemRef, (docSnap) => {
      if (docSnap.exists()) {
        setTotalLikes(docSnap.data().totalFavoritos || 0);
      } else {
        setTotalLikes(0);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeItem();
    };
  }, [slug, tipo]);

  const alternarFavorito = async () => {
    if (!user) {
      alert("Você precisa estar logado para favoritar!");
      return;
    }

    const itemRef = doc(db, tipo, slug);
    const favId = `${tipo}_${slug}`;
    const userRef = doc(db, 'users', user.uid); // Referência ao perfil principal do usuário
    const userFavRef = doc(userRef, 'favorites', favId);
    
    // Pega a matéria normalizada para o algoritmo
    const materiaAlvo = normalizarMateria(materia);

    try {
      if (favoritado) {
        // 🔴 REMOVENDO O FAVORITO E DIMINUINDO A PONTUAÇÃO DO ALGORITMO
        setFavoritado(false); 
        await deleteDoc(userFavRef);
        await updateDoc(itemRef, { totalFavoritos: increment(-1) });
        
        // Remove 1 ponto de interesse da matéria no perfil do usuário
        await setDoc(userRef, {
          interesses: {
            [materiaAlvo]: increment(-1)
          }
        }, { merge: true });

      } else {
        // 🟢 ADICIONANDO O FAVORITO E AUMENTANDO A PONTUAÇÃO DO ALGORITMO
        setFavoritado(true); 
        
        const itemSnap = await getDoc(itemRef);
        if (!itemSnap.exists()) {
          await setDoc(itemRef, { totalFavoritos: 1 });
        } else {
          await updateDoc(itemRef, { totalFavoritos: increment(1) });
        }
        
        // Monta a URL correta dinamicamente
        let urlFinal = `/artigos/${slug}`; 
        if (tipo === 'atividades' && materia) {
          urlFinal = `/atividades/${materia}/${slug}`;
        } else if (tipo === 'momentos') {
          urlFinal = `/postagem/${slug}`; 
        }

        await setDoc(userFavRef, { 
          id: slug,
          tipo: tipo,                                       
          title: titulo,                                  
          image: imagem,                                  
          url: urlFinal,          
          date: new Date().toISOString()                  
        });

        // ALGORITMO: Adiciona 1 ponto de interesse da matéria no perfil do usuário
        await setDoc(userRef, {
          interesses: {
            [materiaAlvo]: increment(1)
          }
        }, { merge: true });

        // 🌟 NOVA PARTE: DISPARAR NOTIFICAÇÃO 🌟
        if (itemSnap.exists()) {
          const dadosDoItem = itemSnap.data();
          // Procura pelo ID do dono (pode ser userId ou autorId dependendo de como vc salvou)
          const idDoDono = dadosDoItem.userId || dadosDoItem.autorId;

          // Se o dono existe e não é o próprio usuário que está curtindo
          if (idDoDono && idDoDono !== user.uid) {
            // Ajusta o texto dependendo do tipo
            let textoNotif = "curtiu sua postagem.";
            if (tipo === 'atividades') textoNotif = "curtiu sua atividade.";
            if (tipo === 'artigos') textoNotif = "curtiu seu artigo.";

            await addDoc(collection(db, 'users', idDoDono, 'notifications'), {
              remetenteId: user.uid,
              remetenteNome: user.displayName || "Alguém",
              remetenteFoto: user.photoURL || "",
              texto: textoNotif,
              link: urlFinal, // Leva o dono direto pra página que foi curtida
              lida: false,
              data: Date.now()
            });
          }
        }
        // ==========================================
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      setFavoritado(!favoritado);
    }
  };

  const classeMinimalista = "relative w-12 h-12 flex items-center justify-center border-2 border-black rounded-full bg-transparent hover:bg-slate-100 transition-colors active:scale-95 group";
  const classePadrao = "relative flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 group";

  return (
    <button 
      onClick={alternarFavorito}
      className={variante === 'minimalista' ? classeMinimalista : classePadrao}
      title={favoritado ? "Remover dos favoritos" : "Salvar"}
    >
      <span 
        className={`material-symbols-outlined transition-colors duration-300 ${
          favoritado ? 'text-red-500 font-bold' : variante === 'minimalista' ? 'text-black font-bold' : 'text-slate-400 group-hover:text-red-400'
        }`}
        style={{ fontVariationSettings: favoritado ? '"FILL" 1' : '"FILL" 0' }}
      >
        favorite
      </span>

      {variante === 'minimalista' && totalLikes > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm pointer-events-none">
          {totalLikes > 99 ? '99+' : totalLikes}
        </span>
      )}

      {variante !== 'minimalista' && (
        <span className={`font-bold text-sm ${favoritado ? 'text-red-500' : 'text-slate-700'}`}>
          {totalLikes} {totalLikes === 1 ? 'curtida' : 'curtidas'}
        </span>
      )}
    </button>
  );
}