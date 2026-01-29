export default function Footer() {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-6 max-w-[1400px] flex flex-col items-center text-center">
        <div className="text-[12vw] font-bold text-slate-700/20 leading-none select-none tracking-tighter hover:text-slate-800/20 transition-colors cursor-default">
          MedLM
        </div>
        <div className="flex gap-8 mt-12 mb-20">
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            Twitter
          </a>
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            GitHub
          </a>
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            Email
          </a>
        </div>
        <div className="text-slate-500 text-sm font-medium">
          <div className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} MedLM Inc. Privacy First Health AI.
          </div>
        </div>
      </div>
    </footer>
  );
}
