"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Edit3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createCreativeInquiry, storeChatData } from "../../../../../action";

const CustomCalendar = ({ selectedDate, onDateSelect, onClose }) => {
  const [inputDate, setInputDate] = useState("");
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  twoYearsFromNow.setHours(23, 59, 59, 999); // End of day

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize input with selected date if exists
  React.useEffect(() => {
    if (selectedDate) {
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const year = selectedDate.getFullYear();
      setInputDate(`${month}/${day}/${year}`);
    }
  }, [selectedDate]);

  // Update temp selection when props change
  React.useEffect(() => {
    setTempSelectedDate(selectedDate);
  }, [selectedDate]);

  // Generate all months from current month to exactly 2 years from today
  const generateMonthsToShow = () => {
    const monthsToShow = [];
    const startDate = new Date(today.getFullYear(), today.getMonth());
    const endDate = new Date(
      twoYearsFromNow.getFullYear(),
      twoYearsFromNow.getMonth()
    );

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      monthsToShow.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthsToShow;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < today || date > twoYearsFromNow;
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(date);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and forward slashes
    const cleanValue = value.replace(/[^\d/]/g, "");

    // Format as MM/DD/YYYY
    if (cleanValue.length <= 10) {
      let formatted = cleanValue;
      if (cleanValue.length >= 3 && cleanValue[2] !== "/") {
        formatted = cleanValue.slice(0, 2) + "/" + cleanValue.slice(2);
      }
      if (cleanValue.length >= 6 && cleanValue[5] !== "/") {
        formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
      }
      setInputDate(formatted);
    }
  };

  const handleInputSubmit = () => {
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = inputDate.match(datePattern);

    if (match) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (!isDateDisabled(date)) {
          onDateSelect(date);
        }
      }
    }
  };

  const handleReset = () => {
    setInputDate("");
    // Reset to no selection
    onDateSelect(null);
  };

  const monthsToShow = generateMonthsToShow();

  return (
    <div
      className="fixed inset-0 bg-[#0000005b] bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-slide-up flex flex-col"
        style={{
          maxHeight: "80vh",
          height: "600px", // Fixed height
          position: "relative",
          top: "50%",
          transform: "translateY(-50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header with date input */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={inputDate}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit();
                }
              }}
              placeholder="MM/DD/YYYY"
              className="text-center text-lg font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 focus:border-transparent"
              maxLength={10}
            />
          </div>
        </div>

        {/* Scrollable months container */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="space-y-8">
            {monthsToShow.map((monthDate, monthIndex) => {
              const days = getDaysInMonth(monthDate);

              return (
                <div
                  key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                  className="space-y-4"
                >
                  {/* Month header with year */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {months[monthDate.getMonth()]} {monthDate.getFullYear()}
                    </h3>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <div
                        key={index}
                        className="text-center text-sm font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((date, index) => (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        disabled={isDateDisabled(date)}
                        className={`
                          aspect-square flex items-center justify-center text-sm rounded-xl min-h-[40px] transition-all
                          ${!date ? "invisible" : ""}
                          ${
                            isDateDisabled(date)
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-100 cursor-pointer active:bg-gray-200 active:scale-95"
                          }
                          ${
                            isSelectedDate(date)
                              ? "bg-black text-white hover:bg-gray-800 shadow-lg"
                              : ""
                          }
                        `}
                      >
                        {date?.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Reset and Cancel */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex justify-between flex-shrink-0">
          <button
            onClick={handleReset}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium rounded-xl hover:bg-gray-100"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const CombinedSeasonYearDropdown = ({
  value,
  onChange,
  isOpen,
  onToggle,
  isEditMode = false,
  onCancel,
}) => {
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const seasons = ["Fall", "Spring", "Summer", "Winter"];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1, currentYear + 2];
  };

  useEffect(() => {
    if (value) {
      const parts = value.split(" ");
      if (parts.length === 2) {
        setSelectedSeason(parts[0]);
        setSelectedYear(parts[1]);
      }
    }
  }, [value]);

  const handleSeasonSelect = (season) => {
    setSelectedSeason(season);
    setShowSeasonDropdown(false);

    // FIXED: In edit mode, update the parent's editing value immediately
    if (isEditMode && selectedYear) {
      const combined = `${season} ${selectedYear}`;
      // Call onChange to update the parent's editingValue
      onChange(combined);
    } else if (!isEditMode && selectedYear) {
      const combined = `${season} ${selectedYear}`;
      onChange(combined);
    }
  };

  // Replace the handleYearSelect function:
  const handleYearSelect = (year) => {
    setSelectedYear(year.toString());
    setShowYearDropdown(false);

    // FIXED: In edit mode, update the parent's editing value immediately
    if (isEditMode && selectedSeason) {
      const combined = `${selectedSeason} ${year}`;
      // Call onChange to update the parent's editingValue
      onChange(combined);
    } else if (!isEditMode && selectedSeason) {
      const combined = `${selectedSeason} ${year}`;
      onChange(combined);
    }
  };

  // NEW: Function to get current combined value for edit mode
  const getCurrentCombined = () => {
    if (selectedSeason && selectedYear) {
      return `${selectedSeason} ${selectedYear}`;
    }
    return "";
  };

  // NEW: Function to manually trigger onChange in edit mode
  const handleManualSubmit = () => {
    const combined = getCurrentCombined();
    if (combined && onChange) {
      onChange(combined);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <button
            onClick={() => {
              setShowSeasonDropdown(!showSeasonDropdown);
              setShowYearDropdown(false);
            }}
            className="w-full px-8 py-1 bg-white  rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm text-left flex items-center justify-between"
            style={{ fontSize: "16px" }}
          >
            <span
              className={selectedSeason ? "text-gray-800" : "text-gray-500"}
            >
              {selectedSeason || "Season"}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showSeasonDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSeasonDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 z-50 backdrop-blur-sm">
              {seasons.map((season, index) => (
                <button
                  key={index}
                  onClick={() => handleSeasonSelect(season)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 transition-colors"
                >
                  {season}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <button
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowSeasonDropdown(false);
            }}
            className="w-full px-2  py-1 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm text-left flex items-center justify-between"
            style={{ fontSize: "16px" }}
          >
            <span className={selectedYear ? "text-gray-800" : "text-gray-500"}>
              {selectedYear || "Year"}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showYearDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-40 overflow-y-auto z-50 backdrop-blur-sm">
              {generateYearOptions().map((year, index) => (
                <button
                  key={index}
                  onClick={() => handleYearSelect(year)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 transition-colors"
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlanningTypeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["Full Planning", "Partial Planning"];

  return (
    <div className="relative ">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black 
        focus:ring-opacity-20 text-sm text-left flex items-center justify-between gap-2"
        style={{ fontSize: "16px", minHeight: "48px" }}
      >
        <span className={value ? "text-gray-800" : "text-gray-500"}>
          {value || "Select planning type"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 backdrop-blur-sm">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ServiceAreaDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["Who typically serve California, please", "Nationwide"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black 
        focus:ring-opacity-20 text-sm text-left flex items-center justify-between gap-2"
        style={{ fontSize: "16px", minHeight: "35px" }}
      >
        <span className={value ? "text-gray-800" : "text-gray-500"}>
          {value || "Select preference"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 min-w-[65px]
         rounded-lg  z-50 bg-white"
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FindCreativeChatPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentStep, setCurrentStep] = useState("location");
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showingEditId, setShowingEditId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editSelectedDate, setEditSelectedDate] = useState(null);
  const [messageStepMap, setMessageStepMap] = useState({});
  const [inputVisible, setInputVisible] = useState(false);
  const [inputContentVisible, setInputContentVisible] = useState(true);
  const [shownMessageIds, setShownMessageIds] = useState(new Set());

  const [inputTransitioning, setInputTransitioning] = useState(false);

  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const storedData = window.sessionStorage.getItem(
          "findCreativeSelectionForChat"
        );
        if (storedData) {
          return JSON.parse(storedData);
        }
      } catch (error) {
        console.error("Error loading from session storage:", error);
      }
    }

    return {
      creativeDomain: ["photography"],
      selectedService: "wedding",
      proposalCount: 5,
      location: "",
      hasWeddingDate: "",
      weddingDate: "",
      weddingSeasonYear: "",
      planningType: "",
      budget: "",
      guestCount: "",
      serviceArea: "", // NEW
      additionalDetails: "", // NEW
    };
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editLocationSuggestions, setEditLocationSuggestions] = useState([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [dateError, setDateError] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingEditLocations, setIsLoadingEditLocations] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editingSummaryField, setEditingSummaryField] = useState(null);
  const [summaryEditValue, setSummaryEditValue] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [viewportHeight, setViewportHeight] = useState("100vh");

  useEffect(() => {
    const setVH = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(`${height}px`);
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);

      const isKeyboardVisible = window.visualViewport
        ? window.visualViewport.height < window.screen.height * 0.75
        : false;
      setKeyboardVisible(isKeyboardVisible);
    };

    setVH();

    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", () => setTimeout(setVH, 100));

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVH);
    }

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVH);
      }
    };
  }, []);

  // FIXED: Corrected welcome message generation
  const generatePrompt = (service, domain) => {
    const domainName =
      domain === "photography"
        ? "photographer"
        : domain === "videography"
        ? "videographer"
        : domain;

    if (service.includes("engagement and wedding")) {
      return `Welcome, I'm happy to help! So you're looking for an engagement & wedding ${domainName}? Where are you getting engaged and married?`;
    } else if (service.includes("multi-day wedding")) {
      return `Welcome, I'm happy to help! So you're looking for a multi day wedding ${domainName}? Where are you getting engaged and married?`;
    } else if (service.includes("engagement")) {
      return `Welcome, I'm happy to help! So you're looking for an engagement ${domainName}. Where are you getting engaged?`;
    } else if (service.includes("elopement")) {
      return `Welcome, I'm happy to help! So you're looking for an elopement ${domainName}? Where are you getting eloped?`;
    } else if (service.includes("wedding")) {
      return `Welcome, I'm happy to help! So you're looking for a wedding ${domainName}. Where are you getting married?`;
    }

    return `Welcome, I'm happy to help! So you're looking for a ${domainName}. Where are you getting married?`;
  };

  const generateBudgetPrompt = (service, domain) => {
    if (domain === "photography") {
      if (service.includes("engagement and wedding")) {
        return "Exciting! Now what is your engagement & wedding photography budget?";
      } else if (service.includes("multi-day wedding")) {
        return "Exciting! Now what is your multi-day wedding photography budget?";
      } else if (service.includes("engagement")) {
        return "Exciting! Now what is your engagement photography budget?";
      } else if (service.includes("elopement")) {
        return "Exciting! Now what is your elopement photography budget?";
      } else if (service.includes("wedding")) {
        return "Exciting! Now what is your wedding photography budget?";
      }
    } else if (domain === "videography") {
      if (service.includes("engagement and wedding")) {
        return "Exciting! Now what is your engagement & wedding videography budget?";
      } else if (service.includes("multi-day wedding")) {
        return "Exciting! Now what is your multi-day wedding videography budget?";
      } else if (service.includes("engagement")) {
        return "Exciting! Now what is your engagement videography budget?";
      } else if (service.includes("elopement")) {
        return "Exciting! Now what is your elopement videography budget?";
      } else if (service.includes("wedding")) {
        return "Exciting! Now what is your wedding videography budget?";
      }
    } else if (domain === "florist") {
      if (service.includes("multi-day wedding")) {
        return "Exciting! Now what is your multi-day wedding overall budget?";
      } else if (service.includes("elopement")) {
        return "Exciting! Now what is your elopement overall budget?";
      } else {
        return "Exciting! Now what is your wedding overall budget?";
      }
    } else if (domain === "planner") {
      if (service.includes("multi-day wedding")) {
        return "Exciting! Now what is your multi-day wedding overall budget?";
      } else if (service.includes("elopement")) {
        return "Exciting! Now what is your elopement overall budget?";
      } else {
        return "Exciting! Now what is your wedding overall budget?";
      }
    }

    // Default fallback
    return "Exciting! What's your wedding budget?";
  };

  const chatSteps = {
    location: {
      prompt: "generatePrompt",
      nextStep: "hasWeddingDate",
      inputType: "location",
      placeholder: "Los Angeles, CA",
    },
    hasWeddingDate: {
      prompt: "Do you have a wedding date?",
      nextStep: "conditionalNext",
      inputType: "yesno",
      placeholder: "Type YES or NO",
    },
    weddingDate: {
      prompt: "Sounds great! When is your wedding date?",
      nextStep: "conditionalPlanning",
      inputType: "calendar",
      placeholder: "Select date",
    },
    weddingSeasonYear: {
      prompt: "What season and year are you thinking?",
      nextStep: "conditionalPlanning",
      inputType: "seasonYear",
      placeholder: "Select season and year",
    },
    planningType: {
      prompt: "Are you interested in full planning or partial planning?",
      nextStep: "budget",
      inputType: "planningTypeDropdown",
      placeholder: "Select planning type",
    },
    budget: {
      prompt: "generateBudgetPrompt",
      nextStep: "guestCount",
      inputType: "budget",
      placeholder: "$8000",
    },
    guestCount: {
      prompt: "Perfect! How many guests will be attending your wedding?",
      nextStep: "serviceArea",
      inputType: "number",
      placeholder: "150",
    },
    serviceArea: {
      prompt:
        "You got it. Do you prefer to be shown Creatives who typically serve California, or are you open to reviewing aligned creatives in all of the U.S?",
      nextStep: "additionalDetails",
      inputType: "serviceAreaDropdown",
      placeholder: "Select preference",
    },
    additionalDetails: {
      prompt:
        "Noted. One last thing, any other details you'd like the creative to know?",
      nextStep: "summaryConfirm",
      inputType: "text",
      placeholder: "Share any additional preferences...",
    },
    // Remove the summary step entirely - it will be handled as a bot message
    summaryConfirm: {
      prompt: "All set to send?",
      nextStep: "complete",
      inputType: "yesno",
    },
  };

  const MAPBOX_ACCESS_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "your_mapbox_token_here";

  const fetchLocationSuggestions = async (input, isEdit = false) => {
    if (!input || input.length < 2) {
      if (isEdit) {
        setEditLocationSuggestions([]);
        setIsLoadingEditLocations(false);
      } else {
        setLocationSuggestions([]);
        setIsLoadingLocations(false);
      }
      return;
    }

    if (isEdit) {
      setIsLoadingEditLocations(true);
    } else {
      setIsLoadingLocations(true);
    }

    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        input
      )}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        country: "US",
        types: "place,locality,neighborhood",
        limit: "8",
        language: "en",
        autocomplete: "true",
      });

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error(`Mapbox API error: ${response.status}`);

      const data = await response.json();
      const suggestions = data.features.map((feature) => {
        const { place_name, context = [] } = feature;
        let state = "";

        context.forEach((item) => {
          if (item.id.includes("region")) {
            state = item.short_code?.replace("US-", "") || item.text;
          }
        });

        const cityName = feature.text;
        return state ? `${cityName}, ${state}` : place_name;
      });

      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

      if (isEdit) {
        setEditLocationSuggestions(uniqueSuggestions);
      } else {
        setLocationSuggestions(uniqueSuggestions);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      const mockLocations = ["Los Angeles, CA", "New York, NY", "Chicago, IL"];
      const filtered = mockLocations.filter((loc) =>
        loc.toLowerCase().includes(input.toLowerCase())
      );

      if (isEdit) {
        setEditLocationSuggestions(filtered);
      } else {
        setLocationSuggestions(filtered);
      }
    } finally {
      if (isEdit) {
        setIsLoadingEditLocations(false);
      } else {
        setIsLoadingLocations(false);
      }
    }
  };

  const debouncedLocationSearch = useRef(null);
  const debouncedEditLocationSearch = useRef(null);

  const handleLocationChange = (value, isEdit = false) => {
    if (isEdit) {
      setEditingValue(value);
      setShowEditSuggestions(value.trim().length > 0);

      if (debouncedEditLocationSearch.current) {
        clearTimeout(debouncedEditLocationSearch.current);
      }

      debouncedEditLocationSearch.current = setTimeout(() => {
        fetchLocationSuggestions(value, true);
      }, 300);
    } else {
      setCurrentInput(value);
      setShowSuggestions(value.trim().length > 0);

      if (debouncedLocationSearch.current) {
        clearTimeout(debouncedLocationSearch.current);
      }

      debouncedLocationSearch.current = setTimeout(() => {
        fetchLocationSuggestions(value, false);
      }, 300);
    }
  };

  const handleLocationSelect = (location, isEdit = false, messageId = null) => {
    if (isEdit && messageId) {
      setEditingValue(location);
      setShowEditSuggestions(false);
      setEditLocationSuggestions([]);
      handleSaveEdit(messageId, location);
    } else {
      setCurrentInput(location);
      setShowSuggestions(false);
      setLocationSuggestions([]);
      handleSubmitInput(location);
    }
  };

  const formatDateForDisplay = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleCalendarDateSelect = (date, isEdit = false, messageId = null) => {
    const formattedDate = formatDateForDisplay(date);

    if (isEdit && messageId) {
      setEditSelectedDate(date);
      setEditingValue(formattedDate);
      setShowCalendar(false);
      handleSaveEdit(messageId, formattedDate);
    } else {
      setSelectedDate(date);
      setCurrentInput(formattedDate);
      setShowCalendar(false);
      handleSubmitInput(formattedDate);
    }
  };

  useEffect(() => {
    if (hasInitialized) return;

    // NEW: Check if user is starting fresh (not continuing)
    const isReturningUserContinuing = sessionStorage.getItem(
      "isReturningUserContinuing"
    );
    const currentInquiryId = sessionStorage.getItem("currentInquiryId");

    // Load persisted chat data ONLY if user is continuing
    if (typeof window !== "undefined" && isReturningUserContinuing === "true") {
      try {
        const persistedChat = sessionStorage.getItem("chatMessages");
        const persistedStep = sessionStorage.getItem("chatCurrentStep");

        if (persistedChat && persistedStep) {
          const savedMessages = JSON.parse(persistedChat);
          const savedStep = persistedStep;

          setMessages(savedMessages);
          setCurrentStep(savedStep);
          setInputVisible(true);

          // FIXED: Load persisted shown IDs to prevent re-animation
          const persistedShownIds = sessionStorage.getItem(
            "chatShownMessageIds"
          );
          if (persistedShownIds) {
            setShownMessageIds(new Set(JSON.parse(persistedShownIds)));
          } else {
            const messageIds = savedMessages.map((msg) => msg.id);
            setShownMessageIds(new Set(messageIds));
          }

          setHasInitialized(true);
          // Clear the flag after using it
          sessionStorage.removeItem("isReturningUserContinuing");
          return;
        }
      } catch (error) {
        console.error("Error loading persisted chat:", error);
      }
    }

    // NEW: If not continuing, clear any old chat data
    sessionStorage.removeItem("chatMessages");
    sessionStorage.removeItem("chatCurrentStep");
    sessionStorage.removeItem("isReturningUserContinuing");

    // Start fresh chat
    setTimeout(() => {
      const welcomeMessage = generatePrompt(
        formData.selectedService,
        formData.creativeDomain[0]
      );

      setMessages([
        {
          id: Date.now(),
          text: welcomeMessage,
          isUser: false,
          type: "text",
          timestamp: new Date(),
        },
      ]);

      setTimeout(() => {
        setInputVisible(true);
      }, 1000);
    }, 500);

    setHasInitialized(true);
  }, [formData]);

  useEffect(() => {
    if (hasInitialized && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("chatMessages", JSON.stringify(messages));
        sessionStorage.setItem("chatCurrentStep", currentStep);
        // FIXED: Persist shown message IDs to prevent re-animation
        sessionStorage.setItem(
          "chatShownMessageIds",
          JSON.stringify([...shownMessageIds])
        );
      } catch (error) {
        console.error("Error persisting chat data:", error);
      }
    }
  }, [messages, currentStep, hasInitialized, shownMessageIds]);

  useEffect(() => {
    const setVH = () => {
      // More robust viewport height calculation for iOS
      let height;

      if (window.visualViewport) {
        height = window.visualViewport.height;
      } else if (window.innerHeight) {
        height = window.innerHeight;
      } else {
        height = document.documentElement.clientHeight;
      }

      // Prevent random enlargement on iOS
      const minHeight = Math.min(height, window.screen.height);
      setViewportHeight(`${minHeight}px`);

      document.documentElement.style.setProperty(
        "--vh",
        `${minHeight * 0.01}px`
      );
      document.documentElement.style.setProperty("height", `${minHeight}px`);

      const isKeyboardVisible = window.visualViewport
        ? window.visualViewport.height < window.screen.height * 0.75
        : false;
      setKeyboardVisible(isKeyboardVisible);
    };

    setVH();

    const handleResize = () => {
      requestAnimationFrame(setVH);
    };

    const handleOrientationChange = () => {
      setTimeout(() => requestAnimationFrame(setVH), 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, {
      passive: true,
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const addMessage = (text, isUser = false, type = "text", data = null) => {
    const message = {
      id: Date.now() + Math.random(),
      text,
      isUser,
      type,
      data,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    if (isUser && currentStep) {
      setMessageStepMap((prev) => ({
        ...prev,
        [message.id]: currentStep,
      }));
    }

    // FIXED: Only mark USER messages as shown immediately
    // Bot messages should NOT be marked as shown so they can animate
    if (isUser) {
      setShownMessageIds((prev) => new Set([...prev, message.id]));
    }
    // Bot messages will be marked as shown by TypewriterText after animation completes
  };

  const simulateTyping = (callback, delay = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const validateYesNo = (input) => {
    const normalized = input.toLowerCase().trim();
    if (normalized === "yes" || normalized === "y") {
      return { isValid: true, value: "YES", error: "" };
    } else if (normalized === "no" || normalized === "n") {
      return { isValid: true, value: "NO", error: "" };
    }
    return { isValid: false, error: "Please respond with YES or NO" };
  };

  const validateDate = (dateString) => {
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(datePattern);

    if (!match) {
      return { isValid: false, error: "Incorrect date format" };
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) {
      return { isValid: false, error: "Incorrect date format" };
    }

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (isLeapYear && month === 2) {
      daysInMonth[1] = 29;
    }

    if (day < 1 || day > daysInMonth[month - 1]) {
      return { isValid: false, error: "Incorrect date format" };
    }

    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return {
        isValid: false,
        error: "Please enter a future date for your wedding.",
      };
    }

    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    if (inputDate > twoYearsFromNow) {
      return {
        isValid: false,
        error: "Sorry, we don't do inquires beyond 2 years from today",
      };
    }

    return { isValid: true, error: "" };
  };

  const validateSeasonYear = (seasonYearString) => {
    const parts = seasonYearString.split(" ");
    if (parts.length !== 2) {
      return { isValid: false, error: "Please select both season and year" };
    }

    const [season, year] = parts;
    const seasons = ["FALL", "SPRING", "SUMMER", "WINTER"];

    if (!seasons.includes(season.toUpperCase())) {
      return {
        isValid: false,
        error: "Please choose from FALL, SPRING, SUMMER, or WINTER",
      };
    }

    const currentYear = new Date().getFullYear();
    const validYears = [currentYear, currentYear + 1, currentYear + 2];
    const yearNum = parseInt(year);

    if (!validYears.includes(yearNum)) {
      return {
        isValid: false,
        error: `Please enter a year between ${currentYear} and ${
          currentYear + 2
        }`,
      };
    }

    return { isValid: true, value: seasonYearString, error: "" };
  };

  const validateBudget = (budgetValue) => {
    const numericBudget = parseInt(budgetValue.replace(/[^0-9]/g, ""));

    if (isNaN(numericBudget)) {
      return { isValid: false, error: "Please enter a valid budget amount." };
    }

    if (numericBudget < 500) {
      return {
        isValid: false,
        error: "Sorry, we don't offer inquires below $500",
      };
    }

    // FIXED: Check for 1000 increments for florist and planner
    const isFloristOrPlanner =
      formData.creativeDomain.includes("florist") ||
      formData.creativeDomain.includes("planner");

    if (isFloristOrPlanner && numericBudget % 1000 !== 0) {
      return {
        isValid: false,
        error:
          "Please enter budget in increments of $1000 (e.g., $1000, $2000, $3000)",
      };
    }

    return { isValid: true, error: "" };
  };

  const validateGuestCount = (guestCountValue) => {
    const numericGuestCount = parseInt(guestCountValue.replace(/[^0-9]/g, ""));

    if (isNaN(numericGuestCount) || numericGuestCount <= 0) {
      return {
        isValid: false,
        error: "Please enter a valid number of guests.",
      };
    }

    return { isValid: true, error: "" };
  };

  const getNextStep = (step, value) => {
    if (step === "hasWeddingDate") {
      return value === "YES" ? "weddingDate" : "weddingSeasonYear";
    }

    if (step === "weddingDate" || step === "weddingSeasonYear") {
      return formData.creativeDomain.includes("planner")
        ? "planningType"
        : "budget";
    }

    return chatSteps[step]?.nextStep;
  };

  const handleSubmitInput = async (
    inputValue = currentInput,
    isEdit = false,
    editedMessageId = null
  ) => {
    if (!inputValue.trim() || inputTransitioning) return;

    const currentStepConfig = chatSteps[currentStep];

    if (!isEdit) {
      addMessage(inputValue, true);
      setInputContentVisible(false);

      setTimeout(() => {
        setInputVisible(false);
        setInputTransitioning(true);
      }, 100);
    }

    let validation = { isValid: true, error: "", value: inputValue };

    if (currentStep === "hasWeddingDate") {
      validation = validateYesNo(inputValue);
    } else if (currentStep === "weddingDate") {
      validation = validateDate(inputValue);
    } else if (currentStep === "weddingSeasonYear") {
      validation = validateSeasonYear(inputValue);
    } else if (currentStep === "budget") {
      validation = validateBudget(inputValue);
    } else if (currentStep === "planningType") {
      if (inputValue !== "Full Planning" && inputValue !== "Partial Planning") {
        validation = {
          isValid: false,
          error: "Please select a valid planning type.",
        };
      }
    } else if (currentStep === "guestCount") {
      validation = validateGuestCount(inputValue);
    } else if (currentStep === "serviceArea") {
      if (
        inputValue !== "Who typically serve California, please" &&
        inputValue !== "Nationwide"
      ) {
        validation = {
          isValid: false,
          error: "Please select a valid option.",
        };
      }
    }

    if (!validation.isValid) {
      if (!isEdit) {
        simulateTyping(() => {
          addMessage(validation.error);
          setTimeout(() => {
            setInputTransitioning(false);
            setInputVisible(true);
            setTimeout(() => {
              setInputContentVisible(true);
            }, 100);
          }, 500);
        }, 1000);
        setCurrentInput("");
      }
      return false;
    }

    setBudgetError("");
    setDateError("");

    const updatedFormData = { ...formData };
    const finalValue = validation.value || inputValue;

    if (currentStep === "location") {
      updatedFormData.location = finalValue;
    } else if (currentStep === "hasWeddingDate") {
      updatedFormData.hasWeddingDate = finalValue;
    } else if (currentStep === "weddingDate") {
      updatedFormData.weddingDate = finalValue;
    } else if (currentStep === "weddingSeasonYear") {
      updatedFormData.weddingSeasonYear = finalValue;
    } else if (currentStep === "planningType") {
      updatedFormData.planningType = finalValue;
    } else if (currentStep === "budget") {
      const numericBudget = parseInt(finalValue.replace(/[^0-9]/g, ""));
      updatedFormData.budget = `${numericBudget}`;
    } else if (currentStep === "guestCount") {
      updatedFormData.guestCount = finalValue;
    } else if (currentStep === "serviceArea") {
      updatedFormData.serviceArea = finalValue;
    } else if (currentStep === "additionalDetails") {
      updatedFormData.additionalDetails = finalValue;
    }

    setFormData(updatedFormData);

    if (!isEdit) {
      setCurrentInput("");
      setShowSuggestions(false);

      let nextStep = getNextStep(currentStep, finalValue);

      if (nextStep === "complete") {
        setCurrentStep("complete");
        sessionStorage.setItem("hasCompletedCreativeProcess", "true");
        simulateTyping(() => {
          addMessage(
            "Perfect! I have all the information I need. Let me find the best creatives for your wedding!"
          );
        });
        setTimeout(() => {
          router.push("/feed/couple");
        }, 2000);
      } else if (nextStep === "summaryConfirm") {
        setCurrentStep("summaryConfirm");

        simulateTyping(() => {
          addMessage(
            "We are all set, now please take a look at your summary before submitting. Can't wait to connect you with your aligned CC Creatives!",
            false
          );

          setTimeout(() => {
            // Add summary as a special message type with data
            const summaryData = generateSummaryData(updatedFormData);
            addMessage("", false, "summary", summaryData);

            setTimeout(() => {
              addMessage("All set to send?", false);

              setTimeout(() => {
                setInputTransitioning(false);
                setInputVisible(true);
                setTimeout(() => {
                  setInputContentVisible(true);
                }, 300);
              }, 1000);
            }, 500);
          }, 500);
        });
      } else {
        setCurrentStep(nextStep);

        simulateTyping(() => {
          let promptText;

          if (nextStep === "budget") {
            promptText = generateBudgetPrompt(
              formData.selectedService,
              formData.creativeDomain[0]
            );
          } else if (chatSteps[nextStep].prompt === "generatePrompt") {
            promptText = generatePrompt(
              formData.selectedService,
              formData.creativeDomain[0]
            );
          } else {
            promptText = chatSteps[nextStep].prompt;
          }

          addMessage(promptText);

          setTimeout(() => {
            setInputTransitioning(false);
            setInputVisible(true);

            setTimeout(() => {
              setInputContentVisible(true);
            }, 300);
          }, 1000);
        });
      }
    }

    return true;
  };

  const handleInputChange = (value) => {
    const currentStepConfig = chatSteps[currentStep];

    if (currentStepConfig?.inputType === "location") {
      handleLocationChange(value);
    } else if (currentStepConfig?.inputType === "budget") {
      const cleanValue = value.replace(/[^0-9]/g, "");
      const formattedValue = cleanValue ? `${cleanValue}` : "";
      setCurrentInput(formattedValue);
    } else if (currentStepConfig?.inputType === "number") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setCurrentInput(numericValue);
    } else {
      setCurrentInput(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        currentStep === "location" &&
        showSuggestions &&
        locationSuggestions.length > 0
      ) {
        handleLocationSelect(locationSuggestions[0]);
      } else {
        handleSubmitInput();
      }
    }
  };

  const handleMessageClick = (messageId, isUser) => {
    if (!isUser) return;

    if (showingEditId === messageId) {
      setShowingEditId(null);
    } else {
      setShowingEditId(messageId);
    }
  };

  const getStepForMessage = (messageId) => {
    // First try the tracked mapping
    if (messageStepMap[messageId]) {
      return messageStepMap[messageId];
    }

    // Fallback to content-based detection
    const message = messages.find((msg) => msg.id === messageId);
    if (!message || !message.isUser) return null;

    const messageText = message.text;

    if (
      messageText.includes("/") &&
      messageText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
    ) {
      return "weddingDate";
    } else if (
      messageText.includes("FALL") ||
      messageText.includes("SPRING") ||
      messageText.includes("SUMMER") ||
      messageText.includes("WINTER")
    ) {
      return "weddingSeasonYear";
    } else if (
      messageText === "Full Planning" ||
      messageText === "Partial Planning"
    ) {
      return "planningType";
    } else if (
      messageText.startsWith("$") ||
      /^\d+$/.test(messageText.replace(/[^0-9]/g, ""))
    ) {
      return "budget";
    } else if (/^\d+$/.test(messageText) && parseInt(messageText) > 10) {
      return "guestCount";
    } else if (messageText === "YES" || messageText === "NO") {
      return "hasWeddingDate";
    } else {
      return "location";
    }
  };

  const handleEditMessage = (messageId, currentText) => {
    const stepForMessage = getStepForMessage(messageId);
    if (!stepForMessage) return;

    setShowingEditId(null);
    setEditingMessageId(messageId);

    // Set editing value based on step type
    if (stepForMessage === "budget") {
      // Remove $ from budget for editing
      const cleanValue = currentText.replace(/[^0-9]/g, "");
      setEditingValue(cleanValue);
    } else {
      setEditingValue(currentText);
    }

    // Handle specific step setup
    if (stepForMessage === "location") {
      setShowEditSuggestions(true);
      handleLocationChange(currentText, true);
    }

    if (stepForMessage === "weddingDate") {
      // Parse the date and set it for calendar
      const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = currentText.match(datePattern);
      if (match) {
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        setEditSelectedDate(new Date(year, month - 1, day));
      }
      // Show calendar immediately when editing date
      setShowCalendar(true);
    }
  };

  const handleSaveEdit = async (messageId, valueOverride = null) => {
    const valueToSave = valueOverride || editingValue.trim();
    if (!valueToSave) return;

    const messageToEdit = messages.find((msg) => msg.id === messageId);
    if (!messageToEdit || !messageToEdit.isUser) return;

    const stepForMessage = getStepForMessage(messageId);
    if (!stepForMessage) return;

    // Check if this is a value change that affects flow
    const isFlowChangingEdit = messageToEdit.text !== valueToSave;

    // NEW: Force location format validation for edits
    if (stepForMessage === "location") {
      // Check if it's a proper "City, State" format
      const locationPattern = /^[^,]+,\s*[A-Z]{2}$/;
      if (!locationPattern.test(valueToSave)) {
        // Show error and don't allow save
        simulateTyping(() => {
          addMessage("Please select a location from the dropdown suggestions.");
        }, 1000);
        return false;
      }
    }

    // Format the value based on step type
    let formattedValue = valueToSave;

    if (stepForMessage === "budget") {
      const numericValue = parseInt(valueToSave.replace(/[^0-9]/g, ""));
      if (!isNaN(numericValue)) {
        formattedValue = `${numericValue}`;
      }
    }

    // Validate the edit using the step's validation
    let validation = { isValid: true, error: "", value: formattedValue };
    if (stepForMessage === "hasWeddingDate") {
      validation = validateYesNo(formattedValue);
    } else if (stepForMessage === "weddingDate") {
      validation = validateDate(formattedValue);
    } else if (stepForMessage === "weddingSeasonYear") {
      validation = validateSeasonYear(formattedValue);
    } else if (stepForMessage === "planningType") {
      // Planning type validation
      if (
        !formattedValue ||
        (formattedValue !== "Full Planning" &&
          formattedValue !== "Partial Planning")
      ) {
        validation = {
          isValid: false,
          error: "Please select a valid planning type.",
        };
      }
    } else if (stepForMessage === "budget") {
      validation = validateBudget(formattedValue);
    } else if (stepForMessage === "guestCount") {
      validation = validateGuestCount(formattedValue);
    }

    if (!validation.isValid) {
      // Show error but don't close edit mode
      simulateTyping(() => {
        addMessage(validation.error);
      }, 1000);
      return false;
    }

    const finalValue = validation.value || formattedValue;

    // NEW: Handle flow recalculation for conditional steps
    if (isFlowChangingEdit && stepForMessage === "hasWeddingDate") {
      const oldValue = messageToEdit.text;
      const newValue = finalValue;

      // If changing from YES to NO or NO to YES, recalculate the flow
      if (oldValue !== newValue) {
        // Find the index of the edited message
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);

        // Remove all messages after this one (both user and bot messages)
        const messagesToKeep = messages.slice(0, messageIndex + 1);

        // Update the edited message
        const updatedMessages = messagesToKeep.map((msg) =>
          msg.id === messageId ? { ...msg, text: finalValue } : msg
        );

        setMessages(updatedMessages);

        // Update form data and clear subsequent fields
        const updatedFormData = { ...formData };
        updatedFormData.hasWeddingDate = finalValue;

        // Clear fields that come after this decision
        if (finalValue === "YES") {
          updatedFormData.weddingSeasonYear = "";
        } else {
          updatedFormData.weddingDate = "";
        }

        // Clear all subsequent fields regardless
        if (!formData.creativeDomain.includes("planner")) {
          updatedFormData.planningType = "";
        }
        updatedFormData.budget = "";
        updatedFormData.guestCount = "";

        setFormData(updatedFormData);

        // Set the current step to the next appropriate step
        const nextStep = getNextStep(stepForMessage, finalValue);
        setCurrentStep(nextStep);

        // Clean up edit state
        setEditingMessageId(null);
        setEditingValue("");
        setShowEditSuggestions(false);
        setEditLocationSuggestions([]);

        // Add the next question after a delay
        setTimeout(() => {
          simulateTyping(() => {
            addMessage(chatSteps[nextStep].prompt);

            // Show input for the next step
            setTimeout(() => {
              setInputVisible(true);
              setInputContentVisible(true);
            }, 1000);
          });
        }, 500);

        return true;
      }
    }

    // Regular edit without flow change
    // Update the message text
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: finalValue } : msg
      )
    );

    // Update form data
    const updatedFormData = { ...formData };

    if (stepForMessage === "location") {
      updatedFormData.location = finalValue;
    } else if (stepForMessage === "hasWeddingDate") {
      updatedFormData.hasWeddingDate = finalValue;
    } else if (stepForMessage === "weddingDate") {
      updatedFormData.weddingDate = finalValue;
    } else if (stepForMessage === "weddingSeasonYear") {
      updatedFormData.weddingSeasonYear = finalValue;
    } else if (stepForMessage === "planningType") {
      updatedFormData.planningType = finalValue;
    } else if (stepForMessage === "budget") {
      updatedFormData.budget = finalValue;
    } else if (stepForMessage === "guestCount") {
      updatedFormData.guestCount = finalValue;
    }

    setFormData(updatedFormData);

    // Clean up edit state
    setEditingMessageId(null);
    setEditingValue("");
    setShowEditSuggestions(false);
    setEditLocationSuggestions([]);

    return true;
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingValue("");
    setShowEditSuggestions(false);
    setEditLocationSuggestions([]);
  };

  const EditableSummaryField = ({ label, value, onEdit, fieldKey }) => {
    const isEditing = editingSummaryField === fieldKey;

    return (
      <div className="flex items-center justify-start gap-4 py-2">
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={summaryEditValue}
                onChange={(e) => setSummaryEditValue(e.target.value)}
                className="text-sm border border-gray-300 rounded-4xl px-2 py-1"
                autoFocus
              />
              <button
                onClick={handleSaveSummaryEdit}
                className="px-2 py-1 bg-black text-white text-xs rounded-4xl"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingSummaryField(null);
                  setSummaryEditValue("");
                }}
                className="px-2 py-1 bg-gray-300 text-xs rounded-4xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-800 border border-gray-800 rounded-full px-3 py-1">
                {value}
              </span>
              <button
                onClick={() => onEdit(fieldKey, value)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Edit3 size={14} className="text-gray-900" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const generateSummaryData = (data) => {
    const getServiceAreaLabel = () => {
      if (data.serviceArea === "Who typically serve California, please") {
        return "California";
      }
      return data.serviceArea;
    };

    // FIXED: Parse the sessionStorage data properly
    let proposalCount = 5; // Default fallback
    try {
      // Try to get from findCreativeSelectionForChat first (set after payment)
      const selectionData = sessionStorage.getItem(
        "findCreativeSelectionForChat"
      );
      if (selectionData) {
        const parsedData = JSON.parse(selectionData);
        proposalCount = parsedData.proposalCount || 5;
      } else {
        // Fallback to findCreativeFormData if selection data not found
        const storedFormData = sessionStorage.getItem("findCreativeFormData");
        if (storedFormData) {
          const parsedData = JSON.parse(storedFormData);
          proposalCount = parsedData.proposalCount || 5;
        }
      }
    } catch (error) {
      console.error("Error parsing proposal count:", error);
    }

    const formatType = () => {
      if (data.planningType) {
        return data.planningType;
      }
      return (
        data.selectedService.charAt(0).toUpperCase() +
        data.selectedService.slice(1)
      );
    };

    return {
      creativeDomain:
        data.creativeDomain[0].charAt(0).toUpperCase() +
        data.creativeDomain[0].slice(1),
      location: data.location,
      date: data.weddingDate || data.weddingSeasonYear,
      type: "Wedding",
      budget: `$${data.budget}`,
      guests: data.guestCount,
      searchArea: getServiceAreaLabel(),
      proposalCount: proposalCount,
      additionalDetails: data.additionalDetails || "None provided",
    };
  };

  const handleEditSummaryField = (fieldKey, currentValue) => {
    setEditingSummaryField(fieldKey);
    // Remove $ from budget if editing budget
    const cleanValue =
      fieldKey === "budget" ? currentValue.replace("$", "") : currentValue;
    setSummaryEditValue(cleanValue);
  };

  const handleSaveSummaryEdit = () => {
    if (!editingSummaryField || !summaryEditValue.trim()) return;

    const updatedFormData = { ...formData };

    switch (editingSummaryField) {
      case "location":
        updatedFormData.location = summaryEditValue;
        break;
      case "date":
        if (formData.weddingDate) {
          updatedFormData.weddingDate = summaryEditValue;
        } else {
          updatedFormData.weddingSeasonYear = summaryEditValue;
        }
        break;
      case "budget":
        updatedFormData.budget = summaryEditValue;
        break;
      case "guests":
        updatedFormData.guestCount = summaryEditValue;
        break;
    }

    setFormData(updatedFormData);

    // Update the summary message in the messages array
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "summary"
          ? { ...msg, data: generateSummaryData(updatedFormData) }
          : msg
      )
    );

    setEditingSummaryField(null);
    setSummaryEditValue("");
  };

  const renderEditInput = (messageId, step) => {
    const inputType = chatSteps[step]?.inputType || "text";

    if (inputType === "location") {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={editingValue}
            style={{ height: "20px", minHeight: "20px" }} // Fixed height
            onChange={(e) => handleLocationChange(e.target.value, true)}
            className="w-full min-w-[120px] bg-transparent border-none outline-none text-sm resize-none"
            autoFocus
            placeholder="Los Angeles, CA"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (showEditSuggestions && editLocationSuggestions.length > 0) {
                  handleLocationSelect(
                    editLocationSuggestions[0],
                    true,
                    messageId
                  );
                } else {
                  handleSaveEdit(messageId);
                }
              }
            }}
          />
          {showEditSuggestions && editLocationSuggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
              {isLoadingEditLocations ? (
                <div className="px-3 py-2 text-center text-xs text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : (
                editLocationSuggestions.map((location, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleLocationSelect(location, true, messageId)
                    }
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-700 border-b border-gray-100 last:border-b-0"
                  >
                    {location}
                  </button>
                ))
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSaveEdit(messageId)}
              className="px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else if (inputType === "budget") {
      return (
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-1">$</span>
            <input
              type="text"
              value={editingValue}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/[^0-9]/g, "");
                setEditingValue(cleanValue);
              }}
              className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm resize-none"
              autoFocus
              placeholder="8000"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveEdit(messageId);
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSaveEdit(messageId)}
              className="px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else if (inputType === "planningTypeDropdown") {
      return (
        <div className="space-y-2">
          <PlanningTypeDropdown
            value={editingValue}
            onChange={(selected) => {
              setEditingValue(selected);
              handleSaveEdit(messageId, selected);
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else if (inputType === "serviceAreaDropdown") {
      return (
        <div className="space-y-2">
          <ServiceAreaDropdown
            value={editingValue}
            onChange={(selected) => {
              setEditingValue(selected);
              handleSaveEdit(messageId, selected);
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else if (inputType === "calendar") {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={editingValue}
            disabled={true}
            className="w-full min-w-[120px] bg-transparent border-none outline-none text-sm resize-none"
            autoFocus
            placeholder="MM/DD/YYYY"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEdit(messageId);
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCalendar(true)}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
            >
              Select Date from Calendar
            </button>
          </div>
        </div>
      );
    } else if (inputType === "seasonYear") {
      return (
        <div className="space-y-2">
          <CombinedSeasonYearDropdown
            value={editingValue}
            onChange={(combined) => {
              // FIXED: Update the editing value immediately when selections change
              setEditingValue(combined);
            }}
            isEditMode={true}
            onCancel={handleCancelEdit}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSaveEdit(messageId)}
              disabled={!editingValue || !editingValue.includes(" ")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                editingValue && editingValue.includes(" ")
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Send
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else if (inputType === "yesno") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveEdit(messageId, "YES")}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              YES
            </button>
            <button
              onClick={() => handleSaveEdit(messageId, "NO")}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              NO
            </button>
          </div>
        </div>
      );
    } else if (inputType === "number") {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={editingValue}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^0-9]/g, "");
              setEditingValue(numericValue);
            }}
            className="w-full min-w-[120px] bg-transparent border-none outline-none text-sm resize-none"
            autoFocus
            placeholder="150"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEdit(messageId);
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSaveEdit(messageId)}
              className="px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="w-full min-w-[120px] bg-transparent border-none outline-none text-sm resize-none"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEdit(messageId);
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSaveEdit(messageId)}
              className="px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
  };

  const renderCurrentStepInput = () => {
    const currentStepConfig = chatSteps[currentStep];
    const inputType = currentStepConfig?.inputType;

    // Hide content during transitions
    if (!inputContentVisible) {
      return (
        <div
          className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl"
          style={{ minHeight: "48px" }}
        >
          {/* Empty placeholder during transition */}
        </div>
      );
    }

    if (inputType === "calendar") {
      return (
        <button
          onClick={() => !inputTransitioning && setShowCalendar(true)}
          disabled={inputTransitioning}
          className={`flex-1 px-4 py-3 pr-12 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm text-left transition-all duration-200 input-transition ${
            inputTransitioning
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          style={{ fontSize: "16px", minHeight: "48px" }}
        >
          <span className={currentInput ? "text-gray-800" : "text-gray-500"}>
            {currentInput || "Select wedding date"}
          </span>
        </button>
      );
    } else if (inputType === "seasonYear") {
      return (
        <div
          className={`w-full bg-slate-100 rounded-2xl flex justify-start p-2 input-transition ${
            inputTransitioning ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <CombinedSeasonYearDropdown
            value={currentInput}
            onChange={(combined) => {
              if (!inputTransitioning) {
                setCurrentInput(combined);
                handleSubmitInput(combined);
              }
            }}
            disabled={inputTransitioning}
          />
        </div>
      );
    } else if (inputType === "yesno") {
      return (
        <div className="flex-1 flex gap-3 input-transition">
          <button
            onClick={() => !inputTransitioning && handleSubmitInput("YES")}
            disabled={inputTransitioning}
            className={`flex-1 px-4 py-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm text-center transition-all duration-200 ${
              inputTransitioning
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-200 active:bg-gray-300"
            }`}
            style={{ fontSize: "16px", minHeight: "48px" }}
          >
            YES
          </button>
          <button
            onClick={() => !inputTransitioning && handleSubmitInput("NO")}
            disabled={inputTransitioning}
            className={`flex-1 px-4 py-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm text-center transition-all duration-200 ${
              inputTransitioning
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-200 active:bg-gray-300"
            }`}
            style={{ fontSize: "16px", minHeight: "48px" }}
          >
            NO
          </button>
        </div>
      );
    } else if (inputType === "planningTypeDropdown") {
      return (
        <div
          className={`w-full bg-slate-50 rounded-2xl flex justify-start p-2 input-transition ${
            inputTransitioning ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <PlanningTypeDropdown
            value={currentInput}
            onChange={(selected) => {
              if (!inputTransitioning) {
                setCurrentInput(selected);
                handleSubmitInput(selected);
              }
            }}
            disabled={inputTransitioning}
          />
        </div>
      );
    } else if (inputType === "serviceAreaDropdown") {
      return (
        <div
          className={`w-full bg-slate-100 rounded-2xl flex justify-start p-2 input-transition ${
            inputTransitioning ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <ServiceAreaDropdown
            value={currentInput}
            onChange={(selected) => {
              if (!inputTransitioning) {
                setCurrentInput(selected);
                handleSubmitInput(selected);
              }
            }}
          />
        </div>
      );
    } else {
      // Text, location, budget, and number inputs
      return (
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) =>
            !inputTransitioning && handleInputChange(e.target.value)
          }
          onKeyPress={(e) => !inputTransitioning && handleKeyPress(e)}
          onFocus={() => {
            if (
              !inputTransitioning &&
              currentStep === "location" &&
              currentInput.trim().length > 0
            ) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            if (currentStep === "location") {
              setTimeout(() => setShowSuggestions(false), 200);
            }
          }}
          placeholder={currentStepConfig?.placeholder || "Type your message..."}
          className={`flex-1 px-4 py-3 pr-12 bg-gray-100 rounded-2xl 
        focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 text-sm border-0 
        resize-none input-transition transition-all duration-200 ${
          inputTransitioning
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-200"
        }`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={isTyping || inputTransitioning}
          inputMode={
            currentStepConfig?.inputType === "number" ? "numeric" : "text"
          }
          style={{ fontSize: "16px", minHeight: "48px" }}
        />
      );
    }
  };

  if (!hasInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const TypewriterText = React.memo(
    ({ text, shouldAnimate, messageId }) => {
      const [hasAnimated, setHasAnimated] = useState(false);
      const words = text.split(" ");

      // Once animation starts, mark it as done
      useEffect(() => {
        if (shouldAnimate && !hasAnimated) {
          const timer = setTimeout(() => {
            setHasAnimated(true);
            setShownMessageIds((prev) => new Set([...prev, messageId]));
          }, words.length * 70); // Duration of animation
          return () => clearTimeout(timer);
        }
      }, [shouldAnimate, hasAnimated, messageId, words.length]);

      // Don't animate if already animated or shouldn't animate
      if (!shouldAnimate || hasAnimated) {
        return <span className="text-sm leading-relaxed">{text}</span>;
      }

      return (
        <span
          className="text-sm leading-relaxed"
          style={{ whiteSpace: "normal" }}
        >
          {words.map((word, index) => (
            <React.Fragment key={`${word}-${index}`}>
              <span
                className="typing-animation-word"
                style={{
                  animationDelay: `${index * 0.07}s`,
                  animationFillMode: "forwards",
                }}
              >
                {word}
              </span>
              {index < words.length - 1 && " "}
            </React.Fragment>
          ))}
        </span>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if text or shouldAnimate changes
      return (
        prevProps.text === nextProps.text &&
        prevProps.shouldAnimate === nextProps.shouldAnimate &&
        prevProps.messageId === nextProps.messageId
      );
    }
  );

  const currentStepConfig = chatSteps[currentStep];

  return (
    <>
      {/* Add required CSS animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        :root {
          --vh: 1vh;
        }
        .supports-vh {
          height: calc(var(--vh, 1vh) * 100);
        }
        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .typing-animation {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 1.5s steps(60, end) forwards;
        }

        .typing-animation-word {
          display: inline-block;
          overflow: hidden;
          animation: fadeIn 0.05s ease-in forwards;
          opacity: 0;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Calendar Modal */}
      {showCalendar && (
        <CustomCalendar
          selectedDate={editingMessageId ? editSelectedDate : selectedDate}
          onDateSelect={(date) => {
            if (editingMessageId) {
              handleCalendarDateSelect(date, true, editingMessageId);
            } else {
              handleCalendarDateSelect(date);
            }
          }}
          onClose={() => {
            setShowCalendar(false);
            // If we're in edit mode and calendar is closed, cancel the edit
            if (editingMessageId) {
              handleCancelEdit();
            }
          }}
        />
      )}

      {/* Main Chat Container */}
      <div
        className="fixed inset-0 bg-white flex flex-col overflow-hidden supports-vh"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          touchAction: "pan-y",
          height: `calc(var(--vh, 1vh) * 100)`,
          marginTop: "60px",
          paddingBottom: "20px",
        }}
      >
        {/* Chat Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 flex flex-col min-h-0 relative bg-white"
          style={{ touchAction: "pan-y" }}
        >
          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 bg-white"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              overscrollBehavior: "contain",
              minHeight: 0,
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`group flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div className="relative max-w-[85%]">
                  <div
                    className={`px-4 py-3 rounded-2xl break-words ${
                      message.isUser
                        ? "bg-gray-100 text-gray-800 rounded-br-sm cursor-pointer hover:bg-gray-150"
                        : message.type === "summary"
                        ? "bg-white text-gray-800 rounded-bl-sm"
                        : "bg-white text-gray-800 rounded-bl-sm"
                    }`}
                    style={{
                      minHeight: message.type === "summary" ? "auto" : "48px",
                      minWidth: "60px",
                      maxWidth: "100%", // ADD THIS
                      wordBreak: "break-word", // ADD THIS
                      overflowWrap: "break-word", // ADD THIS
                      display: "flex",
                      alignItems:
                        message.type === "summary" ? "stretch" : "center",
                    }}
                  >
                    {editingMessageId === message.id ? (
                      renderEditInput(message.id, getStepForMessage(message.id))
                    ) : message.type === "summary" ? (
                      // Render summary with edit icons
                      <div className="w-full space-y-1">
                        <EditableSummaryField
                          label="CC"
                          value={message.data.creativeDomain}
                          onEdit={handleEditSummaryField}
                          fieldKey="creativeDomain"
                        />
                        <EditableSummaryField
                          label="Location"
                          value={message.data.location}
                          onEdit={handleEditSummaryField}
                          fieldKey="location"
                        />
                        <EditableSummaryField
                          label="Date"
                          value={message.data.date}
                          onEdit={handleEditSummaryField}
                          fieldKey="date"
                        />
                        <EditableSummaryField
                          label="Type"
                          value={message.data.type}
                          onEdit={handleEditSummaryField}
                          fieldKey="type"
                        />
                        <EditableSummaryField
                          label="Budget"
                          value={message.data.budget}
                          onEdit={handleEditSummaryField}
                          fieldKey="budget"
                        />
                        <EditableSummaryField
                          label="Guests"
                          value={message.data.guests}
                          onEdit={handleEditSummaryField}
                          fieldKey="guests"
                        />
                        <EditableSummaryField
                          label="Search Area"
                          value={message.data.searchArea}
                          onEdit={handleEditSummaryField}
                          fieldKey="searchArea"
                        />
                        <div className="py-2 ">
                          <span className="text-sm font-medium text-gray-600">
                            Proposals you will receive:
                          </span>
                          <span className="text-sm text-gray-800 ml-2">
                            {message.data.proposalCount}
                          </span>
                        </div>
                        {message.data.additionalDetails !== "None provided" && (
                          <div className="py-2">
                            <span className="text-sm font-medium text-gray-600">
                              Details:
                            </span>
                            <div className="flex items-start gap-2 mt-1">
                              {" "}
                              {/* Changed to items-start */}
                              <p className="text-sm text-gray-800 flex-1 break-words whitespace-normal">
                                {" "}
                                {/* Added flex-1, break-words, whitespace-normal */}
                                {message.data.additionalDetails}
                              </p>
                              <button
                                onClick={() =>
                                  handleEditSummaryField(
                                    "additionalDetails",
                                    message.data.additionalDetails
                                  )
                                }
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" // Added flex-shrink-0
                              >
                                <Edit3 size={14} className="text-gray-900" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {message.isUser && (
                          <p className="text-sm leading-relaxed">
                            {message.text}
                          </p>
                        )}

                        {!message.isUser && (
                          <TypewriterText
                            text={message.text}
                            messageId={message.id}
                            shouldAnimate={!shownMessageIds.has(message.id)}
                            onAnimationComplete={(id) => {
                              setShownMessageIds(
                                (prev) => new Set([...prev, id])
                              );
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Edit button for user messages */}
                  {message.isUser &&
                    editingMessageId !== message.id &&
                    showingEditId === message.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMessage(message.id, message.text);
                        }}
                        className="absolute -bottom-8 right-0 transition-opacity duration-200 p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border border-gray-200"
                        title="Edit message"
                      >
                        <Edit3 size={14} className="text-gray-500" />
                      </button>
                    )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Location Suggestions - Regular Input */}
          {showSuggestions &&
            currentStep === "location" &&
            !editingMessageId &&
            locationSuggestions.length > 0 && (
              <div className="px-4 pb-6 mb-4 flex-shrink-0 bg-white">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  {isLoadingLocations ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400"></div>
                        <span>Searching locations...</span>
                      </div>
                    </div>
                  ) : (
                    locationSuggestions.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        onTouchStart={() => {}}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50  active:bg-gray-100 border-b border-gray-100 last:border-b-0   text-sm text-gray-700 transition-colors"
                      >
                        {location}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
        </div>

        <div
          className={`flex-shrink-0 bg-white  transition-all duration-500 ease-in-out ${
            inputVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            transform: inputVisible ? "translateY(0)" : "translateY(100%)",
          }}
        >
          <div className="px-4 py-3">
            <div className="relative flex items-end gap-2">
              {renderCurrentStepInput()}

              {/* Send Button - Show only for text inputs and when there's content */}
              {currentStepConfig?.inputType !== "calendar" &&
                currentStepConfig?.inputType !== "seasonYear" &&
                currentStepConfig?.inputType !== "yesno" &&
                currentStepConfig?.inputType !== "serviceAreaDropdown" &&
                currentStepConfig?.inputType !== "planningTypeDropdown" && (
                  <button
                    onClick={() => handleSubmitInput()}
                    onTouchStart={() => {}}
                    disabled={
                      !currentInput.trim() || isTyping || inputTransitioning
                    }
                    className={`p-3 rounded-full transition-all transform absolute right-2 duration-200 flex-shrink-0 ${
                      currentInput.trim() && !isTyping && !inputTransitioning
                        ? "text-black hover:text-gray-800 active:scale-95 hover:bg-gray-100"
                        : "text-gray-400"
                    }`}
                    style={{ minWidth: "48px", minHeight: "48px" }}
                  >
                    <Send size={18} style={{ transform: "rotate(45deg)" }} />
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FindCreativeChatPage;
