import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 mt-20">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="text-2xl font-extrabold tracking-tight flex gap-1 mb-4">
            <span className="text-red-500">Atividade</span>
            <span className="text-blue-500">Adaptada</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            A maior plataforma de atividades adaptadas e alinhadas à BNCC para facilitar o dia a dia do educador.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Navegação</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link href="/" className="hover:text-blue-400 transition-colors">Página Inicial</Link></li>
            <li><Link href="/atividades" className="hover:text-blue-400 transition-colors">Catálogo de Atividades</Link></li>
            <li><Link href="/artigos" className="hover:text-blue-400 transition-colors">Blog e Artigos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Acompanhe</h4>
          <p className="text-sm mb-4">Siga nossas redes sociais para receber novos materiais gratuitos.</p>
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 text-white cursor-pointer transition-colors font-bold">In</div>
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 text-white cursor-pointer transition-colors font-bold">Fb</div>
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 text-white cursor-pointer transition-colors font-bold">Ig</div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Atividade Adaptada. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}