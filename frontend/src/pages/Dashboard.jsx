import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { Briefcase, CreditCard, Star, AlertCircle, Loader2, User, TrendingUp, Download } from "lucide-react";
import { formatEther } from "ethers";

const Dashboard = () => {
  const { account, contract, isClient } = useWeb3();
  const navigate = useNavigate();
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState("0.0000");
  const [totalSpent, setTotalSpent] = useState("0.0000");
  const [freelancersHired, setFreelancersHired] = useState(0);
  const [rating, setRating] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!contract || !account) { setLoading(false); return; }
      try {
        setLoading(true);
        const jobCount = await contract.jobCounter();
        const userJobs = [];
        let spent = 0n;
        const hiredSet = new Set();

        for (let i = 1; i <= Number(jobCount); i++) {
          const job = await contract.jobs(i);
          const jobStatus = Number(job.status);
          const statusLabel = jobStatus === 0 ? "Open" : jobStatus === 1 ? "In Progress" : jobStatus === 2 ? "Completed" : jobStatus === 3 ? "Disputed" : jobStatus === 4 ? "Cancelled" : "Closed";

          if (isClient && job.client.toLowerCase() === account.toLowerCase()) {
            let proposalCount = 0;
            if (jobStatus === 0) { try { const props = await contract.getJobProposals(i); proposalCount = props.length; } catch (_) {} }
            if (jobStatus === 5) { spent += job.budget; }
            if (job.assignedFreelancer !== "0x0000000000000000000000000000000000000000") hiredSet.add(job.assignedFreelancer);
            userJobs.push({ id: Number(job.id), title: job.title, proposals: proposalCount, amount: formatEther(job.budget) + " ETH", status: statusLabel });
          } else if (!isClient && job.assignedFreelancer !== "0x0000000000000000000000000000000000000000" && job.assignedFreelancer.toLowerCase() === account.toLowerCase()) {
            userJobs.push({ id: Number(job.id), title: job.title, proposals: 0, amount: formatEther(job.budget) + " ETH", status: statusLabel });
          }
        }

        setActiveJobs(userJobs.reverse());

        if (isClient) {
          setTotalSpent(parseFloat(formatEther(spent)).toFixed(4));
          setFreelancersHired(hiredSet.size);
        } else {
          const rawEarnings = await contract.earnings(account);
          setEarnings(parseFloat(formatEther(rawEarnings)).toFixed(4));
          try {
            const ratingRaw = await contract.getFreelancerRating(account);
            const r = Number(ratingRaw);
            setRating(r > 0 ? (r / 100).toFixed(1) : null);
          } catch (_) {}
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contract, account, isClient]);

  const handleWithdraw = async () => {
    if (!contract || parseFloat(earnings) <= 0) return;
    try {
      setWithdrawing(true);
      setWithdrawError("");
      setWithdrawSuccess("");
      const profile = await contract.freelancerProfiles(account);
      if (!profile.exists) {
        setWithdrawError("You need an on-chain profile to withdraw. Go to Profile and sync it.");
        return;
      }
      const rawEarnings = await contract.earnings(account);
      if (rawEarnings === 0n) {
        setWithdrawError("No earnings available to withdraw.");
        return;
      }
      setWithdrawSuccess("Earnings are automatically sent to your wallet when funds are released. Your balance is already in your MetaMask.");
    } catch (err) {
      setWithdrawError(err.reason || err.message || "Withdrawal failed.");
    } finally {
      setWithdrawing(false);
    }
  };

  const stats = isClient
    ? [
        { label: "Active Contracts", value: activeJobs.filter(j => j.status !== "Closed" && j.status !== "Cancelled").length, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { label: "Total Spent", value: totalSpent + " ETH", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
        { label: "Freelancers Hired", value: freelancersHired, icon: User, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
      ]
    : [
        { label: "Active Contracts", value: activeJobs.filter(j => j.status === "In Progress").length, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { label: "Total Earnings", value: earnings + " ETH", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
        { label: "Reputation Score", value: rating ? rating + "/5.0" : "No reviews yet", icon: Star, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white font-outfit">{isClient ? "Client Dashboard" : "Freelancer Dashboard"}</h1>
          <p className="text-black dark:text-slate-400 mt-1">Welcome back, {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
        </div>
        {!isClient && rating && (
          <div className="flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl font-semibold">
            <Star className="w-4 h-4 mr-1 fill-current" /> {rating}/5.0
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="w-8 h-8" /></div>
            <div>
              <p className="text-sm font-medium text-black dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-black dark:text-white">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {!isClient && (
        <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-black dark:text-white text-lg">Earnings</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Funds are sent directly to your wallet when a client releases payment. Your earnings are already in MetaMask.
            </p>
            {withdrawError && <p className="text-red-500 text-sm mt-2">{withdrawError}</p>}
            {withdrawSuccess && <p className="text-green-600 dark:text-green-400 text-sm mt-2">{withdrawSuccess}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-black dark:text-white font-outfit">{earnings} ETH</p>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || parseFloat(earnings) <= 0}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all"
            >
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Check Earnings
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black dark:text-white font-outfit">{isClient ? "Your Posted Jobs" : "Your Active Contracts"}</h2>
          {isClient && <Link to="/post-job" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">+ Post New Job</Link>}
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-black dark:text-slate-400">Loading...</span>
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="py-8 text-center text-black dark:text-slate-400">
              {isClient ? (
                <div>
                  <p className="mb-3">You haven't posted any jobs yet.</p>
                  <Link to="/post-job" className="btn-primary py-2 px-6 text-sm">Post Your First Job</Link>
                </div>
              ) : "You have no active contracts at this time."}
            </div>
          ) : activeJobs.map(job => (
            <div key={job.id} className="py-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="font-bold text-black dark:text-white">{job.title}</h3>
                <p className="text-sm text-black dark:text-slate-400 mt-1">
                  Budget: <span className="font-semibold text-black dark:text-slate-300">{job.amount}</span>
                  {isClient && job.status === "Open" && job.proposals > 0 && (
                    <span className="ml-4 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full text-xs">
                      {job.proposals} Application{job.proposals > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-2 md:mt-0">
                <span className={`badge ${job.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" : job.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : job.status === "Closed" ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {job.status}
                </span>
                <button onClick={() => navigate(job.status === "Open" ? `/jobs/${job.id}` : `/workspace/${job.id}`)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition lg:ml-4 text-black dark:text-white text-sm">
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
