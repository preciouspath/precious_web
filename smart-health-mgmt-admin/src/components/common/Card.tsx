import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, footer, className }) => {
  return (
    <div
      className={`bg-white shadow-md rounded-2xl border border-gray-100 p-5 ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          {title}
        </h3>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
    </div>
  );
};

export default Card;
