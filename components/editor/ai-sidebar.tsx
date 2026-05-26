"use client";

import {
  useCallback,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Bot, Download, FileText, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [tab, setTab] = useState<"architect" | "specs">("architect");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  const submitDraft = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${prev.length}`,
          role: "user",
          content: trimmed,
        },
      ]);
      setDraft("");
    },
    [],
  );

  const handleSend = useCallback(() => {
    submitDraft(draft);
  }, [draft, submitDraft]);

  const handleStarterClick = useCallback(
    (prompt: string) => {
      submitDraft(prompt);
    },
    [submitDraft],
  );

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
    },
    [],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitDraft(draft);
      }
    },
    [draft, submitDraft],
  );

  return (
    <aside
      className={cn(
        "absolute top-0 right-0 z-20 hidden h-full w-96 flex-col border-l border-border-default bg-bg-base/95 shadow-2xl backdrop-blur-md transition-transform duration-200 md:flex",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
      )}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border-default px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-accent-ai-text">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-text-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-text-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "architect" | "specs")}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList className="mx-4 mt-3 grid h-9 w-auto grid-cols-2 bg-bg-elevated">
          <TabsTrigger
            value="architect"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <ArchitectEmptyState onStarterClick={handleStarterClick} />
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-default px-4 py-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Ask Ghost AI to design something..."
                className="min-h-[72px] max-h-[160px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={draft.trim().length === 0}
                aria-label="Send message"
                className="bg-accent-primary text-white hover:bg-accent-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-text-faint">
              Enter to send. Shift + Enter for a new line.
            </p>
          </div>
        </TabsContent>

        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          <Button
            type="button"
            className="w-full bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Generate Spec
          </Button>

          <SpecCard />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

interface ArchitectEmptyStateProps {
  onStarterClick: (prompt: string) => void;
}

function ArchitectEmptyState({ onStarterClick }: ArchitectEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          Start designing with Ghost AI
        </p>
        <p className="max-w-64 text-xs text-text-muted">
          Describe what you want to build and Ghost AI will sketch an
          architecture on the canvas.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onStarterClick(prompt)}
            className="w-full rounded-full bg-bg-subtle px-3 py-1.5 text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl border-2 border-accent-primary/50 bg-accent-primary-dim px-3 py-2 text-sm text-text-primary">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl border border-border-default bg-bg-elevated px-3 py-2 text-sm text-accent-ai-text">
        {message.content}
      </div>
    </div>
  );
}

function SpecCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-elevated p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-subtle text-accent-ai-text">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-sm font-medium text-text-primary">
            E-commerce Backend Spec
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
            Generated architecture overview covering services, data flow, and
            integration points.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          className="text-text-muted"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
