import React from "react";
import InfoIcon from "@/components/InfoIcon";
import ReportModal from "./ReportModal";

const ReportButton = ({ 
  commentId, 
  isOwnComment,
  hasReported,
  isReporting,
  showModal,
  onOpenModal,
  onCloseModal,
  onReport,
  position = "right"
}) => {
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenModal(commentId);
        }}
        className="hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700"
      >
        <InfoIcon size={16} className="text-gray-500 mt-1" />
      </button>

      {showModal === commentId && (
        <ReportModal
          commentId={commentId}
          isOwnComment={isOwnComment}
          hasReported={hasReported}
          isReporting={isReporting}
          onReport={onReport}
          onClose={onCloseModal}
          position={position}
        />
      )}
    </div>
  );
};

export default ReportButton;