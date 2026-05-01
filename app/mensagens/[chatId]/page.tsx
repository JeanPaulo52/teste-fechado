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
  const params = useParams();
  const chatId = Array.isArray(params?.chatId) ? params.chatId[0] : params?.chatId;
  
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) setCurrentUserProfile(userDoc.data());
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const otherId = chatDoc.data().participants.find((p: string) => p !== user.uid);
          if (otherId) {
            setOtherUserId(otherId);
            
            // Busca o perfil do outro usuário
            const otherUserDoc = await getDoc(doc(db, 'users', otherId));
            
            if (otherUserDoc.exists()) {
              const data = otherUserDoc.data();
              console.log("Dados encontrados do usuário:", data); // Verifique o console do navegador
              setOtherUser(data);
            } else {
              console.log("Documento do usuário não existe no Firestore!");
              setOtherUser({ displayName: "Usuário", uid: otherId });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados (Verifique as Regras de Segurança):", error);
      }
    };
    fetchChatInfo();

    const msgsQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(msgsQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [chatId, user]);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const textoMsg = newMessage;
    setNewMessage(""); 

    await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
      text: textoMsg,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });
    
    await updateDoc(doc(db, 'chats', chatId as string), {
      lastMessage: textoMsg,
      updatedAt: Date.now()
    }); 

    if (otherUserId) {
      await addDoc(collection(db, 'users', otherUserId, 'notifications'), {
        remetenteId: user.uid,
        remetenteNome: currentUserProfile?.displayName || user.displayName || "Alguém",
        remetenteFoto: currentUserProfile?.photoURL || user.photoURL || "",
        texto: "enviou uma nova mensagem.",
        link: `/mensagens/${chatId}`, 
        lida: false,
        data: Date.now()
      });
    }
  };

  if (!otherUser) return <div className="p-10 text-center font-bold text-blue-500 animate-pulse">Carregando chat...</div>;

  return (
    <main className="fixed inset-0 z-[9999] flex flex-col bg-white md:bg-slate-50 md:py-10 overflow-hidden">
      <div className="flex flex-col h-full max-w-2xl mx-auto w-full bg-white md:border md:border-slate-200 md:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER CLICÁVEL */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white/90 backdrop-blur-md shrink-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          {/* Área clicável do perfil */}
          <div 
            onClick={() => router.push(`/profile/${otherUserId}`)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-slate-100 p-[2px] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden bg-white border border-white">
                {otherUser.photoURL ? (
                  <img src={otherUser.photoURL} className="w-full h-full object-cover" alt="Perfil" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-slate-100 text-sm">
                    {otherUser.displayName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-lg tracking-tight leading-none group-hover:text-blue-600">
                {otherUser.displayName || "Usuário"}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Ver Perfil</span>
            </div>
          </div>
        </div>

        {/* Mensagens e Form de Envio permanecem iguais... */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-[15px] shadow-sm ${
                msg.senderId === user?.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} className="h-2" />
        </div>

        <form onSubmit={sendMessage} className="p-3 px-4 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex-1 bg-slate-100 border border-slate-200 rounded-3xl flex items-center px-4 py-1 min-h-[48px]">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mensagem..."
              className="w-full bg-transparent border-none text-slate-900 focus:ring-0 outline-none py-2"
            />
          </div>
          <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined ml-1">send</span>
          </button>
        </form>
      </div>
    </main>
  );
}