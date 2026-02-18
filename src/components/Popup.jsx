const SimplePopup = ({ message, buttonText = "OK", onClose, onModalClose }) => {
  return (
    <div className="fixed inset-0 bg-[#00000064] bg-opacity-50 flex items-center justify-center z-50" onClick={onModalClose }>
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <p className="text-black text-center text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SimplePopup;
