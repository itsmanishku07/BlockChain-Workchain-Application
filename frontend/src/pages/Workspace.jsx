import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { formatEther } from "ethers";
import { Loader2, CheckCircle, AlertCircle, ShieldCheck, DollarSign, Clock, AlertTriangle, Star } from "lucide-react";

const statusMap = ["Open", "In Progress", "Completed", "Disputed", "Cancelled", "Closed"];

const Workspace = () => {
  const { id } = useParams();
  const { contract, account } = useWeb3();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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
        budget: formatEther(jobData.budget),
        status: statusMap[jobData.status],
        assignedFreelancer: jobData.assignedFreelancer,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch job details.");
    } finally {
      setLoading(false);
    }
  }, [contract, id]);

  useEffect(() => { fetchJobDetails(); }, [fetchJobDetails]);

  const execTx = async (txFn, successMsg) => {
    try {
      setActionLoading(true); setError(""); setSuccess("");
      const tx = await txFn();
      await tx.wait();
      if (successMsg) setSuccess(successMsg);
      fetchJobDetails();
    } catch (err) {
      if (err.code === 4001 || err.code === "ACTION_REJECTED") setError("Transaction rejected.");
      else setError(err.reason || err.message || "Transaction failed.");
    } finally { setActionLoading(false); }
  };

  const handleFreelancerComplete = () => execTx(() => contract.completeJob(id), "Work submitted! Waiting for client to release payment.");
  const handleClientReleaseFunds = () => execTx(() => contract.releaseFunds(id), "Funds released! Contract is now closed.");

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) { setError("Please describe the reason."); return; }
    await execTx(() => contract.raiseDispute(id, disputeReason), "Dispute raised.");
    setShowDisputeForm(false);
    setDisputeReason("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) { setError("Please write a comment."); return; }
    const reviewee = isClientOwner ? job.assignedFreelancer : job.client;
    try {
      setActionLoading(true); setError(""); setSuccess("");
      const tx = await contract.submitReview(id, reviewee, reviewRating, reviewComment);
      await tx.wait();
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setSuccess("Review submitted!");
    } catch (err) {
      if (err.code === 4001 || err.code === "ACTION_REJECTED") setError("Transaction rejected.");
      else setError(err.reason || err.message || "Failed to submit review.");
    } finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;
  if (!job) return <div className="text-center mt-20 text-red-500 animate-fade-in-up"><AlertCircle className="w-16 h-16 mx-auto mb-4" /><h2 className="text-2xl font-bold">{error || "Job not found"}</h2></div>;

  const isClientOwner = account?.toLowerCase() === job.client.toLowerCase();
  const isAssignedFreelancer = account?.toLowerCase() === job.assignedFreelancer.toLowerCase();

  if (!isClientOwner && !isAssignedFreelancer) return (
    <div className="text-center mt-20 text-red-500 animate-fade-in-up"><AlertCircle className="w-16 h-16 mx-auto mb-4" /><h2 className="text-2xl font-bold">Unauthorized.</h2></div>
  );

  const canDispute = job.status === "In Progress" || job.status === "Completed";

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in-up space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400"><ShieldCheck className="w-8 h-8" /></div>
          <div>
            <h1 className="text-3xl font-bold font-outfit text-black dark:text-white">Active Workspace</h1>
            <p className="text-black dark:text-slate-400">{job.title}</p>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-sm">{success}</div>}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contract Status</p>
            <p className={`text-2xl font-bold font-outfit ${job.status === "In Progress" ? "text-blue-600 dark:text-blue-400" : job.status === "Completed" ? "text-green-600 dark:text-green-400" : job.status === "Disputed" ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
              {job.status === "Completed" ? "Pending Payment Release" : job.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Escrowed Funds</p>
            <p className="text-2xl font-bold font-outfit text-black dark:text-white flex items-center justify-end"><DollarSign className="w-5 h-5 mr-1" />{job.budget} ETH</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Contract Actions</h2>
        <div className="space-y-6">
          {isAssignedFreelancer && job.status === "In Progress" && (
            <div className="p-6 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Submit Work</h3>
              <p className="text-blue-700 dark:text-blue-300 mb-6 text-sm">When you have finished the requirements, click below to notify the client and request payment release.</p>
              <button onClick={handleFreelancerComplete} disabled={actionLoading} className="btn-primary py-3 px-8 w-full sm:w-auto">
                {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin inline" /> : <CheckCircle className="w-5 h-5 mr-2 inline" />}Mark Work as Completed
              </button>
            </div>
          )}
          {isClientOwner && job.status === "Completed" && (
            <div className="p-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Release Payment</h3>
              <p className="text-green-700 dark:text-green-300 mb-6 text-sm">The freelancer has submitted their work. Review it, and if satisfied, release the escrowed ETH to close this contract.</p>
              <button onClick={handleClientReleaseFunds} disabled={actionLoading} className="py-3 px-8 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5">
                {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin inline" /> : <CheckCircle className="w-5 h-5 mr-2 inline" />}Approve and Release Funds
              </button>
            </div>
          )}
          {isClientOwner && job.status === "In Progress" && (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Waiting for the freelancer to submit their work...</p>
            </div>
          )}
          {isAssignedFreelancer && job.status === "Completed" && (
            <div className="text-center py-10 border-2 border-dashed border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 rounded-2xl">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 dark:text-green-400 font-medium">Work submitted! Waiting for the client to approve and release funds.</p>
            </div>
          )}
          {job.status === "Disputed" && (
            <div className="p-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-2xl text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Dispute In Progress</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">This contract is under dispute. Funds are locked until resolved.</p>
            </div>
          )}
          {job.status === "Closed" && (
            <div className="text-center py-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Contract Closed</h2>
              <p className="text-slate-500 mt-2">Funds have been successfully transferred.</p>
            </div>
          )}
          {canDispute && !showDisputeForm && (
            <button onClick={() => setShowDisputeForm(true)} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline font-medium pt-2">
              <AlertTriangle className="w-4 h-4" /> Raise a Dispute
            </button>
          )}
          {showDisputeForm && (
            <form onSubmit={handleRaiseDispute} className="p-6 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-red-800 dark:text-red-200">Raise Dispute</h3>
              <textarea rows="3" required className="input-field resize-none" placeholder="Describe the issue clearly..." value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} />
              <div className="flex gap-3">
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2">
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Submit Dispute
                </button>
                <button type="button" onClick={() => setShowDisputeForm(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {job.status === "Closed" && !reviewSubmitted && (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-black dark:text-white">Leave a Review</h2>
            {!showReviewForm && (
              <button onClick={() => setShowReviewForm(true)} className="btn-primary py-2 px-5 text-sm flex items-center gap-2">
                <Star className="w-4 h-4" /> Write Review
              </button>
            )}
          </div>
          {!showReviewForm && <p className="text-slate-500 dark:text-slate-400 text-sm">Help build trust by reviewing your {isClientOwner ? "freelancer" : "client"}.</p>}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-2">Rating for {isClientOwner ? "Freelancer" : "Client"}</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className={`w-10 h-10 rounded-lg text-xl transition-all ${star <= reviewRating ? "bg-yellow-400 text-white scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-500">{reviewRating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-black dark:text-slate-300 mb-1">Comment</label>
                <textarea rows="3" required className="input-field resize-none" placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={actionLoading} className="btn-primary py-3 px-8 flex items-center gap-2">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />} Submit Review
                </button>
                <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary py-3 px-6">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {reviewSubmitted && (
        <div className="glass-card p-6 text-center border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2 fill-current" />
          <p className="font-semibold text-black dark:text-white">Review submitted! Thank you.</p>
        </div>
      )}
    </div>
  );
};

export default Workspace;
