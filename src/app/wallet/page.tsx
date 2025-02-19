'use client'
import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCcw, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ethers } from 'ethers';

// Define interfaces for our token types
interface BaseToken {
  name: string;
  symbol: string;
  decimals: number;
}

interface NativeToken extends BaseToken {
  address: null;
  isNative: true;
}

interface ERC20Token extends BaseToken {
  address: string;
  isNative: false;
}

type Token = NativeToken | ERC20Token;

// ERC20 Token ABI - minimal ABI for balance checking
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  }
];

// Common tokens with their contract addresses (Ethereum Mainnet)
const TOKENS: { [key: string]: Token } = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    address: null,
    isNative: true
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    isNative: false
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    isNative: false
  }
};

interface TokenBalance {
  name: string;
  symbol: string;
  balance: string;
  address: string | null;
  value: number;
}

const WalletPage = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this feature');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setWalletAddress(accounts[0]);
      setConnected(true);
      fetchBalances(accounts[0]);
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    }
  };

  const fetchTokenBalance = async (
    provider: ethers.Provider,
    walletAddress: string,
    token: Token
  ) => {
    try {
      if (token.isNative) {
        // Fetch native ETH balance
        const balance = await provider.getBalance(walletAddress);
        return ethers.formatUnits(balance, token.decimals);
      }

      const contract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider
      );
      
      const balance = await contract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, token.decimals);
    } catch (err) {
      console.error(`Error fetching ${token.symbol} balance:`, err);
      return '0';
    }
  };

  const fetchBalances = async (address: string) => {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        'https://eth-mainnet.g.alchemy.com/v2/CG-xF7HArnbaAJqzwknmcR77Mm6'
      );

      const balancePromises = Object.values(TOKENS).map(async (token) => {
        const balance = await fetchTokenBalance(provider, address, token);
        return {
          name: token.name,
          symbol: token.symbol,
          balance,
          address: token.address,
          value: 0 // You would typically fetch current price and calculate value
        };
      });

      const newBalances = await Promise.all(balancePromises);
      setBalances(newBalances);
    } catch (err) {
      setError('Failed to fetch balances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          fetchBalances(accounts[0]);
        } else {
          setConnected(false);
          setWalletAddress('');
          setBalances([]);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Crypto Tracker
            </Link>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href="/wallet" className="text-gray-700 hover:text-blue-600">
                Wallet
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Wallet</h1>
              {connected && (
                <p className="text-gray-600 mt-2">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              )}
            </div>
            {!connected ? (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={() => fetchBalances(walletAddress)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Balances List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              balances.map((token) => (
                <Card key={token.symbol}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Wallet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">{token.name}</h2>
                          <p className="text-gray-500">{token.symbol}</p>
                          {token.address && (
                            <p className="text-sm text-gray-400 mt-1">
                              {token.address.slice(0, 6)}...{token.address.slice(-4)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {parseFloat(token.balance).toFixed(6)} {token.symbol}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;