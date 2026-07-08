import { ArrowRight, Mic, BarChart3, Users, Shield, TrendingUp, Globe } from 'lucide-react';

/**
 * LandingPage — hero & features overview
 * Props: { onNavigate, constituency }
 */
export default function LandingPage({ onNavigate, constituency }) {
  const features = [
    {
      icon: Mic,
      title: 'Voice-First Submissions',
      description: 'Speak in any of 12 Indian languages. AI transcribes, categorizes, and routes your concern automatically.',
    },
    {
      icon: BarChart3,
      title: 'Demand-Ranked Priorities',
      description: 'Proposals ranked by a transparent 40/60 citizen-signal + structural-need formula.',
    },
    {
      icon: Users,
      title: 'MP Command Center',
      description: 'Real-time analytics, gap analysis, and AI-powered budget recommendations for elected officials.',
    },
    {
      icon: Shield,
      title: 'Transparent Governance',
      description: 'Every ranking is explainable. Citizens see exactly why one proposal outranks another.',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#BFDDF0]/20 via-[#FFF9D2]/10 to-transparent pt-24 pb-20 px-6 text-center overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(140,192,235,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-800 leading-[1.1] mb-6">
            Empowering{' '}
            <span className="bg-gradient-to-r from-[#5BA3D9] to-[#8CC0EB] bg-clip-text text-transparent">
              Every Voice
            </span>
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-10">
            A modern, transparent platform bridging the gap between complex governance and the everyday citizen. Participate, propose, and prioritize what matters most to your community.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => onNavigate('citizen')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#8CC0EB] text-white font-semibold text-[15px] rounded-xl border-none cursor-pointer font-[inherit] hover:bg-[#5BA3D9] hover:shadow-lg hover:shadow-[#8CC0EB]/20 transition-all duration-300 group"
            >
              Get Started
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onNavigate('proposals')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-700 font-semibold text-[15px] rounded-xl border border-slate-200 cursor-pointer font-[inherit] hover:border-[#BFDDF0] hover:shadow-sm transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="max-w-4xl mx-auto px-6 -mt-2 mb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            { value: '15k+', label: 'PROPOSALS' },
            { value: '4.2M', label: 'CITIZENS' },
            { value: '89%', label: 'RESOLUTION RATE' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center py-4 md:py-0">
              <span className="text-3xl font-bold text-[#5BA3D9] tracking-tight">{stat.value}</span>
              <span className="text-xs font-semibold text-slate-400 tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">
            How JanSujhav Works
          </h2>
          <p className="text-slate-500 text-[15px] max-w-lg mx-auto">
            Designed to make democratic participation intuitive and accessible for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-xl border border-slate-100 p-7 hover:border-[#BFDDF0] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-[#BFDDF0]/25 flex items-center justify-center mb-5">
                <feature.icon size={20} className="text-[#5BA3D9]" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#5BA3D9]">JanSujhav</span>
            <span className="text-xs text-slate-400">© 2026 JanSujhav. Towards Transparent Governance.</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Accessibility', 'Contact Us'].map((link) => (
              <button key={link} className="text-xs text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer font-[inherit]">
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
