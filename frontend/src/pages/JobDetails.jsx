import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { formatEther, parseEther } from "ethers";
import { Briefcase, Loader2, Clock, CheckCircle, AlertCircle, ArrowRight, User, Send } from "lucide-react";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account, isClient } = useWeb3();

  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({ coverLetter: "", proposedAmount: "", deliveryDays: "30" });

  const statusMap = ["Open", "In Progress", "Completed", "Disputed", "Cancelled", "Closed"];

  const fetchJobDetails = useCallback(async () => {
    if (!contract || !id) return;
    try {
      setLoading(true);
      setError("");
      const jobData = await contract.jobs(id);
      if (jobData.id.toString() === "0") { setError("Job not found."); setLoading(false); return; }

      setJob({
        id: jobData.id.toString(),
        client: jobData.client,
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        budget: formatEther(jobData.budget),
        deadline: Number(jobData.deadline) * 1000,
        status: statusMap[jobData.status],
        assignedFreelancer: jobData.assignedFreelancer,
        createdAt: Number(jobData.createdAt) * 1000,
      });

      const proposalIds = await contract.getJobProposals(id);
      const fetchedProposals = [];
      for (let i = 0; i < proposalIds.length; i++) {
        const p = await contract.proposals(proposalIds[i]);
        fetchedProposals.push({
          id: p.id.toString(),
          freelancer: p.freelancer,
          coverLetter: p.coverLetter,
          proposedAmount: formatEther(p.proposedAmount),
          deliveryTime: Number(p.deliveryTime),
          status: p.status.toString(),
        });
      }
      setProposals(fetchedProposals);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch job details.");
    } finally {
      setLoading(false);
    }
  }, [contract, id]);

  useEffect(() => { fetchJobDetails(); }, [fetchJobDetails]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    if (!applyForm.coverLetter.trim()) { setError("Please write a cover letter."); return; }
    const amount = parseFloat(applyForm.proposedAmount);
    if (!amount || amount <= 0) { setError("Please enter a valid proposed amount."); return; }
    if (amount > parseFloat(job.budget)) { setError("Proposed amount cannot exceed the job budget."); return; }
    try {
      setActionLoading(true);
      setError("");
      const tx = await contract.submitProposal(
        id,
        applyForm.coverLetter,
        parseEther(applyForm.proposedAmount.toString()),
        parseInt(applyForm.deliveryDays)
      );
      await tx.wait();
      setShowApplyForm(false);
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") { setError("Transaction rejected."); }
      else { setError(err.reason || err.message || "Failed to submit proposal."); }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!contract || !account) return;
    try {
      setActionLoading(true);
      setError("");
      const tx = await contract.acceptProposal(proposalId);
      await tx.wait();
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") { setError("Transaction rejected."); }
      else { setError(err.reason || err.message || "Failed to accept proposal."); }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!contract || !account) return;
    if (!window.confirm("Cancel this job and refund your ETH?")) return;
    try {
      setActionLoading(true);
      setError("");
      const tx = await contract.cancelJob(id);
      await tx.wait();
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") { setError("Transaction rejected."); }
      else { setError(err.reason || err.message || "Failed to cancel job."); }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;
  if (error || !job) return (
    <div className="text-center mt-20 text-red-500 animate-fade-in-up">
      <AlertCircle className="w-16 h-16 mx-auto mb-4" />
      <h2 className="text-2xl font-bold">{error || "Job not found"}</h2>
    </div>
  );

  const isJobOwner = account?.toLowerCase() === job.client.toLowerCase();
  const hasApplied = proposals.some(p => p.freelancer.toLowerCase() === account?.toLowerCase());
  const daysLeft = job.deadline ? Math.max(0, Math.ceil((job.deadline - Date.now()) / 86400000)) : null;

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in-up space-y-8">
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${job.status === 'Open' ? 'bg-green-100 text-green-700 border border-green-200' : job.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : job.status === 'Closed' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
            {job.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-black dark:text-white mb-4 pr-32">{job.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          <div className="flex items-center"><Briefcase className="w-4 h-4 mr-1" /> {job.category}</div>
          <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Posted {new Date(job.createdAt).toLocaleDateString()}</div>
          {daysLeft !== null && <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}</div>}
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 mb-8 whitespace-pre-wrap">{job.description}</div>

        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Budget Locked in Escrow</p>
            <p className="text-3xl font-bold text-black dark:text-white font-outfit">{job.budget} ETH</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {job.status === "Open" && !isJobOwner && !isClient && !hasApplied && (
              <button onClick={() => setShowApplyForm(true)} className="btn-primary py-3 px-8 flex items-center shadow-lg shadow-blue-500/30">
                <Send className="w-5 h-5 mr-2" /> Apply for Job
              </button>
            )}
            {job.status === "Open" && !isJobOwner && !isClient && hasApplied && (
              <div className="text-green-600 dark:text-green-400 font-bold flex items-center bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 mr-2" /> Proposal Submitted
              </div>
            )}
            {(job.status === "In Progress" || job.status === "Completed") && (
              <button onClick={() => navigate(`/workspace/${job.id}`)} className="btn-primary py-3 px-8 flex items-center shadow-lg shadow-blue-500/30">
                Go to Workspace <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
            {isJobOwner && job.status === "Open" && (
              <button onClick={handleCancelJob} disabled={actionLoading} className="py-3 px-8 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all flex items-center">
                {actionLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />} Cancel & Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {showApplyForm && (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Submit Your Proposal</h2>
          <form onSubmit={handleApply} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Cover Letter</label>
              <textarea
                rows="5"
                required
                className="input-field resize-none"
                placeholder="Describe your experience, approach, and why you're the best fit for this project..."
                value={applyForm.coverLetter}
                onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Your Bid (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={job.budget}
                  required
                  className="input-field"
                  placeholder={`Max: ${job.budget} ETH`}
                  value={applyForm.proposedAmount}
                  onChange={(e) => setApplyForm({ ...applyForm, proposedAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Delivery Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  value={applyForm.deliveryDays}
                  onChange={(e) => setApplyForm({ ...applyForm, deliveryDays: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={actionLoading} className="btn-primary py-3 px-8 flex items-center">
                {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                Submit Proposal
              </button>
              <button type="button" onClick={() => setShowApplyForm(false)} className="btn-secondary py-3 px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isJobOwner && job.status === "Open" && (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Proposals Received ({proposals.length})</h2>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              No proposals yet. Share your job to attract freelancers.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map(p => (
                <div key={p.id} className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md bg-white dark:bg-slate-800/80">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-black dark:text-white text-sm truncate max-w-[200px] sm:max-w-xs">{p.freelancer}</p>
                        <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{p.proposedAmount} ETH</span>
                          <span>·</span>
                          <span>{p.deliveryTime} days</span>
                        </div>
                      </div>
                    </div>
                    {p.status === "0" && (
                      <button onClick={() => handleAcceptProposal(p.id)} disabled={actionLoading} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-md shrink-0">
                        Hire Freelancer
                      </button>
                    )}
                    {p.status === "1" && <span className="text-green-600 dark:text-green-400 font-bold text-sm">Hired</span>}
                  </div>
                  {p.coverLetter && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.coverLetter}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetails;
