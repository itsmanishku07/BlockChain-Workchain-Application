import React from "react";
import { Rocket, Globe, MessageCircle, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto bg-white/50 backdrop-blur-md dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 relative z-10 w-full pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-4">
              <Rocket className="w-6 h-6" />
              <span className="text-xl font-outfit font-bold tracking-tight text-black dark:text-white">
                Work<span className="text-blue-600 dark:text-blue-400">Chain</span> Pro
              </span>
            </div>
            <p className="text-black dark:text-slate-400 text-sm max-w-sm mb-4">
              The premium decentralized freelance marketplace. Connect experts with top-tier clients, driven by smart contracts.
            </p>
            <div className="flex space-x-4">
              {/* Dummy social links */}
              <a href="#" className="text-black hover:text-blue-500 transition-colors">
                <span className="sr-only">Social</span>
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-black hover:text-blue-500 transition-colors">
                <span className="sr-only">Website</span>
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-black hover:text-blue-500 transition-colors">
                <span className="sr-only">Contact</span>
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-black hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Documentation</a></li>
              <li><a href="#" className="text-sm text-black hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Tutorials</a></li>
              <li><a href="#" className="text-sm text-black hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Smart Contracts</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-black hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-black hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5 text-center px-4">
          <p className="text-sm text-black">
            &copy; {new Date().getFullYear()} WorkChain Pro. Rebuilt for V2. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
