'use client'
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';

// Define the type for the cryptocurrency data
interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CryptoTracker = () => {
  const [prices, setPrices] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?' +
        'vs_currency=usd&' +
        'order=market_cap_desc&' +
        'per_page=10&' +
        'page=1&' +
        'sparkline=false&' +
        'price_change_percentage=24h'
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data: CryptoData[] = await response.json();
      setPrices(data);
      setError(null);
    } catch {
      setError('Failed to fetch cryptocurrency data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and set up periodic updates
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="text-red-600">{error}</div>
            <button 
              onClick={fetchPrices}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </Card>
        </div>
      </div>
    );
  }

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
              <Link href="/about" className="text-gray-700 hover:text-blue-600">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Crypto Price Tracker</h1>
            <button 
              onClick={fetchPrices} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          
          <div className="grid gap-4">
            {loading ? (
              <Card className="w-full p-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ) : (
              prices.map((crypto: CryptoData) => (
                <Card key={crypto.id} className="w-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img 
                          src={crypto.image} 
                          alt={crypto.name} 
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h2 className="text-xl font-semibold">{crypto.name}</h2>
                          <p className="text-gray-500">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${crypto.current_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        <div className={`flex items-center gap-1 ${
                          crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {crypto.price_change_percentage_24h >= 0 ? 
                            <ArrowUp className="w-4 h-4" /> : 
                            <ArrowDown className="w-4 h-4" />
                          }
                          <span className="font-medium">
                            {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                          </span>
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

export default CryptoTracker;