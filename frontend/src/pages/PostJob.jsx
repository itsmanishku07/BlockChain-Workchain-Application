import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useNavigate } from "react-router-dom";
import { parseEther } from "ethers";
import { Briefcase, Loader2, AlertCircle } from "lucide-react";

const PostJob = () => {
  const { contract, account, isClient } = useWeb3();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Web Development",
    skills: "",
    budget: "",
    deadlineDays: "30"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!isClient) {
      setError("You must be in Client mode to post a job.");
      return;
    }

    const budgetNum = parseFloat(formData.budget);
    if (!budgetNum || budgetNum <= 0) {
      setError("Budget must be greater than 0 ETH.");
      return;
    }

    const deadlineDays = parseInt(formData.deadlineDays);
    if (!deadlineDays || deadlineDays < 1) {
      setError("Deadline must be at least 1 day.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Project title is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const skillsArray = formData.skills.split(",").map((s) => s.trim()).filter((s) => s !== "");
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadlineDays * 24 * 60 * 60;
      const budgetWei = parseEther(formData.budget.toString());

      const tx = await contract.createJob(
        formData.title,
        formData.description,
        formData.category,
        skillsArray,
        deadlineTimestamp,
        { value: budgetWei }
      );

      await tx.wait();

      // Mirror to Postgres for faster indexing (non-blocking)
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
      fetch(`${apiBase}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          budget: formData.budget + " ETH",
          category: formData.category,
          skills: skillsArray,
        }),
      }).catch((dbErr) => console.warn("DB indexing failed:", dbErr));

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected. Please approve the transaction in MetaMask.");
      } else {
        setError(err.reason || err.message || "Failed to post job to the blockchain.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
        <AlertCircle className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-black mb-2">Client Access Only</h2>
        <p className="text-black">Please switch to Client mode in the Navbar to post a project.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in-up">
      <div className="glass-card p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-outfit text-black dark:text-white">Post a Project</h1>
            <p className="text-black dark:text-slate-400">Hire top-tier decentralized talent via Smart Contracts</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Job Title</label>
              <input 
                required
                type="text" 
                name="title"
                className="input-field" 
                placeholder=""
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Description</label>
              <textarea 
                required
                name="description"
                rows="4" 
                className="input-field resize-none" 
                placeholder=""
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Category</label>
                <select 
                  name="category"
                  className="input-field"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Smart Contracts">Smart Contracts</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Security Audit">Security Audit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Budget (ETH)</label>
                <input 
                  required
                  type="number" 
                  step="0.001"
                  min="0.001"
                  name="budget"
                  className="input-field" 
                  placeholder=""
                  value={formData.budget}
                  onChange={handleChange}
                />
                <p className="text-xs text-black mt-1">Funds will be locked securely in the escrow smart contract.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Skills Needed (comma separated)</label>
                <input 
                  required
                  type="text" 
                  name="skills"
                  className="input-field" 
                  placeholder="React, Solidity, Ethers.js"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Deadline (Days)</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  name="deadlineDays"
                  className="input-field" 
                  placeholder=""
                  value={formData.deadlineDays}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Blockchain Transaction...
                </>
              ) : (
                "Post Project & Lock Funds"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
