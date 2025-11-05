import { Nunito_Sans } from "next/font/google";

export const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "600", "700", "800"], // choose what you need
  display: "swap",
});
