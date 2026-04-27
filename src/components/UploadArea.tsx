import React, { useState } from 'react';
import { Upload, FileUp, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = () => {
    // Simulate file selection
    const mockFile = new File([""], "shartnoma_final.pdf", { type: "application/pdf" });
    onUpload(mockFile);
  };

  return (
    <motion.div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleUpload();
      }}
      onClick={handleUpload}
      className={`border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer bg-white group ${
        isDragging 
          ? 'border-blue-500 bg-blue-50/50' 
          : 'border-gray-200 bg-gray-50/20 hover:border-blue-400 hover:bg-white'
      }`}
    >
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
        <Upload className="w-8 h-8" />
      </div>
      <div className="space-y-2 mb-6">
        <h4 className="text-lg font-bold text-gray-900 tracking-tight">Yangi hujjat yuklash</h4>
        <p className="text-sm text-gray-500 font-medium">Faylni shu yerga tashlang yoki tanlash tugmasini bosing</p>
      </div>
      <button className="px-6 py-2.5 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-95">
        Kompyuterdan tanlash
      </button>
      <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> DOCX</span>
        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> DOC</span>
      </div>
    </motion.div>
  );
};
