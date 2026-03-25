import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Monitor, Briefcase, User, Menu, X, Rocket, LayoutDashboard, Sun, Moon, LogOut, LogIn } from "lucide-react";
import clsx from "clsx";

const Navbar = () => {
  const { account, balance, connectWallet, isClient, setIsClient, isLoading, error } = useWeb3();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Explore Jobs", path: "/jobs", icon: <Briefcase className="w-4 h-4 mr-2" /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { name: "Profile", path: "/profile", icon: <User className="w-4 h-4 mr-2" /> },
  ];

  return (
    <>
    <nav className="fixed top-0 w-full z-50 glass-card mx-auto max-w-full rounded-none border-t-0 border-x-0 !border-b-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Rocket className="w-8 h-8" />
              <span className="text-2xl font-outfit font-bold tracking-tight text-black dark:text-white">
                Work<span className="text-blue-600 dark:text-blue-400">Chain</span> Pro
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="hidden md:flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.path
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-black hover:text-black hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            {/* Client / Freelancer Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setIsClient(false)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  !isClient
                    ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400"
                    : "text-black hover:text-black dark:text-slate-400 dark:hover:text-black"
                )}
              >
                Freelancer
              </button>
              <button
                onClick={() => setIsClient(true)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  isClient
                    ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400"
                    : "text-black hover:text-black dark:text-slate-400 dark:hover:text-black"
                )}
              >
                Client
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {account ? (
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-black dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center space-x-2 border-r border-slate-300 dark:border-slate-600 pr-3">
                  <span className="text-blue-600 dark:text-blue-400">{balance} ETH</span>
                </div>
                <div className="flex items-center space-x-2 pl-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                  <span>
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                </div>
                {/* User Login/Logout */}
            <div className="pl-2 flex items-center">
              {currentUser ? (
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors font-bold text-sm shadow-md shadow-blue-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </Link>
              )}
            </div>
          </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="btn-primary py-2 px-5 text-sm"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-black hover:text-black hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-card !rounded-none border-x-0 border-b-0">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={toggleMenu}
                className={clsx(
                  "flex items-center px-3 py-2 rounded-md text-base font-medium",
                  location.pathname === link.path
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-black hover:text-black hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-700">
              <div className="px-3 mb-2 text-xs font-semibold text-black uppercase">View Mode</div>
              <div className="flex items-center space-x-2 px-3">
                <button
                  onClick={() => { setIsClient(false); toggleMenu(); }}
                  className={clsx(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-lg text-center",
                    !isClient
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 inline-block w-full text-center"
                      : "bg-slate-100 text-black dark:bg-slate-800 dark:text-slate-300 inline-block w-full text-center"
                  )}
                >
                  Freelancer
                </button>
                <button
                  onClick={() => { setIsClient(true); toggleMenu(); }}
                  className={clsx(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-lg text-center",
                    isClient
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 inline-block w-full text-center"
                      : "bg-slate-100 text-black dark:bg-slate-800 dark:text-slate-300 inline-block w-full text-center"
                  )}
                >
                  Client
                </button>
              </div>
            </div>

            {/* Mobile Theme Toggle */}
            <div className="pt-2 pb-2 px-3">
              <button
                onClick={() => { toggleTheme(); toggleMenu(); }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="pt-4 pb-2 border-t border-slate-300 dark:border-slate-700 px-3">
              {account ? (
                <div className="flex flex-col space-y-2 w-full justify-center bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-black dark:text-white border border-slate-300">
                  <div className="flex justify-between w-full border-b border-slate-200 pb-2 mb-1">
                    <span className="text-black">Balance:</span>
                    <span className="text-blue-600">{balance} ETH</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { connectWallet(); toggleMenu(); }}
                  className="btn-primary w-full"
                >
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Mobile Auth */}
            <div className="pt-4 pb-4 border-t border-slate-300 dark:border-slate-700 px-3">
              {currentUser ? (
                <button
                  onClick={() => { logout(); toggleMenu(); }}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Log Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={toggleMenu}
                  className="flex items-center w-full px-3 py-2 text-base font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  <LogIn className="w-5 h-5 mr-3" />
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    {error && (
      <div className="fixed top-16 left-0 w-full z-40 bg-red-500/90 text-white p-3 text-center shadow-lg text-sm font-medium flex items-center justify-center space-x-2 backdrop-blur-sm">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    )}
    </>
  );
};

export default Navbar;
