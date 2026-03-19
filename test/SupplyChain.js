const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Contract", function () {
  let supplyChain;
  let owner;
  let farmer;
  let wholesaler;
  let retailer;
  let store;

  const STAGE_FARM = 0;
  const STAGE_WHOLESALER = 1;
  const STAGE_RETAILER = 2;
  const STAGE_STORE = 3;

  beforeEach(async function () {
    [owner, farmer, wholesaler, retailer, store] = await ethers.getSigners();
    
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    await supplyChain.authorizeActor(farmer.address, "Jabalpur Farmer");
    await supplyChain.authorizeActor(wholesaler.address, "Jabalpur Wholesale");
    await supplyChain.authorizeActor(retailer.address, "City Mart");
    await supplyChain.authorizeActor(store.address, "Fresh Store");
  });

  describe("Chain Creation", function () {
    it("Should create a new supply chain", async function () {
      const tx = await supplyChain.connect(farmer).createChain(
        "Jabalpur Mango",
        "Jabalpur, MP",
        ethers.parseEther("20"),
        "QmIPFSHash1",
        "CERT001"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      const tokenId = event.args[0];
      
      expect(tokenId).to.equal(0n);
    });

    it("Should store correct product info", async function () {
      await supplyChain.connect(farmer).createChain(
        "Organic Tomato",
        "Jabalpur, MP",
        ethers.parseEther("15"),
        "QmIPFSHash2",
        "CERT002"
      );

      const [name, origin, totalPrice, farmerPrice, stageCount, isComplete] = 
        await supplyChain.getChain(0);

      expect(name).to.equal("Organic Tomato");
      expect(origin).to.equal("Jabalpur, MP");
      expect(farmerPrice).to.equal(ethers.parseEther("15"));
      expect(stageCount).to.equal(1n);
      expect(isComplete).to.equal(false);
    });
  });

  describe("Stage Addition", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).createChain(
        "Apple",
        "Kashmir",
        ethers.parseEther("50"),
        "QmIPFSHash",
        "CERT"
      );
    });

    it("Should add wholesaler stage", async function () {
      await supplyChain.connect(wholesaler).addStage(
        0,
        STAGE_WHOLESALER,
        "Jabalpur Wholesale",
        3000,
        ethers.parseEther("100"),
        "QmIPFSWholesale",
        "CERT-WH"
      );

      const [name, origin, totalPrice, , stageCount] = await supplyChain.getChain(0);
      
      expect(totalPrice).to.equal(ethers.parseEther("100"));
      expect(stageCount).to.equal(2n);
    });

    it("Should add multiple stages correctly", async function () {
      await supplyChain.connect(wholesaler).addStage(
        0, STAGE_WHOLESALER, "Wholesale", 3000, ethers.parseEther("100"),
        "QmIPFS1", "CERT1"
      );

      await supplyChain.connect(retailer).addStage(
        0, STAGE_RETAILER, "Retailer", 2500, ethers.parseEther("150"),
        "QmIPFS2", "CERT2"
      );

      await supplyChain.connect(store).addStage(
        0, STAGE_STORE, "Store", 4500, ethers.parseEther("200"),
        "QmIPFS3", "CERT3"
      );

      const [, , totalPrice, , stageCount] = await supplyChain.getChain(0);
      
      expect(totalPrice).to.equal(ethers.parseEther("200"));
      expect(stageCount).to.equal(4n);
    });

    it("Should prevent price decrease", async function () {
      await expect(
        supplyChain.connect(wholesaler).addStage(
          0, STAGE_WHOLESALER, "Wholesale", 3000, ethers.parseEther("10"),
          "QmIPFS", "CERT"
        )
      ).to.be.revertedWith("Price must increase");
    });
  });

  describe("Profit Split Calculation", function () {
    it("Should calculate farmer share correctly", async function () {
      await supplyChain.connect(farmer).createChain(
        "Mango",
        "Jabalpur",
        ethers.parseEther("20"),
        "QmIPFS",
        "CERT"
      );

      await supplyChain.connect(wholesaler).addStage(
        0, STAGE_WHOLESALER, "Wholesale", 3000, ethers.parseEther("60"),
        "QmIPFS1", "CERT1"
      );

      await supplyChain.connect(retailer).addStage(
        0, STAGE_RETAILER, "Retailer", 2500, ethers.parseEther("120"),
        "QmIPFS2", "CERT2"
      );

      await supplyChain.connect(store).addStage(
        0, STAGE_STORE, "Store", 4500, ethers.parseEther("200"),
        "QmIPFS3", "CERT3"
      );

      await supplyChain.completeChain(0);

      const [farmerShare, farmerAmount, totalAmount] = 
        await supplyChain.getFarmerShare(0);

      expect(farmerShare).to.equal(10000n);
      expect(farmerAmount).to.equal(ethers.parseEther("20"));
      expect(totalAmount).to.equal(ethers.parseEther("200"));
    });
  });

  describe("Chain Completion", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).createChain(
        "Tomato",
        "Jabalpur",
        ethers.parseEther("15"),
        "QmIPFS",
        "CERT"
      );
    });

    it("Should mark chain as complete", async function () {
      await supplyChain.addStage(
        0, STAGE_WHOLESALER, "Wholesale", 2500, ethers.parseEther("40"),
        "QmIPFS1", "CERT1"
      );

      await supplyChain.addStage(
        0, STAGE_RETAILER, "Retailer", 2500, ethers.parseEther("80"),
        "QmIPFS2", "CERT2"
      );

      await supplyChain.addStage(
        0, STAGE_STORE, "Store", 5000, ethers.parseEther("150"),
        "QmIPFS3", "CERT3"
      );

      await supplyChain.completeChain(0);

      const [, , , , , isComplete] = await supplyChain.getChain(0);
      
      expect(isComplete).to.equal(true);
    });
  });

  describe("Access Control", function () {
    let freshContract;
    
    beforeEach(async function () {
      const SupplyChain = await ethers.getContractFactory("SupplyChain");
      freshContract = await SupplyChain.deploy();
      await freshContract.waitForDeployment();
    });

    it("Should reject unauthorized actors", async function () {
      await expect(
        freshContract.connect(store).createChain(
          "Test",
          "Test",
          ethers.parseEther("10"),
          "QmIPFS",
          "CERT"
        )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow authorized actors", async function () {
      const tx = await supplyChain.connect(farmer).createChain(
        "Mango",
        "Jabalpur",
        ethers.parseEther("20"),
        "QmIPFS",
        "CERT"
      );
      
      await expect(tx).to.not.be.reverted;
    });
  });

  describe("Events", function () {
    it("Should emit ChainCreated event", async function () {
      const tx = await supplyChain.connect(farmer).createChain(
        "Mango",
        "Jabalpur",
        ethers.parseEther("20"),
        "QmIPFS",
        "CERT"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      
      expect(event.fragment.name).to.equal("ChainCreated");
      expect(event.args[1]).to.equal("Mango");
      expect(event.args[2]).to.equal("Jabalpur");
    });

    it("Should emit StageAdded event", async function () {
      await supplyChain.connect(farmer).createChain(
        "Apple",
        "Kashmir",
        ethers.parseEther("50"),
        "QmIPFS",
        "CERT"
      );

      const tx = await supplyChain.connect(wholesaler).addStage(
        0,
        STAGE_WHOLESALER,
        "Wholesale",
        3000,
        ethers.parseEther("100"),
        "QmIPFS",
        "CERT"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      
      expect(event.fragment.name).to.equal("StageAdded");
      expect(event.args[2]).to.equal(wholesaler.address);
    });
  });
});
