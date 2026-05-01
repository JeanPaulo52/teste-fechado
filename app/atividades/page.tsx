import Link from 'next/link';

const disciplinas = [
  { id: 'artes', nome: 'Artes', corFundo: 'bg-pink-100', corIcone: 'text-pink-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg> },
  { id: 'biologia', nome: 'Biologia', corFundo: 'bg-rose-100', corIcone: 'text-rose-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg> },
  { id: 'ciencias', nome: 'Ciências', corFundo: 'bg-green-100', corIcone: 'text-green-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1014.12 11.88a3 3 0 00-4.242 4.242z"></path></svg> },
  { id: 'desenhos', nome: 'Desenhos', corFundo: 'bg-violet-100', corIcone: 'text-violet-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> },
  { id: 'educacao-fisica', nome: 'Educação Física', corFundo: 'bg-orange-100', corIcone: 'text-orange-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5 10m7 0a2 2 0 002 2h2.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 009.263 3h-4.017c-.163 0-.326-.02-.485-.06L2 4v6h4l2-6m4 10a2 2 0 01-2-2V5"></path></svg> },
  { id: 'educacao-financeira', nome: 'Educação Financeira', corFundo: 'bg-sky-100', corIcone: 'text-sky-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0 1v.01M12 18v-1m0-1v-5m-4 5h8a2 2 0 002-2V9a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg> },
  { id: 'fisica', nome: 'Física', corFundo: 'bg-lime-100', corIcone: 'text-lime-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
  { id: 'filosofia', nome: 'Filosofia', corFundo: 'bg-amber-100', corIcone: 'text-amber-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg> },
  { id: 'geografia', nome: 'Geografia', corFundo: 'bg-indigo-100', corIcone: 'text-indigo-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> },
  { id: 'historia', nome: 'História', corFundo: 'bg-yellow-100', corIcone: 'text-yellow-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg> },
  { id: 'ingles', nome: 'Inglês', corFundo: 'bg-purple-100', corIcone: 'text-purple-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9M3 12a9 9 0 009 9"></path></svg> },
  { id: 'quimica', nome: 'Química', corFundo: 'bg-lime-100', corIcone: 'text-lime-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
  { id: 'livros', nome: 'Livros', corFundo: 'bg-fuchsia-100', corIcone: 'text-fuchsia-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
  { id: 'matematica', nome: 'Matemática', corFundo: 'bg-blue-100', corIcone: 'text-blue-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg> },
  { id: 'portugues', nome: 'Português', corFundo: 'bg-red-100', corIcone: 'text-red-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5V3.935m-14 0A2.5 2.5 0 018.5 2h7A2.5 2.5 0 0118 4.5v8.03A2.5 2.5 0 0115.5 15H9.5a2.5 2.5 0 01-2.5-2.5V4.5A2.5 2.5 0 016 2z"></path></svg> },
  { id: 'raciocinio-logico', nome: 'Raciocínio Lógico', corFundo: 'bg-gray-100', corIcone: 'text-gray-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0 1.172 1.953 1.172 5.119 0 7.072zM12 20.5v.01M12 3.5v.01"></path></svg> },
  { id: 'sociologia', nome: 'Sociologia', corFundo: 'bg-emerald-100', corIcone: 'text-emerald-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2m-6 4h.01M9 13h.01M15 13h.01M12 13h.01M12 10h.01M12 7h.01M6 21v-2a4 4 0 014-4h2a4 4 0 014 4v2m-6 4h.01M6 13h.01M6 10h.01M6 7h.01M6 4h.01M18 21v-2a4 4 0 00-4-4h-2a4 4 0 00-4 4v2m-6 4h.01M18 13h.01M18 10h.01M18 7h.01M18 4h.01"></path></svg> },
  { id: 'simulados', nome: 'Simulados', corFundo: 'bg-amber-100', corIcone: 'text-amber-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20V10M18 20V4M6 20v-4"></path></svg> },
  { id: 'infantil', nome: 'Infantil', corFundo: 'bg-cyan-100', corIcone: 'text-cyan-600', icone: <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> },
];

export default function PaginaCategorias() {
  return (
    <div className="bg-slate-50 min-h-screen">
      

      {/* ÁREA DOS CARDS */}
      <main className="container mx-auto px-4 md:px-6 py-12 max-w-7xl">
        
        {/* Aqui mudamos para grid-cols-2 no celular e aumentamos nos outros tamanhos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          
          {disciplinas.map((disc) => (
            <Link 
              key={disc.id} 
              href={`/atividades/${disc.id}`}
              className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-cyan-500 transition-all duration-300 border-2 border-slate-200 group"
            >
              <div className={`${disc.corFundo} rounded-full p-4 md:p-5 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className={disc.corIcone}>
                  {disc.icone}
                </div>
              </div>
              
              {/* O texto ficou um pouco menor no celular (text-sm) para nomes longos como "Educação Financeira" não quebrarem feio */}
              <h3 className="font-bold text-sm md:text-base lg:text-lg text-slate-800 group-hover:text-cyan-600 transition-colors leading-tight">
                {disc.nome}
              </h3>
            </Link>
          ))}
          
        </div>
      </main>
    </div>
  );
}