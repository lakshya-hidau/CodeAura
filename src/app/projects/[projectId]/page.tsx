'use client';

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  params: { projectId: string }; // ✅ Correct type
}

export default function ProjectPage({ params }: Props) {
  const router = useRouter();
  const { projectId } = params;

  const copyId = () => {
    navigator.clipboard.writeText(projectId);
    toast.success("Project ID copied!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-3xl"
      >
        <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Project Overview
            </CardTitle>
          </CardHeader>

          <Separator className="my-4 bg-neutral-800" />

          <CardContent className="flex flex-col items-center space-y-6">
            <div className="w-full text-center">
              <p className="text-sm text-neutral-400 mb-2">Your unique project ID:</p>
              <div className="flex items-center justify-center gap-3 bg-neutral-800/60 px-4 py-2 rounded-lg border border-neutral-700">
                <code className="font-mono text-lg">{projectId}</code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyId}
                  className="hover:bg-neutral-700"
                >
                  <Copy className="h-4 w-4 text-neutral-300" />
                </Button>
              </div>
            </div>

            <Separator className="bg-neutral-800 w-2/3" />

            <div className="flex gap-4">
              <Button
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
                onClick={() => router.push(`/dashboard/${projectId}`)}
              >
                Open Dashboard
              </Button>
              <Button
                variant="secondary"
                className="bg-neutral-800 hover:bg-neutral-700 transition-colors"
                onClick={() => router.push(`/projects`)}
              >
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
