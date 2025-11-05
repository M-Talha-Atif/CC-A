import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

// Fixed ChatroomTimer Component
const ChatroomTimer = ({ post, onJoinChatroom, formatTimeRemaining }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerState, setTimerState] = useState("loading");

  // Calculate the timer state based on post data
  const calculateTimerState = (post) => {
    if (!post) return { state: "loading", timeRemaining: null };

    // 1. Check if threshold is met
    if (!post.thresholdMet) {
      const THRESHOLD_DURATION = 1 * 60 * 60 * 1000; // 1 hour
      const createdAt = new Date(post.createdAt).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;
      const remaining = THRESHOLD_DURATION - elapsed;

      if (remaining <= 0) {
        return { state: "threshold_failed", timeRemaining: 0 };
      }
      return {
        state: "waiting_threshold",
        timeRemaining: remaining,
        likesNeeded: Math.max(0, 1 - (post.likes || 0)),
      };
    }

    // 2. Threshold met, check if comments enabled
    if (!post.commentsEnabled) {
      return { state: "threshold_met_waiting", timeRemaining: null };
    }

    // 3. Comments enabled, check chatroom status
    if (!post.commentsCount || post.commentsCount === 0) {
      return { state: "waiting_first_comment", timeRemaining: null };
    }

    // 4. Has comments - check if timer is active
    if (post.chatroomData?.timeRemaining > 0) {
      return {
        state: "timer_active",
        timeRemaining: post.chatroomData.timeRemaining,
      };
    }

    // 5. Timer expired or manually closed
    return { state: "expired", timeRemaining: 0 };
  };

  // Update timer state when post changes
  useEffect(() => {
    const newState = calculateTimerState(post);
    setTimerState(newState.state);
    setTimeRemaining(newState.timeRemaining);
  }, [post]);

  // Handle countdown for active states
  useEffect(() => {
    let interval;

    if (
      (timerState === "waiting_threshold" || timerState === "timer_active") &&
      timeRemaining > 0
    ) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1000);

          // Update state when timer expires
          if (newTime === 0) {
            if (timerState === "waiting_threshold") {
              setTimerState("threshold_failed");
            } else if (timerState === "timer_active") {
              setTimerState("expired");
            }
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeRemaining]);

  // Format time consistently
  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "0s";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get appropriate styling based on state
  const getTimerStyle = () => {
    switch (timerState) {
      case "waiting_threshold":
        const likesNeeded = Math.max(0, 1 - (post?.likes || 0));
        if (timeRemaining < 10 * 60 * 1000) {
          // Less than 10 minutes
          return { color: "text-red-600", urgency: "critical" };
        } else if (timeRemaining < 30 * 60 * 1000) {
          // Less than 30 minutes
          return { color: "text-orange-500", urgency: "warning" };
        }
        return { color: "text-amber-600", urgency: "normal" };

      case "timer_active":
        if (timeRemaining < 5 * 60 * 1000) {
          // Less than 5 minutes
          return { color: "text-red-600", urgency: "critical" };
        } else if (timeRemaining < 15 * 60 * 1000) {
          // Less than 15 minutes
          return { color: "text-orange-500", urgency: "warning" };
        }
        return { color: "text-blue-600", urgency: "normal" };

      case "waiting_first_comment":
        return { color: "text-green-600", urgency: "normal" };

      case "threshold_failed":
      case "expired":
        return { color: "text-gray-500", urgency: "none" };

      default:
        return { color: "text-gray-600", urgency: "normal" };
    }
  };

  // Render based on current state
  const renderTimerContent = () => {
    const style = getTimerStyle();

    switch (timerState) {
      case "loading":
        return <div className="text-xs text-gray-400">Loading...</div>;

      case "waiting_threshold":
        const likesNeeded = Math.max(0, 1 - (post?.likes || 0));
        return (
          <div className={`text-xs ${style.color} font-medium`}>
            {likesNeeded > 0 ? (
              <>
                Need {likesNeeded} more like{likesNeeded !== 1 ? "s" : ""} to
                enable comments
                <div className="text-[10px] mt-1">
                  {formatTime(timeRemaining)} remaining
                </div>
              </>
            ) : (
              <>Requirements met! Enabling comments...</>
            )}
          </div>
        );

      case "threshold_met_waiting":
        return (
          <div className="text-xs text-blue-600 font-medium">
            Requirements met! Comments enabling...
          </div>
        );

      case "waiting_first_comment":
        return (
          <div className="text-xs text-green-600 font-medium">
            💬 Ready for comments!
            <div className="text-[10px] mt-1 text-gray-500">
              Timer starts with first comment
            </div>
          </div>
        );

      case "timer_active":
        return (
          <div className={`text-xs ${style.color} font-medium`}>
            ⏰ Closes in {formatTime(timeRemaining)}
            {style.urgency === "critical" && (
              <div className="text-[10px] mt-1 text-red-600">
                Hurry! Almost expired
              </div>
            )}
          </div>
        );

      case "expired":
        return (
          <div className="text-xs text-gray-500 italic">
            Chatroom closed (read-only)
          </div>
        );

      case "threshold_failed":
        return (
          <div className="text-xs text-red-600 italic">
            Requirements not met
          </div>
        );

      default:
        return null;
    }
  };

  // Don't render if no post data
  if (!post) return null;

  return (
    <div className="flex items-center justify-end">
      <div className="text-right">{renderTimerContent()}</div>
    </div>
  );
};

export default ChatroomTimer;
