"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { useReactFlow } from "@xyflow/react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AI_ASSISTANT_SENDER_ID,
  AI_ASSISTANT_SENDER_NAME,
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  parseAiChatMessagePayload,
  parseAiStatusFeedPayload,
  type AiChatMessagePayload,
  type AiStatusFeedPayload,
} from "@/types/tasks";
import type { designAgentTask } from "@/trigger/design-agent";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
  initialPrompt?: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const USER_BUBBLE_BG = "var(--node-green-text)";
const USER_BUBBLE_TEXT = "var(--text-inverse-muted)";
const SUBMIT_BUTTON_BG = "var(--node-green-text)";
const STATUS_ACCENT = "var(--node-green-text)";

const FAILED_RUN_STATUSES = new Set<string>([
  "FAILED",
  "CRASHED",
  "CANCELED",
  "TIMED_OUT",
  "SYSTEM_FAILURE",
  "EXPIRED",
]);

interface LatestStatus {
  payload: AiStatusFeedPayload;
  createdAt: number;
  messageId: string;
}

function useLatestAiStatus(): LatestStatus | null {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return null;
    }
    let latest: LatestStatus | null = null;
    for (const message of messages) {
      const payload = parseAiStatusFeedPayload(message.data);
      if (!payload) {
        continue;
      }
      if (!latest || message.createdAt > latest.createdAt) {
        latest = {
          payload,
          createdAt: message.createdAt,
          messageId: message.id,
        };
      }
    }
    return latest;
  }, [messages]);
}

interface ChatFeedItem {
  id: string;
  createdAt: number;
  payload: AiChatMessagePayload;
}

function useAiChatMessages(): ChatFeedItem[] {
  const { messages } = useFeedMessages(AI_CHAT_FEED_ID);
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const valid: ChatFeedItem[] = [];
    for (const message of messages) {
      const payload = parseAiChatMessagePayload(message.data);
      if (!payload) {
        continue;
      }
      valid.push({
        id: message.id,
        createdAt: message.createdAt,
        payload,
      });
    }
    valid.sort((a, b) => a.createdAt - b.createdAt);
    return valid;
  }, [messages]);
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  roomId,
  initialPrompt,
}: AiSidebarProps) {
  const [tab, setTab] = useState<"architect" | "chat" | "specs">("architect");

  return (
    <aside
      className={cn(
        "absolute top-0 right-0 z-30 hidden h-full w-96 flex-col border-l border-border-default bg-bg-base/95 shadow-2xl backdrop-blur-md transition-transform duration-200 md:flex",
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
            <p className="text-xs text-text-muted">Collaborate with Arqitect</p>
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
        onValueChange={(value) =>
          setTab(value as "architect" | "chat" | "specs")
        }
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList className="mx-4 mt-3 grid h-9 w-auto grid-cols-3 bg-bg-elevated">
          <TabsTrigger
            value="architect"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            Chat
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
          <ArchitectTab
            projectId={projectId}
            roomId={roomId}
            initialPrompt={initialPrompt}
          />
        </TabsContent>

        <TabsContent
          value="chat"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <ChatTab />
        </TabsContent>

        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          <SpecsTab projectId={projectId} roomId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

interface ArchitectTabProps {
  projectId: string;
  roomId: string;
  initialPrompt?: string;
}

function ArchitectTab({ projectId, roomId, initialPrompt }: ArchitectTabProps) {
  const { user } = useUser();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const chatItems = useAiChatMessages();
  const latestStatus = useLatestAiStatus();
  const updateMyPresence = useUpdateMyPresence();

  const [draft, setDraft] = useState(initialPrompt ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ensureFeedRef = useRef<Promise<void> | null>(null);

  const ensureFeed = useCallback(() => {
    if (ensureFeedRef.current) {
      return ensureFeedRef.current;
    }
    const promise = createFeed(AI_CHAT_FEED_ID).catch(() => {
      // already-exists / race conditions are non-fatal.
    });
    ensureFeedRef.current = promise;
    return promise;
  }, [createFeed]);

  useEffect(() => {
    void ensureFeed();
  }, [ensureFeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatItems.length, latestStatus?.messageId]);

  const isRunActive = activeRun !== null;

  useEffect(() => {
    updateMyPresence({ thinking: isRunActive });
  }, [isRunActive, updateMyPresence]);

  const currentUserId = user?.id ?? null;
  const currentUserName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Anonymous";
  const currentUserAvatar = user?.imageUrl || undefined;

  const pushChatMessage = useCallback(
    async (payload: AiChatMessagePayload) => {
      await ensureFeed();
      await createFeedMessage(AI_CHAT_FEED_ID, payload);
    },
    [createFeedMessage, ensureFeed],
  );

  const pushAssistantMessage = useCallback(
    async (content: string, runId: string, isError = false) => {
      const payload: AiChatMessagePayload = {
        kind: "chat",
        role: "assistant",
        senderId: AI_ASSISTANT_SENDER_ID,
        senderName: AI_ASSISTANT_SENDER_NAME,
        content,
        timestamp: Date.now(),
        runId,
        ...(isError ? { isError: true } : {}),
      };
      try {
        await pushChatMessage(payload);
      } catch {
        // swallow — surfacing as toast would just create a second failure path.
      }
    },
    [pushChatMessage],
  );

  const submitDraft = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (
        trimmed.length === 0 ||
        isSubmitting ||
        isRunActive ||
        !currentUserId
      ) {
        return;
      }
      setIsSubmitting(true);
      setDraft("");
      try {
        await pushChatMessage({
          kind: "chat",
          role: "user",
          senderId: currentUserId,
          senderName: currentUserName,
          ...(currentUserAvatar ? { senderAvatarUrl: currentUserAvatar } : {}),
          content: trimmed,
          timestamp: Date.now(),
        });
      } catch {
        // swallow chat-push errors and continue to AI trigger.
      }

      try {
        const response = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            projectId,
            roomId,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          await pushAssistantMessage(
            text || "Failed to start Arqitect. Please try again.",
            "no-run",
            true,
          );
          return;
        }
        const data = (await response.json()) as {
          runId?: string;
          publicToken?: string;
        };
        if (
          typeof data.runId === "string" &&
          data.runId.length > 0 &&
          typeof data.publicToken === "string" &&
          data.publicToken.length > 0
        ) {
          setActiveRun({ runId: data.runId, publicToken: data.publicToken });
        } else {
          await pushAssistantMessage(
            "Arqitect did not return a run handle.",
            "no-run",
            true,
          );
        }
      } catch {
        await pushAssistantMessage(
          "Network error reaching Arqitect. Please try again.",
          "no-run",
          true,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentUserAvatar,
      currentUserId,
      currentUserName,
      isRunActive,
      isSubmitting,
      projectId,
      pushAssistantMessage,
      pushChatMessage,
      roomId,
    ],
  );

  const handleRunCompleted = useCallback(
    async (runId: string, summary: string) => {
      await pushAssistantMessage(summary, runId, false);
      setActiveRun((current) =>
        current && current.runId === runId ? null : current,
      );
    },
    [pushAssistantMessage],
  );

  const handleRunFailed = useCallback(
    async (runId: string, message: string) => {
      await pushAssistantMessage(message, runId, true);
      setActiveRun((current) =>
        current && current.runId === runId ? null : current,
      );
    },
    [pushAssistantMessage],
  );

  const handleSend = useCallback(() => {
    void submitDraft(draft);
  }, [draft, submitDraft]);

  const handleStarterClick = useCallback(
    (prompt: string) => {
      void submitDraft(prompt);
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
        void submitDraft(draft);
      }
    },
    [draft, submitDraft],
  );

  const inputsDisabled = isSubmitting || isRunActive || !currentUserId;
  const hasAnyChat = chatItems.length > 0;

  const statusForStrip =
    isRunActive &&
    latestStatus &&
    latestStatus.payload.runId === activeRun?.runId
      ? latestStatus.payload
      : null;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {!hasAnyChat ? (
          <ArchitectEmptyState
            onStarterClick={handleStarterClick}
            disabled={inputsDisabled}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {chatItems.map((item) => (
              <ArchitectMessageBubble
                key={item.id}
                payload={item.payload}
                isCurrentUser={
                  item.payload.role === "user" &&
                  currentUserId !== null &&
                  item.payload.senderId === currentUserId
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-default px-4 py-3">
        {statusForStrip ? <StatusStrip payload={statusForStrip} /> : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder={
              isRunActive
                ? "Arqitect is working on your last request..."
                : "Ask Arqitect to design something..."
            }
            className="min-h-[72px] max-h-[160px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
            disabled={inputsDisabled}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={draft.trim().length === 0 || inputsDisabled}
            aria-label={inputsDisabled ? "Arqitect is busy" : "Send message"}
            className="text-text-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: SUBMIT_BUTTON_BG }}
          >
            {isSubmitting || isRunActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-text-faint">
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>

      {activeRun ? (
        <RunTracker
          key={activeRun.runId}
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onCompleted={handleRunCompleted}
          onFailed={handleRunFailed}
        />
      ) : null}
    </>
  );
}

interface RunTrackerProps {
  runId: string;
  publicToken: string;
  onCompleted: (runId: string, summary: string) => void | Promise<void>;
  onFailed: (runId: string, message: string) => void | Promise<void>;
}

function RunTracker({
  runId,
  publicToken,
  onCompleted,
  onFailed,
}: RunTrackerProps) {
  const { run, error } = useRealtimeRun<typeof designAgentTask>(runId, {
    accessToken: publicToken,
  });
  const settledRef = useRef(false);

  useEffect(() => {
    if (settledRef.current) {
      return;
    }
    if (error) {
      settledRef.current = true;
      void onFailed(
        runId,
        error.message || "Lost connection to Arqitect. Please try again.",
      );
      return;
    }
    if (!run) {
      return;
    }
    if (run.status === "COMPLETED") {
      settledRef.current = true;
      const summary =
        (run.output && typeof run.output.summary === "string"
          ? run.output.summary.trim()
          : "") ||
        `Arqitect applied ${run.output?.applied ?? 0} change${
          (run.output?.applied ?? 0) === 1 ? "" : "s"
        }.`;
      void onCompleted(runId, summary);
      return;
    }
    if (FAILED_RUN_STATUSES.has(run.status)) {
      settledRef.current = true;
      void onFailed(
        runId,
        run.error?.message || "Arqitect hit an error while designing.",
      );
    }
  }, [error, onCompleted, onFailed, run, runId]);

  return null;
}

function StatusStrip({ payload }: { payload: AiStatusFeedPayload }) {
  const text =
    payload.text && payload.text.trim().length > 0
      ? payload.text
      : defaultStatusText(payload);
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 flex items-center gap-2 rounded-md border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary"
    >
      <span
        className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full"
        style={{ backgroundColor: STATUS_ACCENT }}
        aria-hidden
      />
      <Loader2
        className="h-3 w-3 shrink-0 animate-spin"
        style={{ color: STATUS_ACCENT }}
        aria-hidden
      />
      <span className="truncate">{text}</span>
    </div>
  );
}

interface ArchitectMessageBubbleProps {
  payload: AiChatMessagePayload;
  isCurrentUser: boolean;
}

function ArchitectMessageBubble({
  payload,
  isCurrentUser,
}: ArchitectMessageBubbleProps) {
  if (payload.role === "assistant") {
    const isError = payload.isError === true;
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "flex max-w-[85%] items-start gap-2 rounded-2xl border px-3 py-2 text-sm",
            isError
              ? "border-state-error/40 bg-state-error/10 text-state-error"
              : "border-border-default bg-bg-elevated text-text-primary",
          )}
        >
          {isError ? (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Bot
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: STATUS_ACCENT }}
            />
          )}
          <span className="whitespace-pre-wrap break-words">
            {payload.content}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
      <div
        className="max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
        style={{ backgroundColor: USER_BUBBLE_BG, color: USER_BUBBLE_TEXT }}
      >
        {!isCurrentUser ? (
          <div
            className="mb-1 text-[10px] font-semibold opacity-70"
            style={{ color: USER_BUBBLE_TEXT }}
          >
            {payload.senderName}
          </div>
        ) : null}
        {payload.content}
      </div>
    </div>
  );
}

interface ArchitectEmptyStateProps {
  onStarterClick: (prompt: string) => void;
  disabled: boolean;
}

function ArchitectEmptyState({
  onStarterClick,
  disabled,
}: ArchitectEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          Start designing with Arqitect
        </p>
        <p className="max-w-64 text-xs text-text-muted">
          Describe what you want to build and Arqitect will sketch an
          architecture on the canvas.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onStarterClick(prompt)}
            disabled={disabled}
            className="w-full rounded-full bg-bg-subtle px-3 py-1.5 text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function defaultStatusText(payload: AiStatusFeedPayload): string {
  switch (payload.phase) {
    case "starting":
      return "Arqitect is starting...";
    case "thinking":
      return "Arqitect is thinking...";
    case "applying":
      return "Arqitect is applying changes...";
    case "complete":
      return "Arqitect finished.";
    case "error":
      return "Arqitect hit an error.";
  }
}

function ChatTab() {
  const { user } = useUser();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const chatItems = useAiChatMessages();

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ensureFeedRef = useRef<Promise<void> | null>(null);

  const ensureFeed = useCallback(() => {
    if (ensureFeedRef.current) {
      return ensureFeedRef.current;
    }
    const promise = createFeed(AI_CHAT_FEED_ID).catch(() => {
      // already-exists / race conditions are non-fatal.
    });
    ensureFeedRef.current = promise;
    return promise;
  }, [createFeed]);

  useEffect(() => {
    void ensureFeed();
  }, [ensureFeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatItems.length]);

  const currentUserId = user?.id ?? null;
  const currentUserName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Anonymous";
  const currentUserAvatar = user?.imageUrl || undefined;

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || isSending || !currentUserId) {
      return;
    }
    setIsSending(true);
    setErrorText(null);
    try {
      await ensureFeed();
      const payload: AiChatMessagePayload = {
        kind: "chat",
        role: "user",
        senderId: currentUserId,
        senderName: currentUserName,
        ...(currentUserAvatar ? { senderAvatarUrl: currentUserAvatar } : {}),
        content: trimmed,
        timestamp: Date.now(),
      };
      await createFeedMessage(AI_CHAT_FEED_ID, payload);
      setDraft("");
    } catch {
      setErrorText("Couldn't send message. Try again.");
    } finally {
      setIsSending(false);
    }
  }, [
    createFeedMessage,
    currentUserAvatar,
    currentUserId,
    currentUserName,
    draft,
    ensureFeed,
    isSending,
  ]);

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      if (errorText) {
        setErrorText(null);
      }
    },
    [errorText],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const disabled = isSending || !currentUserId;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {chatItems.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {chatItems.map((item) => (
              <ChatMessageBubble
                key={item.id}
                payload={item.payload}
                isOwnMessage={
                  currentUserId !== null &&
                  item.payload.role === "user" &&
                  item.payload.senderId === currentUserId
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-default px-4 py-3">
        {errorText ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-state-error/40 bg-state-error/10 px-2 py-1 text-xs text-state-error">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            <span>{errorText}</span>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Message your team..."
            className="min-h-[72px] max-h-[160px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
            disabled={disabled}
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSend()}
            disabled={draft.trim().length === 0 || disabled}
            aria-label={isSending ? "Sending message" : "Send message"}
            className="bg-accent-primary text-bg-base hover:bg-accent-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-text-faint">
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>
    </>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          No messages yet
        </p>
        <p className="max-w-64 text-xs text-text-muted">
          Start the conversation with collaborators in this room.
        </p>
      </div>
    </div>
  );
}

interface ChatMessageBubbleProps {
  payload: AiChatMessagePayload;
  isOwnMessage: boolean;
}

function ChatMessageBubble({ payload, isOwnMessage }: ChatMessageBubbleProps) {
  const isAssistant = payload.role === "assistant";
  const initials = getSenderInitials(payload.senderName);
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default text-[10px] font-semibold text-text-primary",
          isAssistant ? "bg-bg-subtle" : "bg-bg-elevated",
        )}
        title={payload.senderName}
        aria-hidden
      >
        {payload.senderAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payload.senderAvatarUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : isAssistant ? (
          <Bot className="h-3.5 w-3.5" style={{ color: STATUS_ACCENT }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-[11px]",
            isOwnMessage ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium text-text-primary">
            {payload.senderName}
          </span>
          <span className="text-text-faint">
            {formatChatTimestamp(payload.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
            isAssistant
              ? payload.isError
                ? "border border-state-error/40 bg-state-error/10 text-state-error"
                : "border border-border-default bg-bg-elevated text-text-primary"
              : "",
          )}
          style={
            !isAssistant
              ? { backgroundColor: USER_BUBBLE_BG, color: USER_BUBBLE_TEXT }
              : undefined
          }
        >
          {payload.content}
        </div>
      </div>
    </div>
  );
}

function getSenderInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) {
    return "?";
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatChatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface SpecListItem {
  id: string;
  createdAt: string;
  filename: string;
}

interface SpecsTabProps {
  projectId: string;
  roomId: string;
}

interface SpecsLoadResult {
  specs: SpecListItem[];
  error: string | null;
}

function SpecsTab({ projectId, roomId }: SpecsTabProps) {
  const reactFlow = useReactFlow();
  const chatItems = useAiChatMessages();
  const latestStatus = useLatestAiStatus();

  const [specs, setSpecs] = useState<SpecListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSpec, setActiveSpec] = useState<SpecListItem | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadSpecs = useCallback(async (): Promise<SpecsLoadResult> => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/specs`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        return { specs: [], error: "Failed to load specs." };
      }
      const data = (await response.json()) as { specs?: SpecListItem[] };
      return {
        specs: Array.isArray(data.specs) ? data.specs : [],
        error: null,
      };
    } catch {
      return { specs: [], error: "Failed to load specs." };
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await loadSpecs();
      if (!cancelled) {
        setSpecs(result.specs);
        setLoadError(result.error);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadSpecs]);

  // Watch the ai-status-feed for the active spec run; when the matching run
  // emits complete or error, refresh the list and clear the active state.
  useEffect(() => {
    let cancelled = false;

    async function settleActiveRun() {
      if (!activeRunId || !latestStatus) {
        return;
      }
      const payload = latestStatus.payload;
      if (payload.kind !== "spec" || payload.runId !== activeRunId) {
        return;
      }
      if (payload.phase === "complete") {
        const result = await loadSpecs();
        if (cancelled) {
          return;
        }
        setSpecs(result.specs);
        setLoadError(result.error);
        setActiveRunId(null);
        setGenerateError(null);
      } else if (payload.phase === "error") {
        await Promise.resolve();
        if (cancelled) {
          return;
        }
        setActiveRunId(null);
        setGenerateError(
          payload.text?.trim() || "Spec generation failed.",
        );
      }
    }

    void settleActiveRun();

    return () => {
      cancelled = true;
    };
  }, [activeRunId, latestStatus, loadSpecs]);

  const handleGenerate = useCallback(async () => {
    if (isStarting || activeRunId) {
      return;
    }
    setIsStarting(true);
    setGenerateError(null);

    const chatHistory = chatItems
      .filter(
        (item) =>
          item.payload.role === "user" || item.payload.role === "assistant",
      )
      .map((item) => ({
        role: item.payload.role,
        content: item.payload.content,
      }));

    const nodes = reactFlow.getNodes();
    const edges = reactFlow.getEdges();

    try {
      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes,
          edges,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        setGenerateError(text || "Failed to start spec generation.");
        return;
      }
      const data = (await response.json()) as { runId?: string };
      if (typeof data.runId === "string" && data.runId.length > 0) {
        setActiveRunId(data.runId);
      } else {
        setGenerateError("Spec run did not start.");
      }
    } catch {
      setGenerateError("Network error starting spec generation.");
    } finally {
      setIsStarting(false);
    }
  }, [activeRunId, chatItems, isStarting, reactFlow, roomId]);

  const isGenerating = isStarting || activeRunId !== null;

  const downloadSpec = useCallback(
    (specId: string, filename: string) => {
      const anchor = document.createElement("a");
      anchor.href = `/api/projects/${projectId}/specs/${specId}/download`;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    },
    [projectId],
  );

  const statusForActiveRun =
    activeRunId &&
    latestStatus &&
    latestStatus.payload.kind === "spec" &&
    latestStatus.payload.runId === activeRunId
      ? latestStatus.payload
      : null;

  const generateButton = (
    <Button
      type="button"
      onClick={() => void handleGenerate()}
      disabled={isGenerating}
      className="w-full bg-accent-primary text-bg-base hover:bg-accent-primary/90 disabled:opacity-60"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Generate Spec"}
    </Button>
  );

  const generateStatusStrip = statusForActiveRun ? (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary"
    >
      <Loader2
        className="h-3 w-3 shrink-0 animate-spin"
        style={{ color: STATUS_ACCENT }}
        aria-hidden
      />
      <span className="truncate">
        {statusForActiveRun.text?.trim() ||
          defaultSpecStatusText(statusForActiveRun.phase)}
      </span>
    </div>
  ) : null;

  const generateErrorBanner = generateError ? (
    <div className="flex items-center gap-2 rounded-md border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-state-error">
      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
      <span>{generateError}</span>
    </div>
  ) : null;

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div className="flex flex-1 items-center justify-center py-6 text-xs text-text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading specs...
      </div>
    );
  } else if (loadError) {
    body = (
      <div className="flex items-center gap-2 rounded-md border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-state-error">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
        <span>{loadError}</span>
      </div>
    );
  } else if (specs.length === 0) {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-primary">
            No specs yet
          </p>
          <p className="max-w-64 text-xs text-text-muted">
            Generated specs will appear here.
          </p>
        </div>
      </div>
    );
  } else {
    body = (
      <ul className="flex flex-col gap-2">
        {specs.map((spec) => (
          <li key={spec.id}>
            <SpecListRow
              spec={spec}
              onOpen={() => setActiveSpec(spec)}
              onDownload={() => downloadSpec(spec.id, spec.filename)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {generateButton}
      {generateStatusStrip}
      {generateErrorBanner}
      {body}

      <SpecPreviewDialog
        spec={activeSpec}
        projectId={projectId}
        onClose={() => setActiveSpec(null)}
        onDownload={() => {
          if (activeSpec) {
            downloadSpec(activeSpec.id, activeSpec.filename);
          }
        }}
      />
    </>
  );
}

function defaultSpecStatusText(phase: AiStatusFeedPayload["phase"]): string {
  switch (phase) {
    case "starting":
      return "Arqitect is reading your canvas...";
    case "thinking":
      return "Drafting technical specification...";
    case "applying":
      return "Finalizing spec...";
    case "complete":
      return "Specification ready.";
    case "error":
      return "Arqitect hit an error.";
  }
}

interface SpecListRowProps {
  spec: SpecListItem;
  onOpen: () => void;
  onDownload: () => void;
}

function SpecListRow({ spec, onOpen, onDownload }: SpecListRowProps) {
  const handleDownloadClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDownload();
    },
    [onDownload],
  );

  return (
    <div
      className="group flex w-full items-start gap-3 rounded-xl border border-border-default bg-bg-elevated p-3 transition-colors hover:bg-bg-subtle"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-subtle text-accent-ai-text">
          <FileText className="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-text-primary">
            {spec.filename}
          </span>
          <span className="mt-0.5 text-[11px] text-text-muted">
            {formatSpecTimestamp(spec.createdAt)}
          </span>
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDownloadClick}
        aria-label={`Download ${spec.filename}`}
        className="shrink-0 text-text-muted hover:text-text-primary"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SpecPreviewDialogProps {
  spec: SpecListItem | null;
  projectId: string;
  onClose: () => void;
  onDownload: () => void;
}

function SpecPreviewDialog({
  spec,
  projectId,
  onClose,
  onDownload,
}: SpecPreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (!spec) {
        setContent(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setContent(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/specs/${spec.id}/download`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          if (!cancelled) {
            setError("Failed to load spec content.");
          }
          return;
        }
        const text = await response.text();
        if (!cancelled) {
          setContent(text);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load spec content.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [spec, projectId]);

  const open = spec !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-[80vh] max-h-[800px] w-[min(900px,calc(100%-2rem))] max-w-[900px] flex-col gap-3 p-0 sm:max-w-[900px]">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-border-default px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DialogTitle className="truncate">
              {spec?.filename ?? "Spec preview"}
            </DialogTitle>
            <DialogDescription>
              {spec ? formatSpecTimestamp(spec.createdAt) : ""}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={!spec}
            className="mr-8"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12 text-xs text-text-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading spec...
            </div>
          ) : error ? (
            <div className="m-4 flex items-center gap-2 rounded-md border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-state-error">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : content !== null ? (
            <SpecMarkdown content={content} />
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SpecMarkdown({ content }: { content: string }) {
  return (
    <div className="py-4 text-sm text-text-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-2 mb-3 text-xl font-semibold text-text-primary">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 text-base font-semibold text-text-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1.5 text-sm font-semibold text-text-primary">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-text-primary">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 text-text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 text-text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={cn("font-mono text-xs", className)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[12px] text-text-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-md border border-border-default bg-bg-elevated p-3 font-mono text-xs leading-relaxed text-text-primary">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-border-default pl-3 text-text-muted italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border-default" />,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border-default bg-bg-elevated px-2 py-1 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border-default px-2 py-1">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function formatSpecTimestamp(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
