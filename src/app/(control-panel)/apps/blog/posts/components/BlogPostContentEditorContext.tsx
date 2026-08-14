"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface BlogPostContentEditorContextValue {
  copyPlaceholder: (token: string) => Promise<void>;
}

const BlogPostContentEditorContext =
  createContext<BlogPostContentEditorContextValue | null>(null);

export function BlogPostContentEditorProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useSnackbar();

  const copyPlaceholder = useCallback(
    async (token: string) => {
      try {
        await navigator.clipboard.writeText(token);
        showSnackbar("Placeholder copied to clipboard", "success");
      } catch (error) {
        console.error("Failed to copy blog placeholder:", error);
        showSnackbar("Could not copy placeholder", "error");
      }
    },
    [showSnackbar],
  );

  const value = useMemo(() => ({ copyPlaceholder }), [copyPlaceholder]);

  return (
    <BlogPostContentEditorContext.Provider value={value}>
      {children}
    </BlogPostContentEditorContext.Provider>
  );
}

export function useBlogPostContentEditor(): BlogPostContentEditorContextValue {
  const context = useContext(BlogPostContentEditorContext);
  if (!context) {
    throw new Error(
      "useBlogPostContentEditor must be used within BlogPostContentEditorProvider",
    );
  }
  return context;
}
