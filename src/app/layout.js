import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Vecta",
  description: "Building blocks for Dashboards, Hoshin Policy Deployment, and Projects",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
