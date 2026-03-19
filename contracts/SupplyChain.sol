// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    enum StageType { Farm, Wholesaler, Retailer, Store }
    
    struct SupplyStage {
        StageType stageType;
        address actor;
        string actorName;
        uint256 profitShareBPS;
        uint256 priceAtStage;
        string ipfsHash;
        uint256 timestamp;
        string certificationHash;
        bool isVerified;
    }
    
    struct ProductChain {
        string productName;
        string origin;
        uint256 totalPrice;
        uint256 farmerPrice;
        SupplyStage[] stages;
        bool isComplete;
        uint256 createdAt;
    }
    
    mapping(uint256 => ProductChain) public productChains;
    mapping(address => bool) public authorizedActors;
    mapping(address => string) public actorNames;
    
    uint256 public chainCounter;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    event ChainCreated(
        uint256 indexed tokenId,
        string productName,
        string origin,
        uint256 farmerPrice
    );
    
    event StageAdded(
        uint256 indexed tokenId,
        StageType stageType,
        address actor,
        uint256 profitShareBPS,
        uint256 priceAtStage
    );
    
    event ChainCompleted(uint256 indexed tokenId, uint256 totalPrice);
    
    event ActorAuthorized(address indexed actor, string actorName);
    
    event StageVerified(uint256 indexed tokenId, uint256 stageIndex);
    
    constructor() {
        authorizedActors[msg.sender] = true;
        actorNames[msg.sender] = "Contract Owner";
        chainCounter = 0;
    }
    
    modifier onlyAuthorized() {
        require(authorizedActors[msg.sender], "Not authorized");
        _;
    }
    
    function authorizeActor(address actor, string memory actorName) 
        external 
        onlyAuthorized 
    {
        authorizedActors[actor] = true;
        actorNames[actor] = actorName;
        emit ActorAuthorized(actor, actorName);
    }
    
    function createChain(
        string memory productName,
        string memory origin,
        uint256 farmerPrice,
        string memory ipfsHash,
        string memory certificationHash
    ) 
        external 
        onlyAuthorized 
        returns (uint256) 
    {
        uint256 tokenId = chainCounter++;
        
        ProductChain storage chain = productChains[tokenId];
        chain.productName = productName;
        chain.origin = origin;
        chain.totalPrice = farmerPrice;
        chain.farmerPrice = farmerPrice;
        chain.isComplete = false;
        chain.createdAt = block.timestamp;
        
        chain.stages.push(SupplyStage({
            stageType: StageType.Farm,
            actor: msg.sender,
            actorName: actorNames[msg.sender],
            profitShareBPS: 10000,
            priceAtStage: farmerPrice,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            certificationHash: certificationHash,
            isVerified: true
        }));
        
        emit ChainCreated(tokenId, productName, origin, farmerPrice);
        
        return tokenId;
    }
    
    function addStage(
        uint256 tokenId,
        StageType stageType,
        string memory actorName,
        uint256 profitShareBPS,
        uint256 priceAtStage,
        string memory ipfsHash,
        string memory certificationHash
    ) 
        external 
        onlyAuthorized 
        returns (uint256) 
    {
        require(tokenId < chainCounter, "Chain does not exist");
        require(priceAtStage >= productChains[tokenId].totalPrice, "Price must increase");
        require(profitShareBPS <= BPS_DENOMINATOR, "Invalid profit share");
        
        ProductChain storage chain = productChains[tokenId];
        chain.totalPrice = priceAtStage;
        
        uint256 stageIndex = chain.stages.length;
        
        chain.stages.push(SupplyStage({
            stageType: stageType,
            actor: msg.sender,
            actorName: actorName,
            profitShareBPS: profitShareBPS,
            priceAtStage: priceAtStage,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            certificationHash: certificationHash,
            isVerified: false
        }));
        
        emit StageAdded(tokenId, stageType, msg.sender, profitShareBPS, priceAtStage);
        
        return stageIndex;
    }
    
    function verifyStage(uint256 tokenId, uint256 stageIndex) 
        external 
        onlyAuthorized 
    {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        require(stageIndex < chain.stages.length, "Stage does not exist");
        
        chain.stages[stageIndex].isVerified = true;
        emit StageVerified(tokenId, stageIndex);
    }
    
    function completeChain(uint256 tokenId) external onlyAuthorized {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        require(!chain.isComplete, "Already complete");
        
        chain.isComplete = true;
        emit ChainCompleted(tokenId, chain.totalPrice);
    }
    
    function getChain(uint256 tokenId) 
        external 
        view 
        returns (
            string memory productName,
            string memory origin,
            uint256 totalPrice,
            uint256 farmerPrice,
            uint256 stageCount,
            bool isComplete,
            uint256 createdAt
        ) 
    {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        
        return (
            chain.productName,
            chain.origin,
            chain.totalPrice,
            chain.farmerPrice,
            chain.stages.length,
            chain.isComplete,
            chain.createdAt
        );
    }
    
    function getStage(uint256 tokenId, uint256 stageIndex)
        external
        view
        returns (
            StageType stageType,
            address actor,
            string memory actorName,
            uint256 profitShareBPS,
            uint256 priceAtStage,
            string memory ipfsHash,
            uint256 timestamp,
            string memory certificationHash,
            bool isVerified
        )
    {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        require(stageIndex < chain.stages.length, "Stage does not exist");
        
        SupplyStage storage stage = chain.stages[stageIndex];
        
        return (
            stage.stageType,
            stage.actor,
            stage.actorName,
            stage.profitShareBPS,
            stage.priceAtStage,
            stage.ipfsHash,
            stage.timestamp,
            stage.certificationHash,
            stage.isVerified
        );
    }
    
    function getFullChain(uint256 tokenId)
        external
        view
        returns (ProductChain memory)
    {
        require(tokenId < chainCounter, "Chain does not exist");
        return productChains[tokenId];
    }
    
    function getChainProfitSplit(uint256 tokenId)
        external
        view
        returns (uint256[] memory profitShares, string[] memory stageNames, uint256 totalPrice)
    {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        
        uint256 length = chain.stages.length;
        uint256[] memory shares = new uint256[](length);
        string[] memory names = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            shares[i] = chain.stages[i].profitShareBPS;
            names[i] = _stageTypeToString(chain.stages[i].stageType);
        }
        
        return (shares, names, chain.totalPrice);
    }
    
    function _stageTypeToString(StageType stageType) 
        internal 
        pure 
        returns (string memory) 
    {
        if (stageType == StageType.Farm) return "Farm/Farmer";
        if (stageType == StageType.Wholesaler) return "Wholesaler";
        if (stageType == StageType.Retailer) return "Retailer";
        return "Store";
    }
    
    function getFarmerShare(uint256 tokenId)
        external
        view
        returns (uint256 farmerShareBPS, uint256 farmerAmountINR, uint256 totalAmountINR)
    {
        require(tokenId < chainCounter, "Chain does not exist");
        ProductChain storage chain = productChains[tokenId];
        
        return (
            chain.stages[0].profitShareBPS,
            chain.farmerPrice,
            chain.totalPrice
        );
    }
}
