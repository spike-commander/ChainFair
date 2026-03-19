import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Upload, QrCode, TrendingUp, Users, DollarSign, CheckCircle, 
         AlertCircle, Loader2, Plus, Eye, ExternalLink } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xYourContractAddress';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const STAGE_TYPES = [
  { id: 0, name: 'Farm', color: '#4CAF50' },
  { id: 1, name: 'Wholesaler', color: '#2196F3' },
  { id: 2, name: 'Retailer', color: '#FF9800' },
  { id: 3, name: 'Store', color: '#9C27B0' }
];

const DEMO_DATA = [
  { tokenId: 0, product: 'Jabalpur Mango', farmerShare: 10, totalValue: 200, stages: 4 },
  { tokenId: 1, product: 'Jabalpur Tomato', farmerShare: 10, totalValue: 150, stages: 4 },
  { tokenId: 2, product: 'Kashmir Apple', farmerShare: 17, totalValue: 300, stages: 4 },
];

const CONTRACT_ABI = [
  "function createChain(string productName, string origin, uint256 farmerPrice, string ipfsHash, string certificationHash) public returns (uint256)",
  "function addStage(uint256 tokenId, uint8 stageType, string actorName, uint256 profitShareBPS, uint256 priceAtStage, string ipfsHash, string certificationHash) public returns (uint256)",
  "function chainCounter() view returns (uint256)",
  "function getChain(uint256 tokenId) view returns (string, string, uint256, uint256, uint256, bool, uint256)"
];

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [chains, setChains] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    origin: '',
    farmerPrice: '',
    ipfsHash: '',
    certificationHash: '',
  });

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setConnected(true);
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
      alert('Please install MetaMask to use this dashboard');
    }
  };

  const addSupplyChain = async () => {
    if (!connected) return alert('Please connect your wallet first');
    setLoading(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.signer();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const farmerPriceWei = ethers.parseUnits(formData.farmerPrice || "0", "ether");
      
      const tx = await contract.createChain(
        formData.productName,
        formData.origin,
        farmerPriceWei,
        formData.ipfsHash || "QmPlaceholder",
        formData.certificationHash || "CERT-DEFAULT"
      );
      
      await tx.wait();
      
      const newChain = {
        tokenId: chains.length,
        product: formData.productName || 'New Product',
        farmerShare: 10, // Default for new chains
        totalValue: parseFloat(formData.farmerPrice) || 0,
        stages: 1
      };
      
      setChains([...chains, newChain]);
      setShowAddModal(false);
      setFormData({ productName: '', origin: '', farmerPrice: '', ipfsHash: '', certificationHash: '' });
      alert('Supply Chain Created Successfully on Blockchain!');
    } catch (error) {
      console.error('Failed to create chain:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Farm', value: 12, color: '#4CAF50' },
    { name: 'Wholesaler', value: 23, color: '#2196F3' },
    { name: 'Retailer', value: 28, color: '#FF9800' },
    { name: 'Store', value: 37, color: '#9C27B0' }
  ];

  const trendData = [
    { month: 'Jan', farmers: 45, chains: 120 },
    { month: 'Feb', farmers: 52, chains: 145 },
    { month: 'Mar', farmers: 61, chains: 178 },
    { month: 'Apr', farmers: 58, chains: 165 },
    { month: 'May', farmers: 72, chains: 210 },
    { month: 'Jun', farmers: 85, chains: 245 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <QrCode className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">ChainFair Admin</h1>
              <p className="text-xs text-green-100">Supply Chain Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {connected ? (
              <div className="flex items-center space-x-2 bg-green-700 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          {['overview', 'chains', 'upload', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                activeTab === tab ? 'bg-white text-green-600 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Chains', value: '156', icon: QrCode, color: 'bg-blue-500' },
                { label: 'Active Farmers', value: '847', icon: Users, color: 'bg-green-500' },
                { label: 'Total Value (₹)', value: '₹12.4L', icon: DollarSign, color: 'bg-purple-500' },
                { label: 'Transparency Score', value: '94%', icon: TrendingUp, color: 'bg-orange-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Average Profit Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Growth Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="farmers" stroke="#4CAF50" strokeWidth={2} name="Farmers" />
                    <Line type="monotone" dataKey="chains" stroke="#2196F3" strokeWidth={2} name="Chains" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Supply Chains</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Token ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Farmer Share</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total Value</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stages</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chains.map((chain) => (
                      <tr key={chain.tokenId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{chain.product}</td>
                        <td className="py-3 px-4 font-mono text-sm">#{chain.tokenId}</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                            {chain.farmerShare}%
                          </span>
                        </td>
                        <td className="py-3 px-4">₹{chain.totalValue}</td>
                        <td className="py-3 px-4">{chain.stages}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Add Supply Chain Stage</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g., Jabalpur Alphonso Mango"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Jabalpur, Madhya Pradesh"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Farmer Price (₹)</label>
                  <input
                    type="number"
                    value={formData.farmerPrice}
                    onChange={(e) => setFormData({ ...formData, farmerPrice: e.target.value })}
                    placeholder="e.g., 20"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload farm photos or certifications</p>
                  <p className="text-sm text-gray-400">Images will be stored on IPFS</p>
                  <button className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                    Choose Files
                  </button>
                </div>

                <button
                  onClick={addSupplyChain}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating on Blockchain...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Supply Chain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chains' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chains.map((chain) => (
              <div key={chain.tokenId} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{chain.product}</h3>
                    <p className="text-sm text-gray-500">Token #{chain.tokenId}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {chain.farmerShare}% Farmer Share
                  </span>
                </div>
                <div className="space-y-3">
                  {STAGE_TYPES.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-${stage.color}`} style={{ backgroundColor: stage.color }} />
                      <span className="text-sm text-gray-600">{stage.name}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${Math.random() * 60 + 20}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500">Total Value</span>
                  <span className="font-bold text-lg">₹{chain.totalValue}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6">Impact Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Farmer Income Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { range: '0-10%', count: 45 },
                    { range: '10-20%', count: 78 },
                    { range: '20-30%', count: 52 },
                    { range: '30-40%', count: 28 },
                    { range: '40%+', count: 12 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Chain Completion Rate</h4>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative inline-flex">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="#E5E7EB" strokeWidth="16" fill="none" />
                        <circle 
                          cx="96" cy="96" r="80" 
                          stroke="#4CAF50" strokeWidth="16" fill="none"
                          strokeDasharray={`${502.4 * 0.94} 502.4`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div>
                          <span className="text-4xl font-bold text-gray-900">94%</span>
                          <p className="text-sm text-gray-500">Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
