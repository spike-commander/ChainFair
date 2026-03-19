import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Dimensions, Platform } from 'react-native';
import { ethers } from 'ethers';
import { PieChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && Platform.OS === 'web';

let CameraView = null;
let useCameraPermissions = null;

if (!isWeb) {
  try {
    const camera = require('expo-camera');
    CameraView = camera.CameraView;
    useCameraPermissions = camera.useCameraPermissions;
  } catch (e) {
    console.log('Camera not available');
  }
}

const translations = {
  en: {
    title: 'ChainFair',
    subtitle: 'Supply Chain Transparency',
    scanQR: 'Scan QR Code',
    scanning: 'Point camera at QR code...',
    noPermission: 'Camera permission required',
    grantPermission: 'Grant Permission',
    loading: 'Loading chain data...',
    error: 'Error fetching data',
    product: 'Product',
    origin: 'Origin',
    farmer: 'Farmer',
    wholesaler: 'Wholesaler',
    retailer: 'Retailer',
    store: 'Store',
    totalPrice: 'Consumer Price',
    farmerShare: 'Farmer Share',
    chainComplete: 'Chain Complete',
    verifyChain: 'Verified on Blockchain',
    economicInsight: 'Economic Insight',
    middlemenExplain: 'Why do farmers get less? Middlemen add transport, storage, and risk costs at each step.',
    tipFarmer: 'Support Fair Trade',
    tipFarmerDesc: 'Tip the farmer directly via UPI',
    retry: 'Scan Again',
    demoData: 'View Demo Data',
    selectDemo: 'Select a demo product',
    mango: 'Jabalpur Mango',
    tomato: 'Jabalpur Tomato',
    apple: 'Kashmir Apple',
    ipfsNote: 'Images stored on IPFS',
    stagePrice: 'Stage Price',
    profitBreakdown: 'Profit Breakdown',
    chainStages: 'Supply Chain Stages'
  },
  hi: {
    title: 'चेनफेयर',
    subtitle: 'आपूर्ति श्रृंखला पारदर्शिता',
    scanQR: 'QR कोड स्कैन करें',
    scanning: 'QR कोड पर कैमरा रखें...',
    noPermission: 'कैमरा अनुमति आवश्यक',
    grantPermission: 'अनुमति दें',
    loading: 'डेटा लोड हो रहा है...',
    error: 'त्रुटि',
    product: 'उत्पाद',
    origin: 'उत्पत्ति',
    farmer: 'किसान',
    wholesaler: 'थोक व्यापारी',
    retailer: 'खुदरा व्यापारी',
    store: 'दुकान',
    totalPrice: 'उपभोक्ता मूल्य',
    farmerShare: 'किसान का हिस्सा',
    chainComplete: 'श्रृंखला पूर्ण',
    verifyChain: 'ब्लॉकचेन पर सत्यापित',
    economicInsight: 'आर्थिक अंतर्दृष्टि',
    middlemenExplain: 'किसान कम क्यों पाते हैं? मध्यस्थ प्रत्येक चरण में परिवहन, भंडारण और जोखिम लागत जोड़ते हैं।',
    tipFarmer: 'उचित व्यापार का समर्थन करें',
    tipFarmerDesc: 'UPI से किसान को सीधे टिप दें',
    retry: 'फिर से स्कैन करें',
    demoData: 'डेमो डेटा देखें',
    selectDemo: 'डेमो उत्पाद चुनें',
    mango: 'जबलपुर आम',
    tomato: 'जबलपुर टमाटर',
    apple: 'कश्मीर सेब',
    ipfsNote: 'छवियां IPFS पर संग्रहीत',
    stagePrice: 'चरण मूल्य',
    profitBreakdown: 'लाभ विभाजन',
    chainStages: 'आपूर्ति श्रृंखला चरण'
  }
};

const DEMO_CHAINS = [
  {
    tokenId: 0,
    productName: 'Jabalpur Alphonso Mango',
    origin: 'Jabalpur, Madhya Pradesh',
    farmerPrice: 20,
    totalPrice: 200,
    farmerShare: 10,
    stages: [
      { type: 'farmer', name: 'Farmer Cooperative', price: 20, share: 10 },
      { type: 'wholesaler', name: 'Jabalpur Wholesale', price: 60, share: 20 },
      { type: 'retailer', name: 'City Mart', price: 120, share: 30 },
      { type: 'store', name: 'Fresh Picks', price: 200, share: 40 }
    ]
  },
  {
    tokenId: 1,
    productName: 'Jabalpur Organic Tomato',
    origin: 'Jabalpur, Madhya Pradesh',
    farmerPrice: 15,
    totalPrice: 150,
    farmerShare: 10,
    stages: [
      { type: 'farmer', name: 'Local Farmers', price: 15, share: 10 },
      { type: 'wholesaler', name: 'Jabalpur Wholesale', price: 40, share: 17 },
      { type: 'retailer', name: 'City Mart', price: 80, share: 27 },
      { type: 'store', name: 'Fresh Picks', price: 150, share: 46 }
    ]
  },
  {
    tokenId: 2,
    productName: 'Kashmir Premium Apple',
    origin: 'Kashmir Valley',
    farmerPrice: 50,
    totalPrice: 300,
    farmerShare: 17,
    stages: [
      { type: 'farmer', name: 'Kashmir Orchard', price: 50, share: 17 },
      { type: 'wholesaler', name: 'Delhi Agricultural', price: 100, share: 17 },
      { type: 'retailer', name: 'Premium Foods', price: 150, share: 17 },
      { type: 'store', name: 'Jabalpur Fresh', price: 300, share: 49 }
    ]
  }
];

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'; // Replace with deployed address
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const CONTRACT_ABI = [
  'function getChain(uint256 tokenId) view returns (string memory, string memory, uint256, uint256, uint256, bool, uint256)',
  'function getStage(uint256 tokenId, uint256 stageIndex) view returns (uint8, address, string memory, uint256, uint256, string memory, uint256, string memory, bool)'
];

export default function App() {
  const [language, setLanguage] = useState('en');
  const [permission, setPermission] = useState({ granted: false, status: 'loading' });
  const [scanned, setScanned] = useState(false);
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [viewMode, setViewMode] = useState('scan');
  const [isWebPlatform, setIsWebPlatform] = useState(false);

  useEffect(() => {
    setIsWebPlatform(isWeb);
    setPermission({ granted: false, status: 'complete' });
  }, []);

  const t = translations[language];

  const requestPermission = async () => {
    if (useCameraPermissions) {
      const result = await useCameraPermissions();
      setPermission(result);
    }
  };

  const handleQRCodeScanned = useCallback(({ data }) => {
    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      let tokenId;
      
      if (data.startsWith('chainfair://')) {
        tokenId = parseInt(data.replace('chainfair://', ''));
      } else if (data.includes('tokenId=')) {
        const params = new URL(data).searchParams;
        tokenId = parseInt(params.get('tokenId'));
      } else {
        tokenId = parseInt(data);
      }

      if (isNaN(tokenId) || tokenId < 0) {
        throw new Error('Invalid QR code');
      }

      fetchChainData(tokenId);
    } catch (err) {
      setError('Invalid QR code format');
      setLoading(false);
    }
  }, []);

  const fetchChainData = async (tokenId) => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const [productName, origin, totalPrice, farmerPrice, stageCount, isComplete] = 
          await contract.getChain(tokenId);
        
        const stages = [];
        for (let i = 0; i < Number(stageCount); i++) {
          const stage = await contract.getStage(tokenId, i);
          stages.push({
            type: ['Farm', 'Wholesaler', 'Retailer', 'Store'][Number(stage[0])],
            actor: stage[1],
            actorName: stage[2],
            profitShareBPS: Number(stage[3]),
            priceAtStage: Number(stage[4]),
            ipfsHash: stage[5],
            timestamp: Number(stage[6]),
            certificationHash: stage[7],
            isVerified: stage[8]
          });
        }

        setChainData({
          tokenId,
          productName,
          origin,
          totalPrice: Number(ethers.formatEther(totalPrice)) * 1000,
          farmerPrice: Number(ethers.formatEther(farmerPrice)) * 1000,
          stages,
          isComplete,
          ipfsNote: t.ipfsNote
        });
      } else {
        const demoChain = DEMO_CHAINS[tokenId % DEMO_CHAINS.length];
        setChainData({ ...demoChain, ipfsNote: t.ipfsNote });
      }
    } catch (err) {
      const demoChain = DEMO_CHAINS[tokenId % DEMO_CHAINS.length];
      setChainData({ ...demoChain, ipfsNote: t.ipfsNote });
    }
    
    setLoading(false);
  };

  const selectDemoChain = (chain) => {
    setChainData({ ...chain, ipfsNote: t.ipfsNote });
    setShowDemo(false);
  };

  const renderChart = () => {
    if (!chainData) return null;

    const chartData = chainData.stages.map((stage, index) => ({
      name: t[stage.type] || stage.type,
      population: stage.share,
      color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index],
      legendFontColor: '#333',
      legendFontSize: 12
    }));

    return (
      <PieChart
        data={chartData}
        width={SCREEN_WIDTH - 40}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    );
  };

  const renderChainView = () => {
    if (!chainData) return null;

    return (
      <ScrollView style={styles.chainContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.verifyChain}</Text>
          {chainData.isComplete && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.productCard}>
          <Text style={styles.productName}>{chainData.productName}</Text>
          <Text style={styles.productOrigin}>{chainData.origin}</Text>
          
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{t.farmerShare}</Text>
              <Text style={styles.farmerPrice}>₹{chainData.farmerPrice}</Text>
              <Text style={styles.farmerPercent}>{chainData.farmerShare}%</Text>
            </View>
            <View style={styles.priceArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{t.totalPrice}</Text>
              <Text style={styles.totalPrice}>₹{chainData.totalPrice}</Text>
              <Text style={styles.totalPercent}>100%</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>{t.profitBreakdown}</Text>
          {renderChart()}
        </View>

        <View style={styles.stagesSection}>
          <Text style={styles.sectionTitle}>{t.chainStages}</Text>
          {chainData.stages.map((stage, index) => (
            <View key={index} style={styles.stageItem}>
              <View style={[styles.stageIcon, { backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index] }]}>
                <Text style={styles.stageIconText}>{index + 1}</Text>
              </View>
              <View style={styles.stageInfo}>
                <Text style={styles.stageType}>{t[stage.type] || stage.type}</Text>
                <Text style={styles.stageName}>{stage.name}</Text>
                <Text style={styles.stagePrice}>{t.stagePrice}: ₹{stage.price}</Text>
                <Text style={styles.stageShare}>{stage.share}% {t.profitBreakdown.toLowerCase()}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>{t.economicInsight}</Text>
          <Text style={styles.insightText}>{t.middlemenExplain}</Text>
        </View>

        <TouchableOpacity 
          style={styles.tipButton}
          onPress={() => alert('Opening UPI for farmer.jabalpur@upi...')}
        >
          <Text style={styles.tipButtonText}>{t.tipFarmer}</Text>
          <Text style={styles.tipButtonSub}>{t.tipFarmerDesc}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setChainData(null);
            setScanned(false);
          }}
        >
          <Text style={styles.retryButtonText}>{t.retry}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderDemoSelector = () => (
    <View style={styles.demoWrapper}>
      <View style={styles.demoHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowDemo(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.demoTitle}>{t.selectDemo}</Text>
      </View>
      <ScrollView style={styles.demoContainer}>
        {DEMO_CHAINS.map((chain) => (
          <TouchableOpacity
            key={chain.tokenId}
            style={styles.demoItem}
            onPress={() => selectDemoChain(chain)}
          >
            <Text style={styles.demoItemTitle}>{chain.productName}</Text>
            <Text style={styles.demoItemSub}>{chain.origin}</Text>
            <Text style={styles.demoItemPrice}>₹{chain.farmerPrice} → ₹{chain.totalPrice}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (permission.status === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.languageToggle}>
            <TouchableOpacity 
              style={[styles.langButton, language === 'en' && styles.langActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={styles.langText}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langButton, language === 'hi' && styles.langActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={styles.langText}>हि</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  if ((!permission.granted || isWebPlatform) && !showDemo && !chainData) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.languageToggle}>
            <TouchableOpacity 
              style={[styles.langButton, language === 'en' && styles.langActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={styles.langText}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langButton, language === 'hi' && styles.langActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={styles.langText}>हि</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContent}>
          {isWebPlatform && (
            <Text style={styles.webNote}>QR scanning available on mobile device</Text>
          )}
          {!isWebPlatform && (
            <>
              <Text style={styles.permissionText}>{t.noPermission}</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>{t.grantPermission}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => setShowDemo(true)}
          >
            <Text style={styles.demoButtonText}>{t.demoData}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.languageToggle}>
          <TouchableOpacity 
            style={[styles.langButton, language === 'en' && styles.langActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.langText}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langButton, language === 'hi' && styles.langActive]}
            onPress={() => setLanguage('hi')}
          >
            <Text style={styles.langText}>हि</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setScanned(false);
              }}
            >
              <Text style={styles.retryButtonText}>{t.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : chainData ? (
          renderChainView()
        ) : showDemo ? (
          renderDemoSelector()
        ) : CameraView ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.scanText}>{t.scanning}</Text>
              </View>
            </CameraView>
            <TouchableOpacity 
              style={styles.demoToggle}
              onPress={() => setShowDemo(true)}
            >
              <Text style={styles.demoToggleText}>{t.demoData}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.webNote}>Camera not available on web</Text>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={() => setShowDemo(true)}
            >
              <Text style={styles.demoButtonText}>{t.demoData}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webNote: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  languageToggle: {
    flexDirection: 'row',
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  langActive: {
    backgroundColor: '#fff',
  },
  langText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  demoToggle: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  demoToggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  demoButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  demoContainer: {
    flex: 1,
    padding: 20,
  },
  demoWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  demoItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demoItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  demoItemSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  demoItemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
  },
  chainContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  productOrigin: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  priceBox: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  farmerPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  farmerPercent: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPercent: {
    fontSize: 16,
    color: '#333',
  },
  priceArrow: {
    paddingHorizontal: 10,
  },
  arrowText: {
    fontSize: 24,
    color: '#999',
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stagesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  stageItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stageIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stageInfo: {
    flex: 1,
  },
  stageType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stageName: {
    fontSize: 14,
    color: '#666',
  },
  stagePrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  stageShare: {
    fontSize: 12,
    color: '#999',
  },
  insightCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  tipButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  tipButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
