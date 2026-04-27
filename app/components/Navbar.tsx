"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import BotaoNovoPost from '../components/BotaoNovoPost'; 
import BarraPesquisa from './BarraPesquisa'; 

export default function Navbar() {
  const router = useRouter();
  
  // Estados de Autenticação e Dados
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado de Notificações
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Estado do Menu Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fica escutando se o usuário logou ou deslogou
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 1. Busca a foto em tempo real no Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setLoading(false);
        });

        // 2. Busca notificações não lidas em tempo real
        const notifQuery = query(
          collection(db, "users", currentUser.uid, "notifications"),
          where("lida", "==", false)
        );
        const unsubscribeNotif = onSnapshot(notifQuery, (snap) => {
          setUnreadCount(snap.docs.length);
        });

        // Limpa os escutadores quando deslogar ou mudar de tela
        return () => {
          unsubscribeDoc();
          unsubscribeNotif();
        };
      } else {
        setUserData(null);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="text-lg sm:text-2xl font-extrabold">
          <span className="text-red-600">Atividade</span>
          <span className="text-blue-600">Adaptada</span>
          <span className="text-slate-900">.com</span>
        </Link>

        {/* LINKS DESKTOP (Escondido no celular) */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="font-bold text-blue-600 hover:text-blue-700 transition">Início</Link>
          <Link href="/atividades" className="text-slate-600 hover:text-blue-600 transition font-medium">Atividades</Link>
          <Link href="/artigos" className="text-slate-600 hover:text-blue-600 transition font-medium">Artigos</Link>
          <BotaoNovoPost />
        </div>

        {/* ÁREA DO USUÁRIO DESKTOP */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* BARRA DE PESQUISA NO DESKTOP */}
          <BarraPesquisa />

          {loading ? (
            <div className="w-10 h-10 bg-slate-200 animate-pulse rounded-full"></div>
          ) : user ? (
            // MOSTRA ÍCONES E A FOTO SE ESTIVER LOGADO
            <div className="flex items-center gap-4">
              
              {/* BOTÃO DE NOTIFICAÇÕES (Sininho) */}
              <Link 
                href="/notificacoes" 
                className="text-slate-400 hover:text-blue-600 transition-colors flex items-center relative group" 
                title="Notificações"
              >
                <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* BOTÃO DE MENSAGENS */}
              <Link 
                href="/mensagens" 
                className="text-slate-400 hover:text-blue-600 transition-colors flex items-center relative group" 
                title="Mensagens"
              >
                <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
                  chat_bubble
                </span>
              </Link>

              {/* FOTO DE PERFIL */}
              <Link href="/profile" className="group flex items-center gap-3" title="Meu Perfil">
                <div className="w-11 h-11 rounded-full border-2 border-blue-500 overflow-hidden bg-slate-100 transition-transform group-hover:scale-105 shadow-sm">
                  {userData?.photoURL || user.photoURL ? (
                    <img 
                      src={userData?.photoURL || user.photoURL} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            // MOSTRA O BOTÃO ENTRAR SE NÃO ESTIVER LOGADO
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2 px-6 rounded-full hover:shadow-lg transition-all"
            >
              Entrar
            </Link>
          )}
        </div>

        {/* BOTÃO HAMBÚRGUER E LUPA MOBILE */}
        <div className="md:hidden flex items-center gap-2">
          <BarraPesquisa />
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

      </nav>

      {/* MENU MOBILE (Desce quando clica no hambúrguer) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-slate-50 px-4 pt-2 pb-6 space-y-2 shadow-inner">
          
          {user && (
            <div className="flex items-center gap-3 py-4 border-b border-slate-200 mb-2">
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-12 h-12 rounded-full border-2 border-blue-500 overflow-hidden bg-slate-100">
                  {userData?.photoURL || user.photoURL ? (
                    <img src={userData?.photoURL || user.photoURL} className="w-full h-full object-cover" alt="Perfil" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xl">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{userData?.displayName || "Usuário"}</p>
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-xs text-blue-600 hover:underline">Ver perfil</Link>
              </div>
            </div>
          )}

          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-xl text-slate-700 font-bold hover:bg-slate-200">Início</Link>
          <Link href="/atividades" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Atividades</Link>
          <Link href="/artigos" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Artigos</Link>          
          
          {user && (
            <>
              {/* BOTÃO DE NOTIFICAÇÕES MOBILE */}
              <Link 
                href="/notificacoes" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="flex items-center justify-between py-3 px-4 rounded-xl text-slate-700 font-medium hover:bg-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px] text-blue-600">notifications</span>
                  Notificações
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* BOTÃO DE MENSAGENS MOBILE */}
              <Link 
                href="/mensagens" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="flex items-center gap-3 py-3 px-4 rounded-xl text-slate-700 font-medium hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[22px] text-blue-600">chat_bubble</span>
                Mensagens
              </Link>
            </>
          )}

          <div className="pt-4 mt-2 border-t border-slate-200">
            {user ? (
              <button 
                onClick={handleLogout} 
                className="w-full text-center bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 transition"
              >
                Sair da conta
              </button>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}