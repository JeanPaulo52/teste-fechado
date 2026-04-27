"use client";

import { useEffect } from "react";
import { auth } from "../lib/firebase"; // Ajuste o caminho se a sua pasta lib estiver em outro lugar
import { onAuthStateChanged } from "firebase/auth";

export default function AuthCookieHelper() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se logou, cria o Cookie com o ID que dura 30 dias
        document.cookie = `user_uid=${user.uid}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        // Se saiu da conta, apaga o Cookie
        document.cookie = `user_uid=; path=/; max-age=0; SameSite=Lax`;
      }
    });

    return () => unsubscribe();
  }, []);

  // Ele retorna null porque não queremos que apareça nada na tela, ele só trabalha nos bastidores!
  return null; 
}