import React from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto bg-white/50 backdrop-blur-md dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 relative z-10 w-full pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Rocket className="w-6 h-6" />
            <span className="text-lg font-outfit font-bold text-black dark:text-white">
              Work<span className="text-blue-600 dark:text-blue-400">Chain</span> Pro
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
            <Link to="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Jobs</Link>
            <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
            <Link to="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Profile</Link>
          </nav>

          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} WorkChain Pro. Powered by Ethereum.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
