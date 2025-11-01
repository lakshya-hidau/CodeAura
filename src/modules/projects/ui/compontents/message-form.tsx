import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";

interface Props {
    projectId: string;
}

const formSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
});

export const MessageForm = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        },
    });

    const createMessage = useMutation(trpc.message.create.mutationOptions({
        onSuccess: (data) => {
            form.reset();
            queryClient.invalidateQueries(
                trpc.message.getMany.queryOptions({ projectId }),
            );
            // TODO: Invalidate usage status
        },
        onError: (error) => {
            // TODO redirect to pricing page
            toast.error(error.message)
        }
    }))

    const onSubmit = async(data: z.infer<typeof formSchema>) => {
        await createMessage.mutateAsync({
            value: data.content,
            projectId,
        });
    };

    const [isFocused, setIsFocused] = useState(false);
    const isPending = createMessage.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;
    const [showUsage, setShowUsage] = useState(false);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn(
                "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                isFocused && "shadow-xs",
                showUsage && "rounded-t-none"
            )}>
                <FormField 
                    control={form.control}
                    name="content"
                    render={({field}) => (
                        <TextareaAutosize 
                            {...field} 
                            disabled={isPending}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            minRows={2}
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What would you like to build?"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                />
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center
                        gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span>&#8984;</span>Enter
                        </kbd>
                        &nbsp;to submit
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isButtonDisabled}
                        className={cn(
                            "size-8 rounded-full",
                            isButtonDisabled && "bg-muted-foreground border"
                        )}>
                        {isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            <ArrowUpIcon className="size-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}