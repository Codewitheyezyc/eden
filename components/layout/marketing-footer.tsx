import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-900/50 bg-white dark:bg-[#030303] pt-16 pb-12 transition-colors relative overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-auto" />
              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase shrink-0">
                Beta
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">
              Elevating administration and learning for the Loveworld Art Academy. Pure performance, absolute isolation.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link href="#features" className="hover:text-emerald-500 transition-colors">Core Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-emerald-500 transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing Options</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-emerald-500 transition-colors">Contact Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Developer</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">
              Designed & engineered with care by <span className="font-semibold text-gray-700 dark:text-gray-200">CreedTech</span>.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200/50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>
            © {new Date().getFullYear()} Loveworld Arts Academy. All rights reserved.
          </div>
          <div className="flex items-center space-x-1">
            <span>Developed by</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">CreedTech</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
