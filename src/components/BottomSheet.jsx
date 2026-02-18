// components/BottomSheet.jsx
"use client";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useEffect } from "react";

const BottomSheet = ({ isOpen, onClose, children }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [isOpen, controls]);

  const handleDragEnd = (event, info) => {
    const shouldClose =
      info.velocity.y > 20 || (info.velocity.y >= 0 && info.point.y > 200);

    if (shouldClose) {
      controls.start("hidden");
      setTimeout(() => onClose(), 150);
    } else {
      controls.start("visible");
    }
  };

  const variants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        />
      )}

      {/* Bottom Sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        initial="hidden"
        animate={controls}
        variants={variants}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-2 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-2rem)] pb-8">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default BottomSheet;
