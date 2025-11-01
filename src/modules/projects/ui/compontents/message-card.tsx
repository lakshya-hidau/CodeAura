import { Card } from "@/components/ui/card";
import { Fragment } from "@/generated/prisma/client";
import { MessageRole, MessageType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon } from "lucide-react";
import Image from "next/image";

interface UserMessageProps {
    content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
    console.log("Rendering USER message:", content?.substring(0, 30));
    return (
        <div className="flex justify-end mb-4 px-4">
            <Card className="p-3 bg-blue-500 text-white max-w-2xl rounded-2xl">
                <p className="text-sm">{content}</p>
            </Card>
        </div>
    );
}

interface MessageCardProps {
    content: string;
    role: MessageRole;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type: MessageType;
}

interface AssistantMessageProps {
    content: string;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type: MessageType;
}

interface FragmentCardProps {
    fragment: Fragment;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard = ({
    fragment,
    isActiveFragment,
    onFragmentClick
}: FragmentCardProps) => {
    return (
        <button
            className={cn(
                "flex items-start text-start gap-2 border rounded-lg bg-muted w-full p-3 hover:bg-secondary transition-colors",
                isActiveFragment && "bg-primary text-primary-foreground border-primary hover:bg-primary",
            )}
            onClick={() => onFragmentClick(fragment)}
        >
            <Code2Icon className="size-4 mt-0.5 shrink-0"/>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium line-clamp-1">
                    {fragment.title}
                </span>
                <span className="text-xs text-muted-foreground">
                    Preview
                </span>
            </div>
            <div className="flex items-center justify-center mt-0.5">
                <ChevronRightIcon className="size-4 shrink-0"/>
            </div>
        </button>
    )
}

const AssistantMessage = ({
    content,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: AssistantMessageProps) => {
    console.log("Rendering ASSISTANT message:", {
        content: content?.substring(0, 30),
        hasFragment: !!fragment,
        type
    });
    
    return (
        <div className={cn(
            "flex flex-col group px-4 pb-4 mb-4 w-full",
            type === "ERROR" && "text-red-700 dark:text-red-500",
        )}>
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
                    <span className="text-white text-xs font-bold">CA</span>
                </div>
                 
                <span className="text-sm font-semibold">CodeAura</span>
                <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
                </span>
            </div>
            <div className="ml-8 flex flex-col gap-y-3">
                {content && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {content}
                    </div>
                )}
                {fragment && (
                    <FragmentCard
                        fragment={fragment}
                        isActiveFragment={isActiveFragment}
                        onFragmentClick={onFragmentClick}
                    />
                )}
            </div>
        </div>
    )
};

export const MessageCard = ({
    content,
    role,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: MessageCardProps) => {
    console.log("MessageCard received:", { 
        role, 
        roleType: typeof role,
        content: content?.substring(0, 30),
        type 
    });

    // Handle both string and enum types for role
    const roleStr = String(role).toUpperCase();
    
    if (roleStr === "ASSISTANT") {
        return (
            <AssistantMessage
                content={content}
                fragment={fragment}
                createdAt={createdAt}
                isActiveFragment={isActiveFragment}
                onFragmentClick={onFragmentClick}
                type={type}
            />
        )
    }
    
    if (roleStr === "USER") {
        return <UserMessage content={content}/>
    }

    // Fallback - shows what role was received
    console.error("Unknown message role:", role, typeof role);
    return (
        <div className="px-4 py-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 rounded">
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                Unknown message role: "{role}" (type: {typeof role})
            </p>
            <p className="text-sm mt-1">{content}</p>
        </div>
    );
};

export default MessageCard;