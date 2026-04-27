"use client";
import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Pega o usuário logado
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.push('/login');
    });
    return () => unsub();
  }, [router]);

  // 2. Busca todos os chats onde o usuário participa
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', user.uid)
      // orderBy('updatedAt', 'desc') // Descomente se quiser ordenar pelos mais recentes
    );

    const unsubChats = onSnapshot(q, async (snap) => {
      const chatsCarregados: any[] = [];
      
      // Para cada chat, precisamos descobrir quem é a OUTRA pessoa
      for (const documento of snap.docs) {
        const chatData = documento.data();
        const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
        
        // Busca a foto e nome do outro usuário
        let otherUserData = { displayName: "Usuário Desconhecido", photoURL: "" };
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            otherUserData = userDoc.data() as any;
          }
        }

        chatsCarregados.push({
          id: documento.id,
          ...chatData,
          otherUser: otherUserData
        });
      }

      // Ordena no frontend para evitar a necessidade de criar um Índice Composto no Firebase agora
      chatsCarregados.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      
      setChats(chatsCarregados);
      setLoading(false);
    });

    return () => unsubChats();
  }, [user]);

  if (loading) return <div className="p-10 text-center font-bold text-blue-500 animate-pulse">Carregando mensagens...</div>;

  return (
    <main className="min-h-screen bg-slate-50 md:py-10">
      <div className="max-w-2xl mx-auto bg-white min-h-screen md:min-h-[600px] md:border md:border-slate-200 md:rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header Inbox */}
        <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-bold text-lg flex-1 text-slate-800">Mensagens</h1>
        </div>

        {/* Lista de Conversas */}
        <div className="divide-y divide-slate-100">
          {chats.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">chat_bubble</span>
              <p>Você ainda não tem mensagens.</p>
              <p className="text-sm mt-1">Visite o perfil de um professor para iniciar!</p>
            </div>
          ) : (
            chats.map(chat => (
              <Link 
                href={`/mensagens/${chat.id}`} 
                key={chat.id} 
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                  {chat.otherUser.photoURL ? (
                    <img src={chat.otherUser.photoURL} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl">
                      {chat.otherUser.displayName?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Resumo da mensagem */}
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-800 text-sm">{chat.otherUser.displayName}</h3>
                  <p className="text-slate-500 text-sm truncate">
                    {chat.lastMessage ? chat.lastMessage : "Envie uma mensagem..."}
                  </p>
                </div>
                
                {/* Ícone de Seta (estético) */}
                <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">
                  chevron_right
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}