import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-2.5 text-gray-400">{icon}</span>
        )}
        <input
          {...props}
          className={`w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-700 ${className}`}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Input;
