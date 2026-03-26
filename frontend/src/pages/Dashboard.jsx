import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";
import { Briefcase, CreditCard, Star, Activity, AlertCircle, Loader2, User } from "lucide-react";
import { formatEther } from "ethers";

const Dashboard = () => {
  const { account, contract, isClient, balance } = useWeb3();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserJobs = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobCount = await contract.jobCounter();
        const userJobs = [];

        for (let i = 1; i <= Number(jobCount); i++) {
          const job = await contract.jobs(i);
          // If client, fetch jobs they posted
          if (isClient && job.client.toLowerCase() === account.toLowerCase()) {
            const proposalCount = Number(job.status) === 0 ? (await contract.getJobProposals(i)).length : 0;
            userJobs.push({
              id: Number(job.id),
              title: job.title,
              proposals: proposalCount,
              amount: formatEther(job.budget) + " ETH",
              status: Number(job.status) === 0 ? "Open" : Number(job.status) === 1 ? "In Progress" : "Completed"
            });
          }
          // If freelancer, ideally fetch jobs assigned to them, 
          // but for MVP we match if they are assigned.
          else if (!isClient && job.assignedFreelancer.toLowerCase() === account.toLowerCase()) {
            userJobs.push({
              id: Number(job.id),
              title: job.title,
              proposals: 0,
              amount: formatEther(job.budget) + " ETH",
              status: Number(job.status) === 0 ? "Open" : Number(job.status) === 1 ? "In Progress" : "Completed"
            });
          }
        }

        setActiveJobs(userJobs.reverse()); // Newest first
      } catch (err) {
        console.error("Error fetching dashboard jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserJobs();
  }, [contract, account, isClient]);

  const stats = isClient
    ? [
      { label: "Active Contracts", value: activeJobs.length, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
      { label: "Total Spent", value: "0.00 ETH", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
      { label: "Freelancers Hired", value: "0", icon: User, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
    ]
    : [
      { label: "Active Contracts", value: activeJobs.length, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
      { label: "Total Earnings", value: "0.00 ETH", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
      { label: "Reputation Score", value: "5.0", icon: Star, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    ];

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
        <AlertCircle className="w-16 h-16 text-black mb-4" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Wallet Disconnected</h2>
        <p className="text-black dark:text-slate-400">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white font-outfit">
            {isClient ? "Client Dashboard" : "Freelancer Dashboard"}
          </h1>
          <p className="text-black dark:text-slate-400 mt-1">
            Welcome back, {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </p>
        </div>
        {!isClient && (
          <div className="flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl font-semibold">
            <Star className="w-4 h-4 mr-1 fill-current" /> {stats[2].value}/5.0
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-black dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-black dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity / Jobs */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black dark:text-white font-outfit">
            {isClient ? "Your Posted Jobs" : "Your Active Contracts"}
          </h2>
          {isClient && (
            <Link to="/post-job" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">
              + Post New Job
            </Link>
          )}
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-black dark:text-slate-400">Loading Active Contracts...</span>
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="py-8 text-center text-black dark:text-slate-400">
              You have no active contracts at this time.
            </div>
          ) : activeJobs.map(job => (
            <div key={job.id} className="py-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                  {job.title}
                </h3>
                <p className="text-sm text-black dark:text-slate-400 mt-1">
                  Budget: <span className="font-semibold text-black dark:text-slate-300">{job.amount}</span>
                  {isClient && job.status === "Open" && job.proposals > 0 && (
                    <span className="ml-4 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full text-xs">
                      {job.proposals} New Application{job.proposals > 1 ? 's' : ''}!
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`badge ${job.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                  job.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                  {job.status}
                </span>
                <button 
                  onClick={() => navigate(job.status === "Open" ? `/jobs/${job.id}` : `/workspace/${job.id}`)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition lg:ml-4 text-black dark:text-white"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
