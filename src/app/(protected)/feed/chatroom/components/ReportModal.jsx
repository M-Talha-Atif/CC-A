import React from "react";
import InfoIcon from "@/components/InfoIcon";

const ReportModal = ({ 
  commentId, 
  isOwnComment, 
  hasReported, 
  isReporting,
  onReport, 
  onClose,
  position = "right" // "right" or "left"
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal */}
      <div
        className={`absolute ${
          position === "right" ? "top-6 -right-44" : "top-8 left-0"
        } bg-white rounded-2xl w-[230px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="text-gray-600 text-xs mb-3">
            {isOwnComment
              ? "You cannot report your own comment"
              : hasReported
              ? "You have already reported this comment"
              : "Report this comment for containing abuse, harassment, or spam."}
          </p>
          
          <div className="space-y-3">
            {isOwnComment || hasReported ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full bg-gray-500 text-white py-1 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Close
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(commentId);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                disabled={isReporting}
                className="w-full bg-black text-white py-1 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {isReporting ? "Reporting..." : "Report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportModal;