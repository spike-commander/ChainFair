const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();

  await supplyChain.waitForDeployment();
  const contractAddress = await supplyChain.getAddress();
  
  console.log("SupplyChain deployed to:", contractAddress);

  const CHAIN_ID_FARMER = 0;
  const CHAIN_ID_WHOLESALER = 1;
  const CHAIN_ID_RETAILER = 2;
  const CHAIN_ID_STORE = 3;

  const mangoChainId = await supplyChain.createChain(
    "Jabalpur Alphonso Mango",
    "Jabalpur, Madhya Pradesh",
    hre.ethers.parseEther("20"),
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "CERT-FARM-001"
  );
  console.log("Created Mango Chain with Token ID:", mangoChainId);

  const farmerAddress = deployer.address;
  const wholesalerAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const retailerAddress = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
  const storeAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";

  await supplyChain.authorizeActor(wholesalerAddress, "Jabalpur Wholesale Co.");
  await supplyChain.authorizeActor(retailerAddress, "City Mart Retail");
  await supplyChain.authorizeActor(storeAddress, "Fresh Picks Store");

  await supplyChain.addStage(
    mangoChainId,
    CHAIN_ID_WHOLESALER,
    "Jabalpur Wholesale Co.",
    3000,
    hre.ethers.parseEther("60"),
    "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    "CERT-WHOLESALE-001"
  );

  await supplyChain.addStage(
    mangoChainId,
    CHAIN_ID_RETAILER,
    "City Mart Retail",
    2500,
    hre.ethers.parseEther("120"),
    "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
    "CERT-RETAIL-001"
  );

  await supplyChain.addStage(
    mangoChainId,
    CHAIN_ID_STORE,
    "Fresh Picks Store",
    3500,
    hre.ethers.parseEther("200"),
    "QmW2WQi7j6c7UgJTarActqy7CiSR9w55KULXHbgGmrN3p",
    "CERT-STORE-001"
  );

  await supplyChain.completeChain(mangoChainId);

  const tomatoChainId = await supplyChain.createChain(
    "Jabalpur Organic Tomato",
    "Jabalpur, Madhya Pradesh",
    hre.ethers.parseEther("15"),
    "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX",
    "CERT-FARM-002"
  );

  await supplyChain.addStage(
    tomatoChainId,
    CHAIN_ID_WHOLESALER,
    "Jabalpur Wholesale Co.",
    2500,
    hre.ethers.parseEther("40"),
    "QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPu",
    "CERT-WHOLESALE-002"
  );

  await supplyChain.addStage(
    tomatoChainId,
    CHAIN_ID_RETAILER,
    "City Mart Retail",
    2500,
    hre.ethers.parseEther("80"),
    "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581Vd",
    "CERT-RETAIL-002"
  );

  await supplyChain.addStage(
    tomatoChainId,
    CHAIN_ID_STORE,
    "Fresh Picks Store",
    5000,
    hre.ethers.parseEther("150"),
    "QmW2WQi7j6c7UgJTarActqy7CiSR9w55KULXHbgGmrN3pX",
    "CERT-STORE-002"
  );

  await supplyChain.completeChain(tomatoChainId);

  const appleChainId = await supplyChain.createChain(
    "Kashmir Premium Apple",
    "Kashmir Valley, Jammu & Kashmir",
    hre.ethers.parseEther("50"),
    "QmSnuupMn3KqHC89JKkFbVHMipLQC2ir4eTSAWTywaZqKm",
    "CERT-FARM-003"
  );

  await supplyChain.addStage(
    appleChainId,
    CHAIN_ID_WHOLESALER,
    "Delhi Agricultural Market",
    2000,
    hre.ethers.parseEther("100"),
    "QmPQh9qF1uGhB8eJgQWcD7eZKLRVmfmGC3RVK1rPdNqZcU",
    "CERT-WHOLESALE-003"
  );

  await supplyChain.addStage(
    appleChainId,
    CHAIN_ID_RETAILER,
    "Premium Foods Ltd",
    2000,
    hre.ethers.parseEther("150"),
    "QmSnuupMn3KqHC89JKkFbVHMipLQC2ir4eTSAWTywaZqKm",
    "CERT-RETAIL-003"
  );

  await supplyChain.addStage(
    appleChainId,
    CHAIN_ID_STORE,
    "Jabalpur Fresh Mart",
    6000,
    hre.ethers.parseEther("300"),
    "QmSoLPppuBtQSGwKDZJoGK1ocE1qU9JXZuWbK8mB7t5wE9",
    "CERT-STORE-003"
  );

  await supplyChain.completeChain(appleChainId);

  console.log("\n--- Demo Data Created ---");
  console.log("Token ID 0: Jabalpur Alphonso Mango (₹20 -> ₹200)");
  console.log("Token ID 1: Jabalpur Organic Tomato (₹15 -> ₹150)");
  console.log("Token ID 2: Kashmir Premium Apple (₹50 -> ₹300)");

  const networkName = hre.network.name;
  if (networkName === "polygonMumbai") {
    console.log("\nVerifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\nDeployment Summary:");
  console.log("Network:", networkName);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
