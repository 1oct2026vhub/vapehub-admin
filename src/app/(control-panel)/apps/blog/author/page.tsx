import type { Metadata } from "next";
import BlogAuthorDetailsApp from "./BlogAuthorDetailsApp";

export const metadata: Metadata = {
  title: "Authors | VapeHub",
};

export default function BlogAuthorPage() {
  return <BlogAuthorDetailsApp />;
}
