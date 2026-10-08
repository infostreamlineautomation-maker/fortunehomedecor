import {
  Be_Vietnam_Pro,
  DM_Mono,
  Google_Sans_Flex,
  Instrument_Sans,
  Inter,
  Playfair_Display,
  Source_Serif_4,
} from "next/font/google";

// Next has no fallback metrics for Google Sans Flex yet, so skip the generated fallback
const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  variable: "--font-google-sans-flex",
  adjustFontFallback: false,
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans" });
const beVietnam = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-be-vietnam" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: "400", variable: "--font-dm-mono" });

export const fontVariables = [googleSansFlex, inter, instrumentSans, beVietnam, playfair, sourceSerif, dmMono]
  .map((f) => f.variable)
  .join(" ");
