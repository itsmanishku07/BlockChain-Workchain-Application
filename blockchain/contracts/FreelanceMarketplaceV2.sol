// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FreelanceMarketplaceV2 {
    
    enum JobStatus { Open, InProgress, Completed, Disputed, Cancelled, Closed }
    enum ProposalStatus { Pending, Accepted, Rejected }
    enum DisputeStatus { None, Raised, UnderReview, Resolved }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        bool paid;
    }
    
    struct Job {
        uint256 id;
        address client;
        string title;
        string description;
        string category;
        string[] skills;
        uint256 budget;
        uint256 deadline;
        JobStatus status;
        address assignedFreelancer;
        uint256 createdAt;
        bool fundsReleased;
        uint256 milestonesCount;
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
    
    struct Review {
        address reviewer;
        address reviewee;
        uint256 jobId;
        uint8 rating;
        string comment;
        uint256 timestamp;
    }
    
    struct FreelancerProfile {
        string name;
        string bio;
        string[] skills;
        uint256 totalEarnings;
        uint256 jobsCompleted;
        uint256 totalRating;
        uint256 reviewCount;
        bool exists;
    }
    
    struct Dispute {
        uint256 jobId;
        address initiator;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        address winner;
    }
    
    uint256 public jobCounter;
    uint256 public proposalCounter;
    uint256 public reviewCounter;
    uint256 public disputeCounter;
    uint256 public platformFee = 25; // 2.5%
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256[]) public jobProposals;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256) public earnings;
    mapping(address => FreelancerProfile) public freelancerProfiles;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    mapping(address => uint256[]) public userReviews;
    
    event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 budget);
    event ProposalSubmitted(uint256 indexed proposalId, uint256 indexed jobId, address indexed freelancer);
    event ProposalAccepted(uint256 indexed proposalId, uint256 indexed jobId, address indexed freelancer);
    event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event JobCancelled(uint256 indexed jobId);
    event ReviewSubmitted(uint256 indexed reviewId, address indexed reviewer, address indexed reviewee, uint8 rating);
    event DisputeRaised(uint256 indexed disputeId, uint256 indexed jobId, address indexed initiator);
    event MilestoneCompleted(uint256 indexed jobId, uint256 milestoneIndex);
    event ProfileUpdated(address indexed freelancer);
    
    function createFreelancerProfile(
        string memory _name,
        string memory _bio,
        string[] memory _skills
    ) external {
        require(!freelancerProfiles[msg.sender].exists, "Profile already exists");
        
        freelancerProfiles[msg.sender] = FreelancerProfile({
            name: _name,
            bio: _bio,
            skills: _skills,
            totalEarnings: 0,
            jobsCompleted: 0,
            totalRating: 0,
            reviewCount: 0,
            exists: true
        });
        
        emit ProfileUpdated(msg.sender);
    }
    
    function updateFreelancerProfile(
        string memory _name,
        string memory _bio,
        string[] memory _skills
    ) external {
        require(freelancerProfiles[msg.sender].exists, "Profile does not exist");
        
        FreelancerProfile storage profile = freelancerProfiles[msg.sender];
        profile.name = _name;
        profile.bio = _bio;
        profile.skills = _skills;
        
        emit ProfileUpdated(msg.sender);
    }
    
    function createJob(
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory _skills,
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
            category: _category,
            skills: _skills,
            budget: msg.value,
            deadline: _deadline,
            status: JobStatus.Open,
            assignedFreelancer: address(0),
            createdAt: block.timestamp,
            fundsReleased: false,
            milestonesCount: 0
        });
        
        emit JobCreated(jobCounter, msg.sender, _title, msg.value);
    }
    
    function addMilestone(
        uint256 _jobId,
        string memory _description,
        uint256 _amount
    ) external {
        Job storage job = jobs[_jobId];
        require(job.client == msg.sender, "Only client can add milestones");
        require(job.status == JobStatus.Open, "Job must be open");
        
        uint256 milestoneIndex = job.milestonesCount;
        jobMilestones[_jobId][milestoneIndex] = Milestone({
            description: _description,
            amount: _amount,
            completed: false,
            paid: false
        });
        
        job.milestonesCount++;
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
    
    function completeMilestone(uint256 _jobId, uint256 _milestoneIndex) external {
        Job storage job = jobs[_jobId];
        require(job.assignedFreelancer == msg.sender, "Only assigned freelancer");
        require(job.status == JobStatus.InProgress, "Job not in progress");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(!milestone.completed, "Milestone already completed");
        
        milestone.completed = true;
        
        emit MilestoneCompleted(_jobId, _milestoneIndex);
    }
    
    function releaseMilestonePayment(uint256 _jobId, uint256 _milestoneIndex) external {
        Job storage job = jobs[_jobId];
        require(job.client == msg.sender, "Only client can release");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(milestone.completed, "Milestone not completed");
        require(!milestone.paid, "Already paid");
        
        milestone.paid = true;
        
        uint256 fee = (milestone.amount * platformFee) / 1000;
        uint256 freelancerAmount = milestone.amount - fee;
        
        earnings[job.assignedFreelancer] += freelancerAmount;
        payable(job.assignedFreelancer).transfer(freelancerAmount);
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
        job.status = JobStatus.Closed;
        
        uint256 fee = (job.budget * platformFee) / 1000;
        uint256 freelancerAmount = job.budget - fee;
        
        earnings[job.assignedFreelancer] += freelancerAmount;
        
        FreelancerProfile storage profile = freelancerProfiles[job.assignedFreelancer];
        if (profile.exists) {
            profile.totalEarnings += freelancerAmount;
            profile.jobsCompleted++;
        }
        
        payable(job.assignedFreelancer).transfer(freelancerAmount);
        
        emit FundsReleased(_jobId, job.assignedFreelancer, freelancerAmount);
    }
    
    function submitReview(
        uint256 _jobId,
        address _reviewee,
        uint8 _rating,
        string memory _comment
    ) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Closed, "Job must be closed");
        require(msg.sender == job.client || msg.sender == job.assignedFreelancer, "Not authorized");
        
        reviewCounter++;
        
        reviews[reviewCounter] = Review({
            reviewer: msg.sender,
            reviewee: _reviewee,
            jobId: _jobId,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp
        });
        
        userReviews[_reviewee].push(reviewCounter);
        
        FreelancerProfile storage profile = freelancerProfiles[_reviewee];
        if (profile.exists) {
            profile.totalRating += _rating;
            profile.reviewCount++;
        }
        
        emit ReviewSubmitted(reviewCounter, msg.sender, _reviewee, _rating);
    }
    
    function raiseDispute(uint256 _jobId, string memory _reason) external {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.InProgress || job.status == JobStatus.Completed, "Invalid job status");
        require(msg.sender == job.client || msg.sender == job.assignedFreelancer, "Not authorized");
        
        job.status = JobStatus.Disputed;
        disputeCounter++;
        
        disputes[disputeCounter] = Dispute({
            jobId: _jobId,
            initiator: msg.sender,
            reason: _reason,
            status: DisputeStatus.Raised,
            createdAt: block.timestamp,
            winner: address(0)
        });
        
        emit DisputeRaised(disputeCounter, _jobId, msg.sender);
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
    
    function getUserReviews(address _user) external view returns (uint256[] memory) {
        return userReviews[_user];
    }
    
    function getFreelancerRating(address _freelancer) external view returns (uint256) {
        FreelancerProfile storage profile = freelancerProfiles[_freelancer];
        if (profile.reviewCount == 0) return 0;
        return (profile.totalRating * 100) / profile.reviewCount;
    }
    
    function getJobSkills(uint256 _jobId) external view returns (string[] memory) {
        return jobs[_jobId].skills;
    }
    
    function getFreelancerSkills(address _freelancer) external view returns (string[] memory) {
        return freelancerProfiles[_freelancer].skills;
    }
}
