import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

/**
 * Wraps the active Next.js page with the ThemeProvider and renders it inside a <main> element that applies the Inter font.
 *
 * @param {Object} props
 * @param {React.ComponentType<any>} props.Component - The active page component to render.
 * @param {Object} props.pageProps - Props to pass through to the page component.
 * @returns {JSX.Element} The app tree wrapped with ThemeProvider and the page component rendered inside a styled <main>.
 */
export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  );
}
