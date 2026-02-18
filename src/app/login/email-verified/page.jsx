import { Suspense } from "react";
import EmailVerificationResult from "./components/EmailVerificationResults";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailVerificationResult />
    </Suspense>
  );
}
