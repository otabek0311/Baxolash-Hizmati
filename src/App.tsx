/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/Upload';
import { HowItWorks } from './pages/HowItWorks';
import { Documents, Archive, Settings } from './pages/OtherPages';
import { Search, Bell, HelpCircle, QrCode } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { AIChatBot } from './components/AIChatBot';

export default function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (result: string) => {
    console.log("Scanned result:", result);
    setIsScannerOpen(false);
    // In a real app, this would navigate to the document/page
    alert(`Topilgan hujjat ID: ${result}`);
  };

  return (
    <Router>
      <div className="flex h-screen bg-[#F3F4F6] text-[#1F2937] font-sans overflow-hidden">
        <Sidebar />
        
        {isScannerOpen && (
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}

        <AIChatBot />
        
        <main className="flex-1 flex flex-col min-w-0 ml-56">
          {/* Header */}
          <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tizim bo'ylab qidirish..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="h-6 w-[1px] bg-gray-200 mx-1" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">OA</div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-900 leading-none">Otabek A.</p>
                  <p className="text-[9px] text-gray-400 font-medium">Bosh admin</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
            
            <footer className="mt-20 pt-8 border-t border-gray-100 text-center pb-12 max-w-7xl mx-auto">
              <p className="text-[10px] font-medium text-gray-400">© 2026 QR Hujjat Tizimi. Barcha huquqlar himoyalangan.</p>
            </footer>
          </div>
        </main>
      </div>
    </Router>
  );
}

