"use client";
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  doc, getDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export default function ChatRoom() {
  const { chatId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  
  // 🌟 NOVO: Estado para guardar o ID do outro usuário para a notificação
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // 1. Carregar mensagens e info do outro usuário
  useEffect(() => {
    if (!chatId || !user) return;

    // Buscar quem é o outro participante
    const fetchChatInfo = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId as string));
      if (chatDoc.exists()) {
        const otherId = chatDoc.data().participants.find((p: string) => p !== user.uid);
        if (otherId) {
          setOtherUserId(otherId); // 🌟 NOVO: Guardamos o ID aqui
          const userDoc = await getDoc(doc(db, 'users', otherId));
          if (userDoc.exists()) setOtherUser(userDoc.data());
        }
      }
    };
    fetchChatInfo();

    // Ouvir mensagens em tempo real
    const msgsQuery = query(
      collection(db, 'chats', chatId as string, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(msgsQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Scroll para a última mensagem
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [chatId, user]);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const textoMsg = newMessage;
    setNewMessage(""); // Limpa o input imediatamente para melhor experiência

    // 1. Salva a mensagem na subcoleção
    await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
      text: textoMsg,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });
    
    // 2. Atualiza o "resumo" do chat para a lista de conversas
    await updateDoc(doc(db, 'chats', chatId as string), {
      lastMessage: textoMsg,
      updatedAt: Date.now()
    }); 

    // 🌟 NOVA PARTE: DISPARAR NOTIFICAÇÃO PARA O OUTRO USUÁRIO 🌟
    if (otherUserId) {
      await addDoc(collection(db, 'users', otherUserId, 'notifications'), {
        remetenteId: user.uid,
        remetenteNome: user.displayName || "Alguém",
        remetenteFoto: user.photoURL || "",
        texto: "enviou uma nova mensagem.",
        // Assumindo que a rota do chat é /mensagens/[chatId]. Ajuste se for diferente!
        link: `/mensagens/${chatId}`, 
        lida: false,
        data: Date.now()
      });
    }
    // ==========================================================
  };

  if (!otherUser) return <div className="p-10 text-center font-bold text-blue-500 animate-pulse">Carregando chat...</div>;

  return (
    <main className="flex flex-col h-screen bg-slate-50 md:py-10">
      <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full bg-white md:border md:border-slate-200 md:rounded-2xl overflow-hidden shadow-sm relative">
        
        {/* Header do Chat */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white z-10 sticky top-0">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
            {otherUser.photoURL ? (
              <img src={otherUser.photoURL} className="w-full h-full object-cover" alt="Perfil" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                {otherUser.displayName?.charAt(0)}
              </div>
            )}
          </div>
          <span className="font-bold text-slate-800">{otherUser.displayName}</span>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-10">
              Envie uma mensagem para iniciar a conversa!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.senderId === user?.uid 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input de Mensagem */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-slate-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </main>
  );
}