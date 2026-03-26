import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { Search, Filter, Coins, Loader2, AlertCircle } from "lucide-react";
import { formatEther } from "ethers";

const Jobs = () => {
  const { contract, account } = useWeb3();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobsFromBlockchain = async () => {
      if (!contract) return;

      try {
        setLoading(true);
        const jobCount = await contract.jobCounter();
        const count = Number(jobCount);

        const fetchedJobs = [];
        for (let i = 1; i <= count; i++) {
          const jobData = await contract.jobs(i);
          // Only show Open jobs
          if (Number(jobData.status) === 0) { // 0 = Open
            const skillsArray = await contract.getJobSkills(i);

            fetchedJobs.push({
              id: Number(jobData.id),
              title: jobData.title,
              description: jobData.description,
              budget: formatEther(jobData.budget) + " ETH",
              category: jobData.category,
              skills: skillsArray,
              createdAt: new Date(Number(jobData.createdAt) * 1000).toISOString()
            });
          }
        }

        // Sort newest first
        fetchedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAvailableJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs from blockchain:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsFromBlockchain();
  }, [contract]);

  const filteredJobs = availableJobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header & Search */}
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

      {/* Filters & Results */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
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
                  {["Web Development", "Design", "Security", "Consulting", "Marketing"].map(cat => (
                    <label key={cat} className="flex items-center space-x-2 text-sm text-black dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="font-medium text-sm text-black dark:text-slate-200 mb-3">Budget Range</h4>
                <input type="range" className="w-full accent-blue-600" min="0" max="20" />
                <div className="flex justify-between text-xs text-black mt-2">
                  <span>0 ETH</span>
                  <span>20+ ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="w-full lg:w-3/4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-black dark:text-slate-300">
              Showing {filteredJobs.length} Jobs
            </h2>
            <select className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
              <option>Newest First</option>
              <option>Highest Budget</option>
              <option>Lowest Budget</option>
            </select>
          </div>

          <div className="space-y-4">
            {!account ? (
              <div className="glass-card p-12 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-black dark:text-white mb-2">Connect Wallet</h3>
                <p className="text-black dark:text-slate-400">Please connect your MetaMask wallet to view live jobs from the blockchain.</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-black font-medium dark:text-slate-400">Loading jobs from blockchain...</span>
              </div>
            ) : filteredJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => navigate(`/jobs/${job.id}`)}
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
                      {job.skills && job.skills.map(skill => (
                        <span key={skill} className="badge bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end justify-between h-full min-h-[100px]">
                    <div className="text-xl font-bold text-black dark:text-white flex items-center">
                      {job.budget}
                    </div>
                    <button className="btn-secondary py-1.5 px-4 text-sm mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredJobs.length === 0 && (
              <div className="glass-card p-12 text-center">
                <p className="text-black dark:text-slate-400">No jobs found matching your criteria.</p>
              </div>
            )}
          </div>

          {filteredJobs.length > 0 && (
            <div className="flex justify-center pt-8">
              <button className="btn-secondary">Load More Jobs</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
