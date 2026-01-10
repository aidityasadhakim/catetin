import { Link } from '@tanstack/react-router';

export default function Footer() {
  return (
    <footer className="bg-black text-ivory py-16 border-t-4 border-gold">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="font-heading text-3xl tracking-widest">CATETIN</h2>
            <p className="font-body text-slate max-w-sm">
              A digital sanctuary for your thoughts, blending the wisdom of the past with the technology of the future.
            </p>
            <div className="flex gap-4">
               {/* Social placeholders */}
               <div className="w-8 h-8 border border-slate rounded-full flex items-center justify-center hover:bg-gold hover:text-black hover:border-gold transition-colors cursor-pointer">X</div>
               <div className="w-8 h-8 border border-slate rounded-full flex items-center justify-center hover:bg-gold hover:text-black hover:border-gold transition-colors cursor-pointer">Ig</div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate mb-6">Navigation</h3>
            <ul className="space-y-4 font-body text-sm">
              <li><Link to="/" className="hover:text-gold transition-colors">Beranda</Link></li>
              <li><Link to="/" className="hover:text-gold transition-colors">Jurnal</Link></li>
              <li><Link to="/" className="hover:text-gold transition-colors">Galeri</Link></li>
              <li><Link to="/" className="hover:text-gold transition-colors">Tentang Kami</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate mb-6">Legal</h3>
            <ul className="space-y-4 font-body text-sm">
              <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-slate text-xs font-mono">
           <div>© 2024 CATETIN. All rights reserved.</div>
           <div className="mt-4 md:mt-0">Crafted with precision.</div>
        </div>
      </div>
    </footer>
  );
}
