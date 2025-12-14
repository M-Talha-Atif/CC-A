"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import QuoteIcon from "../../../components/QuoteIcon";
import useHelpCenterStore from "../../../hooks/useHelpCenter";

const NewUserPage = () => {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const { openHelpCenter } = useHelpCenterStore();
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState({ x: 2, y: 2 });
  const mailRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (showContent) return;

    const animationFrame = setInterval(() => {
      setPosition((prev) => {
        const container = containerRef.current;
        const mail = mailRef.current;

        if (!container || !mail) return prev;

        const containerRect = container.getBoundingClientRect();
        const mailRect = mail.getBoundingClientRect();

        let newX = prev.x + velocity.x;
        let newY = prev.y + velocity.y;
        let newVelocityX = velocity.x;
        let newVelocityY = velocity.y;

        // Check horizontal bounds
        if (newX <= 0 || newX + mailRect.width >= containerRect.width) {
          newVelocityX = -velocity.x;
          newX = newX <= 0 ? 0 : containerRect.width - mailRect.width;
        }

        // Check vertical bounds
        if (newY <= 0 || newY + mailRect.height >= containerRect.height) {
          newVelocityY = -velocity.y;
          newY = newY <= 0 ? 0 : containerRect.height - mailRect.height;
        }

        if (newVelocityX !== velocity.x || newVelocityY !== velocity.y) {
          setVelocity({ x: newVelocityX, y: newVelocityY });
        }

        return { x: newX, y: newY };
      });
    }, 16); // ~60fps

    return () => clearInterval(animationFrame);
  }, [velocity, showContent]);

  const handleMailClick = () => {
    setShowContent(true);
  };

  const handleJoinUs = () => {
    router.push("/login?flow=creative&step=auth&mode=signup");
  };

  if (showContent) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-start justify-between pt-9 p-6">
        <div className="relative w-[42px] min-h-[20px]">
          <QuoteIcon
            size={68}
            className="quote-logo-crisp absolute -top-6 -left-2"
          />
        </div>
        <div className="w-full max-w-md space-y-0 mt-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome to CUNO COVO
          </h1>

          <div className="bg-white -mx-5 rounded-lg p-5 text-left space-y-2">
            <div className="flex items-start  mb-4">
              <div className="text-xs text-gray-700 flex-1">
                <p className=" mb-1">
                  From: CUNO COVO -  <a href="mailto:info@cunocovo.com" className="underline">  info@cunocovo.com </a>
                </p>
                <p className="text-gray-600 mb-1">
                  cc: Photographer, Videographer, Florist, Planner
                </p>
                <p className="text-gray-600">Date: Sep 1, 2025, 6:30pm</p>
              </div>
            </div>

            <div className="text-sm text-gray-800 leading-relaxed space-y-8">
              <p>
                CUNO COVO is a platform for wedding Creatives to cut
                through the noise, and say what needs to be said with
                intention, <strong>anonymously</strong>. And soon will help Couples
                discover aligned wedding Creatives.
              </p>

              <div className=" mt-2">

                <p className="font-bold">
                  Valuing privacy and authenticity.
                </p>
                <p className="font-bold">
                  A new way to align with couples.
                </p>
              </div>


            </div>
          </div>

          <div className="flex justify-start ml-6">
            <button
              onClick={handleJoinUs}
              className="py-1 px-5 border border-black text-black rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors duration-300"
            >
              Join us
            </button>
          </div>


          <div className="pt-4 mt-12 space-y-8 font-semibold  text-sm text-left">
            <button
              // onClick={() => router.push("/help-center?tab=faq")}
              onClick={() => openHelpCenter("faq")}
              className="block w-full text-left text-gray-700 hover:text-gray-900"
            >
              Frequently Asked Question
            </button>
            <button
              onClick={() => openHelpCenter("guidelines")}
              // onClick={() => router.push("/help-center?tab=guidelines")}
              className="block w-full text-left text-gray-700 hover:text-gray-900"
            >
              Community Guidelines
            </button>
            <button
              onClick={() => openHelpCenter("terms")}
              // onClick={() => router.push("/help-center?tab=terms")}
              className="block w-full text-left text-gray-700 hover:text-gray-900"
            >
              Terms & Privacy
            </button>


          </div>
        </div>
        <p className="text-[10px] text-gray-500 pt-4 leading-relaxed mb-4">
          Disclaimer: This email (including attachments) is not confidential and
          intended for public information. You haven't received it by mistake.
          Any unauthorized disclosure or distribution is prohibited. The views
          expressed are those of the author and directly reflect the vision of
          CUNO COVO
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-white overflow-hidden relative"
    >
      <button
        ref={mailRef}
        onClick={handleMailClick}
        className="absolute cursor-pointer transition-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="relative">
          <Mail className="w-24 h-24 text-black" strokeWidth={2} />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">1</span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default NewUserPage;
