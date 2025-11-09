import React from 'react';
import { AdImage } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

const ImageCard: React.FC<AdImage> = ({ src, prompt }) => {
  return (
    <div className="bg-gray-800/50 group backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img src={src} alt={prompt} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href={src}
            download={`ad-image-${prompt.substring(0, 20).replace(/\s/g, '_')}.png`}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105"
            aria-label={`تنزيل الصورة: ${prompt}`}
          >
            <DownloadIcon className="w-5 h-5" />
            <span>تنزيل</span>
          </a>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-300 text-sm leading-relaxed h-12 overflow-hidden">{prompt}</p>
      </div>
    </div>
  );
};

export default ImageCard;
