"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import MessagesContainer from "../compontents/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma/client";
import { ProjectHeader } from "../compontents/project-header";
import { FragmentWeb } from "../compontents/fragment-web";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel */}
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-16 border-b">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading project...</p>
                </div>
              </div>
            }
          >
            <ProjectHeader projectId={projectId} />
          </Suspense>

          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            }
          >
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <div className="p-4 h-full flex flex-col">
            <h2 className="font-semibold text-lg mb-4">Preview</h2>

            {activeFragment ? (
              <>
                {/* Safely render FragmentWeb only when available */}
                <FragmentWeb data={activeFragment} />

                <div className="flex-1 flex flex-col overflow-hidden mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-base">
                        {activeFragment.title}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        ({Object.keys(activeFragment.files || {}).length} files)
                      </span>
                    </div>
                    <a
                      href={activeFragment.sandboxUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Open in Sandbox →
                    </a>
                  </div>

                  <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                    <iframe
                      src={activeFragment.sandboxUrl ?? ""}
                      className="w-full h-full"
                      title="Fragment Preview"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No fragment selected</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectView;
