export default function Footer() {
  return (
    <footer className="mt-auto relative">
      {/* High-tech Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />

      <div className="bg-white/80 backdrop-blur-md border-t border-gray-100/50 py-6 md:py-5">
        <div className="mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">

            {/* Left Side: Brand & Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-[10px] font-black text-white italic">S</span>
                  <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors uppercase">Syntel</span>
                  <div className="h-[2px] w-0 bg-red-600 group-hover:w-full transition-all duration-500 rounded-full" />
                </div>
              </div>

              <div className="hidden sm:block h-4 w-px bg-gray-200 mx-2" />

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                © {new Date().getFullYear()} <span className="text-gray-900">Telkom Indonesia</span>. All rights reserved.
              </p>
            </div>

            {/* Right Side: Navigation Links & Status */}
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 w-full md:w-auto">
              <div className="flex items-center justify-center gap-6 sm:gap-8 flex-1">
                {[
                  { label: "Bantuan", href: "#" },
                  { label: "Privasi", href: "#" },
                  { label: "Ketentuan", href: "#" },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className="relative text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-all group py-1"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-red-600 transition-all duration-300 group-hover:w-full rounded-full" />
                  </a>
                ))}
              </div>

              {/* System Status Indicator */}
              <div className="flex items-center gap-2 sm:pl-6 sm:ml-6 sm:border-l border-gray-100 pt-4 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto justify-center">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">System Operational</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}


