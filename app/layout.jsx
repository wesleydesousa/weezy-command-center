import "./globals.css";

export const metadata = {
  title: "Weezy Command Center",
  description: "Planejamento editorial, editor inteligente de clipes e produção do canal Weezy"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
