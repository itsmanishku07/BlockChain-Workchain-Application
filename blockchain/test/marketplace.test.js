const FreelanceMarketplace = artifacts.require("FreelanceMarketplace");

contract("FreelanceMarketplace", (accounts) => {
  const [client, freelancer1, freelancer2] = accounts;
  let marketplace;

  beforeEach(async () => {
    marketplace = await FreelanceMarketplace.new();
  });

  describe("Job Creation", () => {
    it("should create a job successfully", async () => {
      const title = "Build a website";
      const description = "Need a responsive website";
      const deadline = 7 * 86400; // 7 days
      const budget = web3.utils.toWei("1", "ether");

      const result = await marketplace.createJob(title, description, deadline, {
        from: client,
        value: budget
      });

      const job = await marketplace.jobs(1);
      assert.equal(job.title, title);
      assert.equal(job.client, client);
      assert.equal(job.budget.toString(), budget);
      assert.equal(job.status.toString(), "0"); // Open
    });

    it("should fail without budget", async () => {
      try {
        await marketplace.createJob("Test", "Description", 86400, {
          from: client,
          value: 0
        });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Budget must be greater than 0"));
      }
    });
  });

  describe("Proposals", () => {
    beforeEach(async () => {
      await marketplace.createJob("Test Job", "Description", 86400, {
        from: client,
        value: web3.utils.toWei("1", "ether")
      });
    });

    it("should submit proposal successfully", async () => {
      const coverLetter = "I'm perfect for this job";
      const proposedAmount = web3.utils.toWei("0.8", "ether");
      const deliveryTime = 5 * 86400;

      await marketplace.submitProposal(1, coverLetter, proposedAmount, deliveryTime, {
        from: freelancer1
      });

      const proposal = await marketplace.proposals(1);
      assert.equal(proposal.freelancer, freelancer1);
      assert.equal(proposal.proposedAmount.toString(), proposedAmount);
    });

    it("should not allow client to submit proposal", async () => {
      try {
        await marketplace.submitProposal(1, "Test", web3.utils.toWei("0.5", "ether"), 86400, {
          from: client
        });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Client cannot submit proposal"));
      }
    });
  });

  describe("Accept Proposal", () => {
    beforeEach(async () => {
      await marketplace.createJob("Test Job", "Description", 86400, {
        from: client,
        value: web3.utils.toWei("1", "ether")
      });
      await marketplace.submitProposal(1, "Cover letter", web3.utils.toWei("0.8", "ether"), 86400, {
        from: freelancer1
      });
    });

    it("should accept proposal and assign freelancer", async () => {
      await marketplace.acceptProposal(1, { from: client });

      const job = await marketplace.jobs(1);
      const proposal = await marketplace.proposals(1);

      assert.equal(job.assignedFreelancer, freelancer1);
      assert.equal(job.status.toString(), "1"); // InProgress
      assert.equal(proposal.status.toString(), "1"); // Accepted
    });

    it("should not allow non-client to accept", async () => {
      try {
        await marketplace.acceptProposal(1, { from: freelancer2 });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Only client can accept"));
      }
    });
  });

  describe("Complete Job and Release Funds", () => {
    beforeEach(async () => {
      await marketplace.createJob("Test Job", "Description", 86400, {
        from: client,
        value: web3.utils.toWei("1", "ether")
      });
      await marketplace.submitProposal(1, "Cover letter", web3.utils.toWei("1", "ether"), 86400, {
        from: freelancer1
      });
      await marketplace.acceptProposal(1, { from: client });
    });

    it("should complete job", async () => {
      await marketplace.completeJob(1, { from: freelancer1 });
      const job = await marketplace.jobs(1);
      assert.equal(job.status.toString(), "2"); // Completed
    });

    it("should release funds to freelancer", async () => {
      await marketplace.completeJob(1, { from: freelancer1 });
      
      const balanceBefore = await web3.eth.getBalance(freelancer1);
      await marketplace.releaseFunds(1, { from: client });
      const balanceAfter = await web3.eth.getBalance(freelancer1);

      const job = await marketplace.jobs(1);
      assert.equal(job.fundsReleased, true);
      assert(BigInt(balanceAfter) > BigInt(balanceBefore));
    });
  });

  describe("Cancel Job", () => {
    it("should cancel job and refund client", async () => {
      const budget = web3.utils.toWei("1", "ether");
      await marketplace.createJob("Test Job", "Description", 86400, {
        from: client,
        value: budget
      });

      const balanceBefore = await web3.eth.getBalance(client);
      await marketplace.cancelJob(1, { from: client });
      const balanceAfter = await web3.eth.getBalance(client);

      const job = await marketplace.jobs(1);
      assert.equal(job.status.toString(), "4"); // Cancelled
      assert(BigInt(balanceAfter) > BigInt(balanceBefore));
    });
  });
});
