import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { Search, Filter, Loader2, AlertCircle, Wallet } from "lucide-react";
import { formatEther } from "ethers";

const CATEGORIES = ["Web Development", "Smart Contracts", "Design", "Marketing", "Security Audit"];

const Jobs = () => {
  const { contract, account, connectWallet, isLoading: walletLoading } = useWeb3();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!contract) return;
    const fetchJobsFromBlockchain = async () => {
      try {
        setLoading(true);
        setFetchError("");
        const jobCount = await contract.jobCounter();
        const count = Number(jobCount);
        const fetchedJobs = [];
        for (let i = 1; i <= count; i++) {
          const jobData = await contract.jobs(i);
          if (Number(jobData.status) === 0) {
            let skillsArray = [];
            try { skillsArray = await contract.getJobSkills(i); } catch (_) {}
            fetchedJobs.push({
              id: Number(jobData.id),
              title: jobData.title,
              description: jobData.description,
              budget: formatEther(jobData.budget) + " ETH",
              category: jobData.category,
              skills: skillsArray,
              createdAt: new Date(Number(jobData.createdAt) * 1000).toISOString(),
            });
          }
        }
        fetchedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAvailableJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs from blockchain:", error);
        setFetchError("Failed to load jobs from blockchain. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobsFromBlockchain();
  }, [contract]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredJobs = availableJobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(j.category);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="glass-card p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80">
        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-bold font-outfit text-black dark:text-white mb-2">Explore Jobs</h1>
          <p className="text-black dark:text-slate-400">Find the perfect decentralized gig that matches your skills.</p>
        </div>
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          <input
            type="text"
            placeholder="Search by keyword, skills..."
            className="input-field pl-12 py-4 text-lg shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/4">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg dark:text-white">Filters</h3>
              <Filter className="w-5 h-5 text-black" />
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-sm text-black dark:text-slate-200 mb-3">Categories</h4>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 text-sm text-black dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/4 space-y-4">
          {!account && !walletLoading && (
            <div className="glass-card p-5 flex items-center justify-between gap-4 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm text-black dark:text-slate-300">
                  Connect your wallet to apply for jobs and interact with the blockchain.
                </p>
              </div>
              <button onClick={connectWallet} className="btn-primary py-2 px-4 text-sm shrink-0">
                Connect
              </button>
            </div>
          )}

          {fetchError && (
            <div className="glass-card p-5 flex items-center gap-3 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{fetchError}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-black dark:text-slate-300">
              {loading ? "Loading..." : `Showing ${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
            </h2>
          </div>

          <div className="space-y-4">
            {!account && !walletLoading ? (
              <div className="glass-card p-12 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-black dark:text-white mb-2">Wallet Required</h3>
                <p className="text-black dark:text-slate-400">
                  Connect your MetaMask wallet to view live jobs from the blockchain.
                </p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-black font-medium dark:text-slate-400">Loading jobs from blockchain...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-black dark:text-slate-400">No jobs found matching your criteria.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => account ? navigate(`/jobs/${job.id}`) : connectWallet()}
                  className="glass-card p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 w-full md:w-3/4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>
                        <div className="md:hidden font-bold text-lg text-black dark:text-white flex items-center">
                          {job.budget}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-medium text-black dark:text-slate-400">
                        <span>{job.category}</span>
                        <span>•</span>
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-black dark:text-slate-300 line-clamp-2 pt-2">
                        {job.description || "No description provided."}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-3">
                        {job.skills.map((skill) => (
                          <span key={skill} className="badge bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end justify-between h-full min-h-[100px]">
                      <div className="text-xl font-bold text-black dark:text-white">{job.budget}</div>
                      <button className="btn-secondary py-1.5 px-4 text-sm mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
