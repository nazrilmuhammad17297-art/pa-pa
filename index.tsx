import { createFileRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ClassApp } from "@/components/class-app";
import { getBoard } from "@/lib/class-board.functions";

export const Route = createFileRoute("/")({
  loader: () => getBoard(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 3000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ClassApp initial={initial} />
    </QueryClientProvider>
  );
}
