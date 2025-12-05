"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import useHelpCenterStore from "../../../hooks/useHelpCenter";
import { usePathname } from "next/navigation";
import Image from "next/image";

const HelpCenter = () => {
  const pathname = usePathname();
  const { isOpen, activeTab, closeHelpCenter } = useHelpCenterStore();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if we're on login/auth pages
  const isAuthPage =
    pathname?.includes("/login") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/waiting");

  // Check if we're on the new-user page
  const isNewUserPage = pathname?.includes("/login/new-user");

  // Handle animation when opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Sync with store's activeTab
  useEffect(() => {
    if (isOpen) {
      setCurrentTab(activeTab);
    }
  }, [isOpen, activeTab]);

  // Define all tabs
  const allTabs = [
    { id: "faq", label: "FAQ" },
    { id: "guidelines", label: "Community guidelines" },
    { id: "terms", label: "Terms" },
    { id: "privacy", label: "Privacy" },
  ];

  // Filter tabs based on page
  const tabs = isNewUserPage
    ? allTabs // Show all tabs on new-user page
    : isAuthPage
      ? allTabs.filter((tab) => tab.id === "terms" || tab.id === "privacy")
      : allTabs;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      closeHelpCenter();
    }, 300); // Match the animation duration
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${isAnimating && isOpen ? "bg-black/50" : "bg-black/0"
        }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white w-full h-full rounded-none flex flex-col overflow-hidden transition-transform duration-300 ease-out ${isAnimating && isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (top-right corner) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-4 h-4"
        >
          <Image
            src="/close_icon.svg"
            alt="Close"
            width={16}
            height={16}
            className="cursor-pointer hover:opacity-80 transition"
          />
        </button>

        {/* Header with Tabs */}
        <div className="border-b border-gray-200 bg-white z-10 mt-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <nav className="flex gap-4 [@media(min-width:380px)]:gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`pb-3 text-[9px] [@media(min-width:355px)]:text-xs font-medium transition-colors ${currentTab === tab.id
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {currentTab === "faq" && <FAQContent />}
            {currentTab === "guidelines" && <GuidelinesContent />}
            {currentTab === "terms" && <TermsContent />}
            {currentTab === "privacy" && <PrivacyContent />}
          </div>
        </div>
      </div>
    </div>
  );


};

// Keep all your existing content components exactly as they are
const FAQContent = () => {
  const [openItem, setOpenItem] = useState(null);

  const faqItems = [
    {
      question: "What is CUNO COVO?",
      answer:
        "CUNO COVO is a wedding focused app where Creatives share perspectives and connect — and in the near future, it will also support Couples in aligning with Creatives.",
    },
    {
      question: "Who is CUNO COVO for?",
      answer:
        "1) Photographers, Videographers, Florists, and Planners in the wedding industry.\n2) Couples seeking Creatives for one or more of the following: a wedding, a wedding weekend, an elopement, or an engagement.",
    },
    {
      question:
        "Why only Photographers, Videographers, Florists, and Planners?",
      answer:
        "We believe these four Creatives are key players in shaping how the wedding day looks, feels, and is remembered. While every Creative plays an important role, these are often the ones Couples rely on most to set the tone and preserve their memories. Connecting and aligning with these Creatives is essential, and CUNO COVO provides that opportunity for every Couple.\n\nWe intentionally work with individual Creatives or specialist teams to keep the process personal, and as we grow, we may add more Creatives in the future.",
    },
    {
      question: "What is CC anonymous?",
      answer:
        "Creatives to Creatives: Make a post with intention. Say what you believe needs to be said. Anonymous.\n\nNot for self-promotion, personal attacks, or harmful behavior. See Community Guidelines for details.",
    },
    {
      question: "How anonymous is it?",
      answer:
        "Everything is encrypted, and even the app's admins cannot link your activity with your personal identity. At the same time, we have measures in place to keep the app secure. See Community Guidelines for more details.",
    },
    {
      question: "How does CC Anonymous work?",
      answer:
        "The New Post section shows unpublished content for Creatives to decide if a post should be published. Each post needs 10 likes within 48 hours to be published. If it doesn't reach 10 likes, it's deleted. See below for when a post is published.",
    },
    {
      question: "How do chatrooms work?",
      answer:
        "Once a post is published, users can open a chatroom to discuss it. Chatrooms remain active for 48 hours. After that, no new chatrooms can be created for that post.",
    },
    {
      question: "Can posts be shared?",
      answer:
        "Yes. Published posts are public and can be shared outside CC. You can also quote them to spark new conversations.",
    },
    {
      question: "How do referrals work?",
      answer:
        "Creatives can find their referral code in their profile. By sharing this code with other wedding Photographers, Videographers, Florists, and Planners, they will earn a 0.5 point increase for each Creative who signs up using their code, for up to 8 Creatives. For example: 1st referral = 1.5 points, 2nd referral = 2 points, 3rd referral = 2.5 points, and so on.",
    },
    {
      question: "What are points used for?",
      answer:
        "Point usage will be introduced in the Version 2 rollout for Creatives. Stay tuned for the ways you can use your points!",
    },
  ];

  return (
    <div>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openItem === index}
            onToggle={() => setOpenItem(openItem === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 pb-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left py-2"
    >
      <h3 className="font-semibold text-base">{question}</h3>
      <ChevronDown
        className={`w-5 h-5 transition-transform flex-shrink-0 ml-4 ${isOpen ? "transform rotate-180" : ""
          }`}
      />
    </button>
    {isOpen && (
      <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
        {answer}
      </div>
    )}
  </div>
);

const GuidelinesContent = () => (
  <div className="space-y-6 text-sm">
    <p className="text-gray-500">Effective Date: August 1, 2025</p>

    <div>
      <p className="mb-4">
        At CUNO COVO, we're excited to provide a platform where you can connect,
        shape the space, and directly access opportunities to grow your
        business. This is a space for Creatives to share perspectives, build
        meaningful connections, and thrive — and in the near future, for Couples
        to align with Creatives in new ways.
      </p>
      <p>
        To keep this community safe and supportive, we ask all users to follow a
        few key guidelines. By using CUNO COVO, you agree to respect these rules
        and understand that violations may result in actions taken on your
        account at our discretion.
      </p>
    </div>

    <section>
      <h2 className="font-semibold text-base mb-3">Respect and Kindness</h2>
      <p className="mb-3">
        We believe kindness and respect are the foundation of every interaction.
        You may not use CUNO COVO to harass, bully, or threaten another person,
        and hateful or discriminatory language directed at any individual or
        group will not be tolerated. This includes discrimination based on
        disability, gender, sexuality, race, religion, or any other personal
        identity. Posts encouraging violence or harm in any form are strictly
        prohibited.
      </p>
      <p>
        If you violate these rules, your post may be removed, and your account
        may be limited, suspended, or permanently banned, depending on the
        severity of the behavior.
      </p>
    </section>

    <section>
      <h2 className="font-semibold text-base mb-3">
        Be Thoughtful and Productive
      </h2>
      <p className="mb-3">
        CUNO COVO is designed to help you connect directly with Creatives in an
        efficient and meaningful way. Please be respectful of a creative's time
        by following the prompts and sharing clear, thoughtful requests.
      </p>
      <p>
        Spam, fake inquiries, or posts that waste time or disrupt the experience
        go against the purpose of our platform and will be removed. Repeated or
        severe abuse of this rule may result in account restrictions or removal.
      </p>
    </section>

    <section>
      <h2 className="font-semibold text-base mb-3">Honesty and Authenticity</h2>
      <p className="mb-3">
        We value honesty and authenticity in all interactions. You may not
        impersonate others, create fake accounts, or post false or misleading
        information. Coordinated efforts to manipulate votes, engagement, or app
        features—including brigading posts —are not permitted. Automated tools,
        bots, or scripts that flood the platform or attempt to manipulate
        activity are strictly prohibited.
      </p>
      <p>
        Any content that breaks these rules may be deleted, and accounts
        engaging in such activity may be limited or permanently removed from the
        platform.
      </p>
    </section>

    <section>
      <h2 className="font-semibold text-base mb-3">
        Illegal or Harmful Activity
      </h2>
      <p className="mb-3">
        Our platform does not allow illegal activity or harmful behavior. You
        may not use CUNO COVO to promote scams, fraud, or unlawful practices.
        Sharing private or sensitive information about others is not allowed,
        and any attempt to damage or disrupt our app, systems, or referral
        programs is strictly forbidden.
      </p>
      <p>
        Violating this rule may result in immediate suspension or removal of
        your account and, where appropriate, may be reported to authorities.
      </p>
    </section>

    <section>
      <h2 className="font-semibold text-base mb-3">The Anonymous Section</h2>
      <p className="mb-4">
        The Anonymous Section is here to give Creatives a safe, open space to
        share thoughts, explore ideas, and reflect on experiences. It's designed
        for honest, meaningful conversations—but not for harmful or destructive
        behavior.
      </p>
      <p className="mb-4">
        We encourage Creatives to share their perspectives, ask questions, spark
        curiosity, engage in collaborative efforts, and have open dialogue. They
        may also raise concerns about unethical practices or scams, but these
        posts must be factual, respectful, and free from speculation or
        emotional attacks.
      </p>
      <p className="mb-4">
        The Anonymous Section is not for self-promotion. You may not use this
        space to advertise your services, solicit work, or share links to your
        own business or profiles. It is also not acceptable for honest
        discussions and thoughtful contributions to the community.
      </p>
      <p className="mb-4">
        You may not use the Anonymous Section to target individuals or
        businesses with personal attacks. No name-slandering is allowed. Posts
        meant to cause harm, spread hate, or create conflict will be removed.
        Sharing someone's private details—such as their home address, contact
        information, or financial records—is strictly prohibited.
      </p>
      <p>
        If you misuse the Anonymous Section, we may remove your posts, restrict
        your ability to post, or suspend your account entirely, depending on the
        severity and frequency of the violations.
      </p>
    </section>

    <section>
      <h2 className="font-semibold text-base mb-3">Moderation and Reporting</h2>
      <p className="mb-3">
        We're committed to keeping CUNO COVO a space that's honest,
        constructive, and safe for everyone. If you come across a post that
        feels harmful or violates these guidelines, you can report it for our
        team to review.
      </p>
      <p className="mb-3">
        While we value free expression, users who share harmful, misleading, or
        abusive content will have their accounts restricted or permanently
        removed.
      </p>
      <p>
        All actions taken on accounts or posts are at the sole discretion of
        CUNO COVO's team.
      </p>
    </section>

    <p className="mt-6">
      If you have questions about these guidelines, you can contact us anytime
      at{" "}
      <a href="mailto:info@cunocovo.com" className="underline">
        info@cunocovo.com
      </a>
    </p>
  </div>
);

const TermsContent = () => (
  <div className="space-y-6 text-sm">
    <p className="text-gray-500">Effective Date: August 1, 2025</p>

    <div>
      <p className="mb-4">
        At CUNO COVO, we're excited to provide a platform where you can connect,
        shape the space, and directly access opportunities to grow your
        business. By using our app, you agree to these Terms and Conditions and
        our Privacy Policy, which outline how you can use CUNO COVO and what we
        expect from you as part of our community.
      </p>
    </div>

    <section>
      <p>
        CUNO COVO is designed for users in the United States. You must be at
        least 13 years old to create an account and use our services. When you
        register, you agree that all information you provide is accurate and
        that you will keep it updated.
      </p>
    </section>

    <section>
      <p className="mb-3">
        When you share content on CUNO COVO, including photos and comments, you
        remain the owner of your content. However, by posting on CUNO COVO, you
        give us permission to use, display, and share your content as needed to
        operate and improve the app. This permission remains in place even if
        you later delete your account.
      </p>
    </section>

    <section>
      <p>
        CUNO COVO includes an Anonymous Section where you can post and interact
        without linking your identity. Content shared in this section is not
        connected to your account and cannot be traced back to you. However, you
        are still expected to follow our community guidelines and avoid posting
        content that is illegal, harmful, abusive, or offensive.
      </p>
    </section>

    <section>
      <p>
        We ask that you use CUNO COVO responsibly. You agree not to misuse the
        app by attempting to access accounts or data that don't belong to you,
        or interfere with the app's operation, or using bots, scripts, or other
        automated tools. If we determine that your behavior harms the community
        or violates these Terms, we reserve the right to limit or block your
        access and permanently delete your account without notice.
      </p>
    </section>

    <section>
      <p>
        All rights, title, and interest in CUNO COVO—including its name, design,
        logo, features, points and referral system, and any proprietary
        mechanisms— belong to us. You may not copy, distribute, or attempt to
        reverse-engineer any parts of the app without our written permission.
      </p>
    </section>

    <section>
      <p>
        CUNO COVO relies on third-party services like Google for login and
        Stripe for payment processing. While we trust these providers, we are
        not responsible for their actions or any issues they may cause.
      </p>
    </section>

    <section>
      <p>
        We may update these Terms occasionally to reflect changes in our
        services or legal requirements. If we make changes, we'll update the
        effective date at the top. By continuing to use CUNO COVO, you agree to
        the updated Terms.
      </p>
    </section>

    <section>
      <p>
        CUNO COVO is provided "as is." We do our best to keep the app running
        smoothly but cannot guarantee it will always be free from errors or
        interruptions. We are not responsible for any damages or losses that may
        result from your use of the app, except where required by law.
      </p>
    </section>

    <section>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA. Any
        disputes will be handled exclusively in the courts of Delaware, and by
        using CUNO COVO, you agree to their jurisdiction. If you have questions
        about these Terms, please contact us at{" "}
        <a href="mailto:info@cunocovo.com" className="underline">
          info@cunocovo.com
        </a>
      </p>
    </section>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-6 text-sm">
    <p className="text-gray-500">Effective Date: August 1, 2025</p>

    <div>
      <p className="mb-4">
        At CUNO COVO, we respect your privacy and are committed to protecting
        your personal information. This Privacy Policy explains how we collect,
        use, and safeguard the information you share with us when you use our
        website and, in the future, our mobile app.
      </p>
    </div>

    <section>
      <p className="mb-3">
        When you create an account or interact with CUNO COVO, we may collect
        information such as your name, email address, phone number, and any
        profile details you choose to share. This includes photos, comments,
        likes, Saves, and other user-generated content. If you sign in with
        Google or another service, we receive your login details securely to
        make the process faster and more convenient.
      </p>
      <p>
        We may also collect location information if you enable location services
        on your device. This allows us to provide location-based features and
        enhance your experience. Technical data like your device type, operating
        IP address, and device details may also be collected automatically to
        help us understand how you use the platform and improve functionality.
      </p>
    </section>

    <section>
      <p>
        Payments on CUNO COVO are processed securely through trusted providers
        like Stripe, so we never see or store your financial details.
      </p>
    </section>

    <section>
      <p>
        CUNO COVO offers an Anonymous Section where Creatives can post and
        interact without attaching their identity. This feature is designed to
        provide a safe space. However, anonymity does not mean freedom from
        complete invisibility. If content is flagged for abuse, harassment, or
        violations of our community guidelines, we retain technical information
        (such as IP address or device ID) that may allow us to trace activity
        back to the responsible account. We are committed to protecting your
        identity while ensuring the platform remains safe for everyone.
      </p>
    </section>

    <section>
      <p>
        We use the information we collect outside of the Anonymous Section to
        operate our platform, deliver our services, respond to your support
        requests, and analyze trends to make CUNO COVO better for all users.
      </p>
    </section>

    <section>
      <p>
        You can delete your account at any time through your profile settings.
        However, we may retain certain information after account deletion as
        required or by law, for legitimate purposes, such as for resolving
        disputes, security, and enforcing our community guidelines.
      </p>
    </section>

    <section>
      <p>
        We do not sell personal information. If you are a California resident,
        you have rights under the California Consumer Privacy Act (CCPA) to
        learn more about the personal information we collect, ask for a copy of
        your data, or request deletion. To exercise these rights, please contact
        us at{" "}
        <a href="mailto:info@cunocovo.com" className="underline">
        info@cunocovo.com
        </a>
      </p>
    </section>

    <section>
      <p>
        CUNO COVO uses cookies and similar technologies to enhance functionality
        and understand how users interact with the platform. This may include
        technologies from trusted partners, such as Google Analytics or tools to
        track trends and improve user experience. You can manage or disable
        cookies in your browser or device settings, but this may affect certain
        features.
      </p>
    </section>

    <section>
      <p>
        When our mobile app launches, we may send you push notifications to
        share updates or relevant information. You can manage your notification
        preferences in your device settings at any time.
      </p>
    </section>

    <section>
      <p>
        We take reasonable steps to protect your data, including the use of
        encryption and secure servers. However, no system is completely secure.
        By using CUNO COVO, you acknowledge and accept these risks.
      </p>
    </section>

    <section>
      <p>
        We may update this Privacy Policy from time to time to reflect changes
        in our practices, legal requirements, or app features. Any updates will
        be posted on our website and in the app, and the effective date at the
        top will be updated.
      </p>
    </section>

    <p className="mt-6">
      If you have any questions about this Privacy Policy or wish to exercise
      your privacy rights, contact us at{" "}
      <a href="mailto:info@cunocovo.com" className="underline">
        info@cunocovo.com
      </a>
    </p>
  </div>
);

export default HelpCenter;
