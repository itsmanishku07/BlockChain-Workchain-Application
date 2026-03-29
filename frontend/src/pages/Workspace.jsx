import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { formatEther } from "ethers";
import { Briefcase, Loader2, CheckCircle, AlertCircle, ShieldCheck, DollarSign, Clock } from "lucide-react";

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account } = useWeb3();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const statusMap = ["Open", "In Progress", "Completed", "Disputed", "Cancelled", "Closed"];

  const fetchJobDetails = useCallback(async () => {
    if (!contract || !id) return;
    try {
      setLoading(true);
      setError("");
      
      const jobData = await contract.jobs(id);
      
      if (jobData.id.toString() === "0") {
         setError("Job not found.");
         setLoading(false);
         return;
      }

      setJob({
        id: jobData.id.toString(),
        client: jobData.client,
        title: jobData.title,
        description: jobData.description,
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

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleFreelancerComplete = async () => {
    try {
      setActionLoading(true);
      setError("");
      const tx = await contract.completeJob(id);
      await tx.wait();
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected.");
      } else {
        setError(err.reason || err.message || "Failed to mark job as completed.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClientReleaseFunds = async () => {
    try {
      setActionLoading(true);
      setError("");
      const tx = await contract.releaseFunds(id);
      await tx.wait();
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected.");
      } else {
        setError(err.reason || err.message || "Failed to release funds.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center mt-20 text-red-500 animate-fade-in-up">
        <AlertCircle className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{error || "Job not found"}</h2>
      </div>
    );
  }

  const isClientOwner = account?.toLowerCase() === job.client.toLowerCase();
  const isAssignedFreelancer = account?.toLowerCase() === job.assignedFreelancer.toLowerCase();

  if (!isClientOwner && !isAssignedFreelancer) {
      return (
        <div className="text-center mt-20 text-red-500 animate-fade-in-up">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Unauthorized. You are not part of this contract.</h2>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in-up space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-outfit text-black dark:text-white">Active Workspace</h1>
            <p className="text-black dark:text-slate-400">{job.title}</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
             <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contract Status</p>
             <p className={`text-2xl font-bold font-outfit ${
                 job.status === 'In Progress' ? 'text-blue-600 dark:text-blue-400' :
                 job.status === 'Completed' ? 'text-green-600 dark:text-green-400' :
                 'text-slate-600 dark:text-slate-300'
               }`}>
                 {job.status === 'Completed' ? 'Pending Payment Release' : job.status}
             </p>
           </div>
           
           <div className="text-right">
             <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Escrowed Funds</p>
             <p className="text-2xl font-bold font-outfit text-black dark:text-white flex items-center justify-end">
               <DollarSign className="w-5 h-5 mr-1" />
               {job.budget} ETH
             </p>
           </div>
        </div>
      </div>

      <div className="glass-card p-8">
         <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Contract Actions</h2>
         <div className="space-y-6">
            {isAssignedFreelancer && job.status === "In Progress" && (
               <div className="p-6 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                 <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Submit Work</h3>
                 <p className="text-blue-700 dark:text-blue-300 mb-6 text-sm">
                   When you have finished the requirements, click below to notify the client and request payment release.
                 </p>
                 <button 
                   onClick={handleFreelancerComplete}
                   disabled={actionLoading}
                   className="btn-primary py-3 px-8 w-full sm:w-auto"
                 >
                   {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin inline"/> : <CheckCircle className="w-5 h-5 mr-2 inline" />}
                   Mark Work as Completed
                 </button>
               </div>
            )}

            {isClientOwner && job.status === "Completed" && (
               <div className="p-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                 <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Release Payment</h3>
                 <p className="text-green-700 dark:text-green-300 mb-6 text-sm">
                   The freelancer has submitted their work. Review it, and if satisfied, release the escrowed ETH to their wallet to close this contract.
                 </p>
                 <button 
                   onClick={handleClientReleaseFunds}
                   disabled={actionLoading}
                   className="py-3 px-8 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
                 >
                   {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin inline"/> : <CheckCircle className="w-5 h-5 mr-2 inline" />}
                   Approve Work & Release Funds
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

            {job.status === "Closed" && (
              <div className="text-center py-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                 <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Contract Closed</h2>
                 <p className="text-slate-500 mt-2">Funds have been successfully transferred and the job is complete.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Workspace;
