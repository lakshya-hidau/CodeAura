'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const trpc = useTRPC();

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Project created successfully!");
        setValue("");
        router.push(`/projects/${data.id}`); // ✅ navigate to project details
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const isPending = createProject.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-gray-900 to-black px-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Create a New Project
          </h1>
          <p className="text-sm text-zinc-400">
            Enter your project name below to get started.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter project name..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500 transition-all"
          />
          <Button
            onClick={() => createProject.mutate({ value })}
            disabled={!value.trim() || isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-200"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          Projects help you organize your ideas and progress efficiently.
        </p>
      </div>
    </div>
  );
}
