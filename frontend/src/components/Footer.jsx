import { MapPin, Send, Newspaper, TrendingUp, LayoutDashboard, Globe } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-white border-t border-slate-200/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 border-none bg-transparent cursor-pointer p-0 text-left"
            >
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <MapPin size={16} className="text-slate-900" />
              </div>
              <span className="text-base font-bold text-slate-900">
                JanSujhav
              </span>
            </button>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              An AI-powered constituency development platform. Bridging the gap between complex governance and everyday citizens. Participate, propose, and prioritize what matters most to your community.
            </p>
          </div>

          {/* Citizen Portal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Citizen Portal</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                { label: 'Submit Suggestion', view: 'citizen', icon: Send },
                { label: 'Priority Proposals', view: 'proposals', icon: TrendingUp },
                { label: 'Local News Feed', view: 'news', icon: Newspaper },
                { label: 'WhatsApp Simulator', view: 'whatsapp', icon: Send },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => onNavigate(item.view)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 bg-transparent border-none p-0 cursor-pointer transition-all font-medium"
                  >
                    <item.icon size={12} className="text-slate-400" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Representatives / MP Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">For Representatives</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('mp-dashboard')}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 bg-transparent border-none p-0 cursor-pointer transition-all font-medium"
                >
                  <LayoutDashboard size={12} className="text-slate-400" />
                  MP Insights Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('settings')}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 bg-transparent border-none p-0 cursor-pointer transition-all font-medium"
                >
                  <Globe size={12} className="text-slate-400" />
                  Account Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[11px] text-slate-400 font-medium">
            © 2026 JanSujhav (People's Priorities). Built for Communities.
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-[11px] text-slate-400 hover:text-slate-600 no-underline font-medium">Privacy Policy</a>
            <a href="#" className="text-[11px] text-slate-400 hover:text-slate-600 no-underline font-medium">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
