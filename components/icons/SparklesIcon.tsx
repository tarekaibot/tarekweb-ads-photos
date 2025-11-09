
import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3a6 6 0 0 0 9 9a6 6 0 0 0-9-9Z" />
    <path d="M5 11a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z" />
    <path d="M19 13a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z" />
  </svg>
);
