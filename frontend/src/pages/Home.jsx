import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Globe, Star, FileText } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

const Home = () => {
  const { connectWallet, account } = useWeb3();

  const features = [
    {
      title: "Milestone-Based Payments",
      description: "Break down large projects into manageable chunks. Get paid as you complete each phase safely.",
      icon: <FileText className="w-6 h-6 text-blue-500" />
    },
    {
      title: "Trustless Escrow",
      description: "Funds are locked in a smart contract and only released when the work is verifiably complete.",
      icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />
    },
    {
      title: "Global Marketplace",
      description: "Hire or work from anywhere in the world without worrying about currency conversion fees.",
      icon: <Globe className="w-6 h-6 text-cyan-500" />
    },
    {
      title: "Reputation System",
      description: "Build a lasting reputation through immutable ratings and client reviews on the blockchain.",
      icon: <Star className="w-6 h-6 text-yellow-500" />
    },
  ];

  return (
    <div className="flex flex-col animate-fade-in-up">
      <section className="relative py-20 lg:py-32 overflow-hidden text-center">
        <div className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 flex justify-center overflow-hidden [mask-image:radial-gradient(50%_50%_at_50%_50%,white,transparent)]">
          <svg className="w-[800px] h-[800px] text-blue-500/10 dark:text-blue-500/20" viewBox="0 0 1024 1024" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#hero-gradient)" fillOpacity="0.7"></circle>
            <defs>
              <radialGradient id="hero-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) rotate(90) scale(512)">
                <stop stopColor="currentColor"></stop>
                <stop offset="1" stopColor="currentColor" stopOpacity="0"></stop>
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-outfit font-bold tracking-tight text-black dark:text-white leading-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Decentralized
            </span> Work
          </h1>
          <p className="text-lg md:text-xl text-black dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            WorkChain Pro connects elite freelancers with top-tier clients. Experience milestone payments, immutable reputation, and zero-trust escrow completely powered by smart contracts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            <Link to="/jobs" className="btn-primary w-full sm:w-auto text-lg px-8 py-4">
              Explore Jobs
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!account && (
              <button onClick={connectWallet} className="btn-secondary w-full sm:w-auto text-lg px-8 py-4">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-black dark:text-white">
          <div>
            <div className="text-4xl font-bold font-outfit text-blue-600 dark:text-blue-400">5k+</div>
            <div className="text-sm text-black dark:text-slate-400 mt-1 font-medium">Jobs Posted</div>
          </div>
          <div>
            <div className="text-4xl font-bold font-outfit text-blue-600 dark:text-blue-400">2.4M</div>
            <div className="text-sm text-black dark:text-slate-400 mt-1 font-medium">Total Volume ($)</div>
          </div>
          <div>
            <div className="text-4xl font-bold font-outfit text-blue-600 dark:text-blue-400">10k+</div>
            <div className="text-sm text-black dark:text-slate-400 mt-1 font-medium">Freelancers</div>
          </div>
          <div>
            <div className="text-4xl font-bold font-outfit text-blue-600 dark:text-blue-400">99.9%</div>
            <div className="text-sm text-black dark:text-slate-400 mt-1 font-medium">Dispute Resolution</div>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">Why WorkChain Pro?</h2>
          <p className="text-black dark:text-slate-400 max-w-2xl mx-auto">
            Our platform utilizes the Ethereum blockchain to guarantee safety, fairness, and transparency for every gig.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="glass-card p-6 flex flex-col items-start transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="bg-blue-100 dark:bg-slate-800 p-3 rounded-xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">{feature.title}</h3>
              <p className="text-black dark:text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      <section className="py-20 mb-12">
        <div className="glass-card bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-slate-800 dark:to-blue-900 border-none rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
          <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit">Ready to Change How You Work?</h2>
            <p className="text-blue-100 text-lg">
              Join the fastest-growing Web3 marketplace for professional freelancers and visionary clients.
            </p>
            <div className="pt-4 flex justify-center space-x-4">
              <Link to="/jobs" className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 rounded-xl font-semibold shadow-xl transition-all hover:scale-105">
                Find Work
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
