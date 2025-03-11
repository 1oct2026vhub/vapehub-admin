import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Reset password | VapeHub",
  description: "Access your VapeHub account securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}