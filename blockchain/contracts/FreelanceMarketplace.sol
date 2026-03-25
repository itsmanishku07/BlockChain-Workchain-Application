// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FreelanceMarketplace {
    
    enum JobStatus { Open, InProgress, Completed, Disputed, Cancelled }
    enum ProposalStatus { Pending, Accepted, Rejected }
    
    struct Job {
        uint256 id;
        address client;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        JobStatus status;
        address assignedFreelancer;
        uint256 createdAt;
        bool fundsReleased;
    }
    
    struct Proposal {
        uint256 id;
        uint256 jobId;
        address freelancer;
        string coverLetter;
        uint256 proposedAmount;
        uint256 deliveryTime;
        ProposalStatus status;
        uint256 submittedAt;
    }
    
    uint256 public jobCounter;
    uint256 public proposalCounter;
    uint256 public platformFee = 25; // 2.5%
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256[]) public jobProposals;
    mapping(address => uint256) public earnings;
    
    event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 budget);
    event ProposalSubmitted(uint256 indexed proposalId, uint256 indexed jobId, address indexed freelancer);
    event ProposalAccepted(uint256 indexed proposalId, uint256 indexed jobId, address indexed freelancer);
    event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event JobCancelled(uint256 indexed jobId);
    
    function createJob(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external payable {
        require(msg.value > 0, "Budget must be greater than 0");
        require(bytes(_title).length > 0, "Title required");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            id: jobCounter,
            client: msg.sender,
            title: _title,
            description: _description,
            budget: msg.value,
            deadline: _deadline,
            status: JobStatus.Open,
            assignedFreelancer: address(0),
            createdAt: block.timestamp,
            fundsReleased: false
        });
        
        emit JobCreated(jobCounter, msg.sender, _title, msg.value);
    }
    
    function submitProposal(
        uint256 _jobId,
        string memory _coverLetter,
        uint256 _proposedAmount,
        uint256 _deliveryTime
    ) external {
        require(jobs[_jobId].status == JobStatus.Open, "Job not open");
        require(jobs[_jobId].client != msg.sender, "Client cannot submit proposal");
        require(_proposedAmount <= jobs[_jobId].budget, "Amount exceeds budget");
        
        proposalCounter++;
        
        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            jobId: _jobId,
            freelancer: msg.sender,
            coverLetter: _coverLetter,
            proposedAmount: _proposedAmount,
            deliveryTime: _deliveryTime,
            status: ProposalStatus.Pending,
            submittedAt: block.timestamp
        });
        
        jobProposals[_jobId].push(proposalCounter);
        
        emit ProposalSubmitted(proposalCounter, _jobId, msg.sender);
    }
    
    function acceptProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        Job storage job = jobs[proposal.jobId];
        
        require(job.client == msg.sender, "Only client can accept");
        require(job.status == JobStatus.Open, "Job not open");
        require(proposal.status == ProposalStatus.Pending, "Proposal not pending");
        
        proposal.status = ProposalStatus.Accepted;
        job.status = JobStatus.InProgress;
        job.assignedFreelancer = proposal.freelancer;
        
        emit ProposalAccepted(_proposalId, proposal.jobId, proposal.freelancer);
    }
    
    function completeJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        
        require(job.assignedFreelancer == msg.sender, "Only assigned freelancer");
        require(job.status == JobStatus.InProgress, "Job not in progress");
        
        job.status = JobStatus.Completed;
        
        emit JobCompleted(_jobId, msg.sender, job.budget);
    }
    
    function releaseFunds(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        
        require(job.client == msg.sender, "Only client can release funds");
        require(job.status == JobStatus.Completed, "Job not completed");
        require(!job.fundsReleased, "Funds already released");
        
        job.fundsReleased = true;
        
        uint256 fee = (job.budget * platformFee) / 1000;
        uint256 freelancerAmount = job.budget - fee;
        
        earnings[job.assignedFreelancer] += freelancerAmount;
        
        payable(job.assignedFreelancer).transfer(freelancerAmount);
        
        emit FundsReleased(_jobId, job.assignedFreelancer, freelancerAmount);
    }
    
    function cancelJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JobStatus.Open, "Can only cancel open jobs");
        
        job.status = JobStatus.Cancelled;
        
        payable(job.client).transfer(job.budget);
        
        emit JobCancelled(_jobId);
    }
    
    function getJobProposals(uint256 _jobId) external view returns (uint256[] memory) {
        return jobProposals[_jobId];
    }
    
    function getJobsByClient(address _client) external view returns (uint256[] memory) {
        uint256[] memory clientJobs = new uint256[](jobCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].client == _client) {
                clientJobs[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = clientJobs[i];
        }
        
        return result;
    }
    
    function getJobsByFreelancer(address _freelancer) external view returns (uint256[] memory) {
        uint256[] memory freelancerJobs = new uint256[](jobCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].assignedFreelancer == _freelancer) {
                freelancerJobs[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = freelancerJobs[i];
        }
        
        return result;
    }
}
