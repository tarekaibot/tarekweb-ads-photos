
import React from 'react';
import { AdIdea } from '../types';

const IdeaCard: React.FC<AdIdea> = ({ title, description }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1">
      <h3 className="text-xl font-bold text-cyan-400 mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
};

export default IdeaCard;
