// components/AuthLayout.tsx
import Logout from "../../../components/Logout";

export default function AuthLayout({ showLogout = false, children }) {
  return (
    <div
      className="min-h-dvh bg-white flex flex-col"
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
    >
      {showLogout && (
        <div className="w-full flex justify-end items-center p-5">
          <Logout className={undefined} />
        </div>
      )}
      <div className="flex-grow flex justify-center items-center p-6">
        {children}
      </div>
    </div>
  );
}
