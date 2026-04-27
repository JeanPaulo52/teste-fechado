"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function NotificacoesPage() {
  const [user, setUser] = useState<any>(null);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.push('/login');
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Busca as notificações do usuário logado ordenadas da mais nova para a mais velha
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('data', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotificacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  // Função para marcar como lida e redirecionar
  const handleClickNotificacao = async (notificacao: any) => {
    if (!notificacao.lida) {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notificacao.id), {
        lida: true
      });
    }
    router.push(notificacao.link);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 md:py-10">
      <div className="max-w-2xl mx-auto bg-white md:border md:border-slate-200 md:rounded-2xl overflow-hidden min-h-screen md:min-h-0 shadow-sm">
        
        <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-bold text-lg">Notificações</h1>
        </div>

        <div className="divide-y divide-slate-100">
          {notificacoes.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Você ainda não tem notificações.
            </div>
          ) : (
            notificacoes.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleClickNotificacao(notif)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${notif.lida ? 'opacity-70' : 'bg-blue-50/30'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  {notif.remetenteFoto ? (
                    <img src={notif.remetenteFoto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      {notif.remetenteNome.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-bold">{notif.remetenteNome}</span> {notif.texto}
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {new Date(notif.data).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!notif.lida && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-2"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}