"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import {
  productsQueryGcTimeMs,
  productsQueryStaleTimeMs,
} from "@/lib/product-query";

type QueryProviderProps = {
  children: ReactNode;
};

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: productsQueryGcTimeMs,
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: productsQueryStaleTimeMs,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
