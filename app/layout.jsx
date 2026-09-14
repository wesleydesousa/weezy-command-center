import "./globals.css";

export const metadata = {
  title: "Weezy Command Center",
  description: "Planejamento editorial, editor inteligente de clipes, conta protegida e recursos profissionais para criadores."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
