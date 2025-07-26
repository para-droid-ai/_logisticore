
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = 'font-mono rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 transition-colors duration-150';
  
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-terminal-green text-gray-950 hover:bg-green-400 focus:ring-terminal-green';
      break;
    case 'secondary':
      variantStyles = 'bg-terminal-gray-dark text-terminal-green border border-terminal-green hover:bg-terminal-green hover:text-gray-950 focus:ring-terminal-green';
      break;
    case 'ghost':
      variantStyles = 'text-terminal-cyan hover:bg-terminal-cyan hover:text-gray-950 focus:ring-terminal-cyan';
      break;
  }

  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'px-2 py-1 text-xs';
      break;
    case 'md':
      sizeStyles = 'px-3 py-1.5 text-sm';
      break;
    case 'lg':
      sizeStyles = 'px-4 py-2 text-base';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
    