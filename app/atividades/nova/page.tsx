"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, storage, auth } from "../../lib/firebase"; // ⚠️ Ajuste este caminho para o seu arquivo firebase.ts
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";

const DISCIPLINAS = [
  { slug: 'geral', nome: 'Geral / Multidisciplinar' },
  { slug: 'matematica', nome: 'Matemática' },
  { slug: 'portugues', nome: 'Português' },
  { slug: 'historia', nome: 'História' },
  { slug: 'geografia', nome: 'Geografia' },
  { slug: 'ciencias', nome: 'Ciências' },
  { slug: 'artes', nome: 'Artes' },
  { slug: 'educacao-fisica', nome: 'Educação Física' },
  { slug: 'ingles', nome: 'Inglês' },
];

export default function CriarAtividadePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [materia, setMateria] = useState("");
  const [habilidades, setHabilidades] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);

  // Verifica se o usuário está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Se não estiver logado, manda pro login
        router.push("/login"); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Função para lidar com a escolha da imagem
  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagem(file);
      setPreviewImagem(URL.createObjectURL(file)); // Mostra um preview da foto
    }
  };

  // Função para enviar os dados pro Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Você precisa estar logado!");
    if (!imagem) return alert("Por favor, selecione uma imagem de capa.");
    if (!materia) return alert("Por favor, selecione uma disciplina.");

    setLoading(true);

    try {
      // 1. Fazer o Upload da Imagem para o Firebase Storage
      const imageRef = ref(storage, `atividades/${Date.now()}_${imagem.name}`);
      const uploadResult = await uploadBytes(imageRef, imagem);
      const imagemUrl = await getDownloadURL(uploadResult.ref);

      // 2. Salvar os dados no Firestore
      // Usamos addDoc para o Firebase gerar um ID único automático (que servirá como nosso slug)
      const novaAtividade = {
        titulo,
        descricao,
        materia,
        habilidades,
        imagemUrl,
        autorId: user.uid,
        // Salvamos um fallback básico, mas na exibição vamos puxar do 'users' como combinamos
        autorNome: user.displayName || "Professor Parceiro", 
        autorAvatar: user.photoURL || null,
        dataCriacao: new Date().toISOString(),
      };

      await addDoc(collection(db, "atividades"), novaAtividade);

      alert("🎉 Atividade publicada com sucesso!");
      
      // Redireciona para a página da disciplina que ele acabou de postar
      router.push(`/atividades/${materia}`);

    } catch (error) {
      console.error("Erro ao publicar atividade:", error);
      alert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Se ainda estiver carregando a verificação do usuário, mostra tela branca (evita piscar o form)
  if (!user) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Cabeçalho do Form */}
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2">Compartilhar Atividade</h1>
          <p className="text-blue-100">Inspire outros professores com suas ideias e materiais.</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* TÍTULO */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-700">Título da Atividade *</label>
            <input 
              required
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Jogo da Memória Silábico"
              className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DISCIPLINA (A MÁGICA ACONTECE AQUI) */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700">Disciplina *</label>
              <select 
                required
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
              >
                <option value="" disabled>Selecione uma categoria...</option>
                {DISCIPLINAS.map(d => (
                  <option key={d.slug} value={d.slug}>{d.nome}</option>
                ))}
              </select>
            </div>

            {/* HABILIDADES */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700">Habilidades (Opcional)</label>
              <input 
                type="text"
                value={habilidades}
                onChange={(e) => setHabilidades(e.target.value)}
                placeholder="Ex: EF01MA01, EF15AR04..."
                className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-700">Descrição / Como aplicar *</label>
            <textarea 
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Explique passo a passo como realizar esta atividade com os alunos..."
              className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* UPLOAD DE IMAGEM */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-700">Imagem de Capa *</label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <input 
                required={!previewImagem}
                type="file"
                accept="image/*"
                onChange={handleImagemChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {previewImagem ? (
                <div className="flex flex-col items-center">
                  <img src={previewImagem} alt="Preview" className="h-40 object-contain rounded-lg mb-3 shadow-sm" />
                  <span className="text-sm font-medium text-blue-600">Clique para trocar a imagem</span>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
                  <p className="font-medium text-slate-600">Arraste uma imagem ou clique para procurar</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WEBP (Max. 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* BOTÃO DE ENVIAR */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2
                ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1"}
              `}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Publicando Atividade...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Publicar Atividade
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}