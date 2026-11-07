import ChatFab from "../../components/chat/ChatFab";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Cormorant_Garamond } from "next/font/google";
import Header from "../../components/shop/Header";
import Footer from "../../components/shop/Footer";
import CartProvider from "../../components/shop/CartProvider";
import "../_styles/queen-orders.css";
import { getCategories, type Category } from "../../lib/shop/queries";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ar",
  display: "swap",
});
const corm = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "QUEEN STORE", template: "%s | QUEEN STORE" },
  description: "متجر QUEEN STORE الإلكتروني",
};

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let cats: Category[] = [];
  try {
    cats = await getCategories();
  } catch {
    cats = [];
  }
  return (
    <div className={`${plex.variable} ${corm.variable} qm`}>
      <CartProvider>
        <a href="#main" className="qm-skip">انتقل إلى المحتوى</a>
        <Header categories={cats} />
        <main id="main">{children}</main>
        <Footer categories={cats} />
      <ChatFab />
      </CartProvider>
    </div>
  );
}
