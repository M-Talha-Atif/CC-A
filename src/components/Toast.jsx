import { AlertCircle, CheckCircle, X } from "lucide-react";
import React, { useEffect } from "react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-[#48A14D]"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "error"
      ? AlertCircle
      : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-2 ${bgColor} text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center space-x-2`}
    >
      <Icon className="h-5 w-5" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
