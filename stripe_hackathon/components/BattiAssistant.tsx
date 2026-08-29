"use client";

import {
  appendAssistantEvent,
  ASSISTANT_SESSION_LIMIT,
  canSubmitAssistantMessage,
  cancelReportDraft,
  confirmReportDraft,
  finishAssistantStream,
  openConfirmableDraft,
  remainingAssistantMessages,
} from "@/lib/assistant";
import type {
  AssistantArea,
  AssistantForecast,
  AssistantMessage,
  AssistantReplyState,
  ConfirmableReportDraft,
} from "@/lib/assistant";
import { parseAssistantStream } from "@/lib/assistant-stream";
import {
  ASSISTANT_EXAMPLES,
  formatEtaLocalized,
  type Locale,
  type Messages,
} from "@/lib/i18n";
import type { AreaId, ReportKind, Status } from "@/lib/types";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type BattiAssistantProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAreaId: AreaId;
  areas: AssistantArea[];
  forecast: AssistantForecast | null;
  onConfirmReport: (areaId: AreaId, kind: ReportKind) => void;
  locale: Locale;
  copy: Messages;
};

type ConversationMessage =
  | (AssistantMessage & { id: number; role: "user" })
  | {
      id: number;
      role: "assistant";
      reply: AssistantReplyState;
      draft: ConfirmableReportDraft | null;
      incomplete: boolean;
    };

const EMPTY_REPLY: AssistantReplyState = {
  content: "",
  reportDraft: null,
  status: "streaming",
  errorCode: null,
};

function historyMessage(message: ConversationMessage): AssistantMessage | null {
  if (message.role === "user") {
    return { role: "user", content: message.content };
  }
  if (!message.reply.content.trim()) return null;
  return { role: "assistant", content: message.reply.content };
}

export function BattiAssistant({
  open,
  onOpenChange,
  selectedAreaId,
  areas,
  forecast,
  onConfirmReport,
  locale,
  copy,
}: BattiAssistantProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);
  const [activeRequest, setActiveRequest] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestActiveRef = useRef(false);
  const nextIdRef = useRef(0);
  const wasOpenRef = useRef(false);
  const selectedArea =
    areas.find((area) => area.id === selectedAreaId) ?? areas[0];
  const remaining = remainingAssistantMessages(submittedCount);
  const atLimit = !canSubmitAssistantMessage(submittedCount);
  const latestMessage = messages[messages.length - 1];
  const liveReplyId =
    latestMessage?.role === "assistant" ? latestMessage.id : undefined;
  const showFallback =
    latestMessage?.role === "assistant" &&
    (latestMessage.reply.status === "error" || latestMessage.incomplete);
  const examples = ASSISTANT_EXAMPLES[locale];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open && wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function close() {
    onOpenChange(false);
  }

  function updateAssistantMessage(
    id: number,
    update: (
      message: Extract<ConversationMessage, { role: "assistant" }>,
    ) => Extract<ConversationMessage, { role: "assistant" }>,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id && message.role === "assistant"
          ? update(message)
          : message,
      ),
    );
  }

  async function sendMessage(message: string) {
    if (!message || requestActiveRef.current || atLimit) return;

    requestActiveRef.current = true;
    const history = messages
      .map(historyMessage)
      .filter((item): item is AssistantMessage => item !== null)
      .slice(-6);
    const userId = nextIdRef.current++;
    const replyId = nextIdRef.current++;
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: message },
      {
        id: replyId,
        role: "assistant",
        reply: EMPTY_REPLY,
        draft: null,
        incomplete: false,
      },
    ]);
    setInput("");
    setLastFailedPrompt(message);
    setSubmittedCount((count) => count + 1);
    setActiveRequest(true);

    let reply = EMPTY_REPLY;
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAreaId,
          areas,
          history,
          message,
          forecast,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error("assistant_request_failed");
      }

      for await (const streamEvent of parseAssistantStream(response.body)) {
        const nextReply = appendAssistantEvent(reply, streamEvent);
        reply = nextReply;
        updateAssistantMessage(replyId, (current) => ({
          ...current,
          reply: nextReply,
          draft: openConfirmableDraft(nextReply),
          incomplete: false,
        }));
      }
      const finishedReply = finishAssistantStream(reply);
      if (finishedReply !== reply) {
        updateAssistantMessage(replyId, (current) => ({
          ...current,
          reply: finishedReply,
          draft: null,
          incomplete: Boolean(finishedReply.content.trim()),
        }));
      } else {
        setLastFailedPrompt(null);
      }
    } catch {
      if (!controller.signal.aborted) {
        updateAssistantMessage(replyId, (current) => {
          const failed = appendAssistantEvent(current.reply, {
            type: "error",
            code: "stream_failed",
          });
          return {
            ...current,
            reply: failed,
            draft: null,
            incomplete: Boolean(failed.content.trim()),
          };
        });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      requestActiveRef.current = false;
      setActiveRequest(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input.trim());
  }

  function handleConfirm(id: number) {
    const message = messages.find(
      (item) => item.id === id && item.role === "assistant",
    );
    if (!message || message.role !== "assistant") return;
    const result = confirmReportDraft(message.draft);
    if (result.command) {
      onConfirmReport(result.command.areaId, result.command.kind);
    }
    updateAssistantMessage(id, (current) => ({
      ...current,
      draft: result.draft,
    }));
  }

  function handleCancel(id: number) {
    updateAssistantMessage(id, (message) => ({
      ...message,
      draft: cancelReportDraft(),
    }));
  }

  function handleRetry() {
    if (!lastFailedPrompt || activeRequest || atLimit) return;
    void sendMessage(lastFailedPrompt);
  }

  const status: Status = selectedArea?.status ?? "stale";
  const etaLabel = selectedArea
    ? formatEtaLocalized(selectedArea.eta, locale)
    : "";
  const selectedLabel =
    copy.areas[selectedAreaId] ?? selectedArea?.name ?? selectedAreaId;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className="assistant-launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        {copy.askBatti}
      </button>

      <dialog
        ref={dialogRef}
        className="assistant-backdrop"
        aria-labelledby="assistant-heading"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <section className="assistant-sheet">
          <header className="assistant-header">
            <div>
              <p className="assistant-kicker">{copy.selectedArea}</p>
              <h2 id="assistant-heading">{copy.askBatti}</h2>
              <p className="assistant-area">{selectedLabel}</p>
            </div>
            <button
              type="button"
              className="assistant-close"
              aria-label={copy.close}
              onClick={close}
            >
              {copy.close}
            </button>
          </header>

          {messages.length === 0 ? (
            <div className="assistant-intro">
              <p className="assistant-privacy">{copy.privacy}</p>
              <p>{copy.tryAsking}</p>
              <div className="assistant-examples">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setInput(example);
                      inputRef.current?.focus();
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div ref={messagesRef} className="assistant-messages">
            {messages.map((message) =>
              message.role === "user" ? (
                <article
                  key={message.id}
                  className="assistant-message assistant-message-user"
                >
                  <span>{copy.you}</span>
                  <p>{message.content}</p>
                </article>
              ) : (
                <article
                  key={message.id}
                  className="assistant-message assistant-message-batti"
                >
                  <span>{copy.brand}</span>
                  <p
                    aria-live={
                      message.id === liveReplyId ? "polite" : undefined
                    }
                    aria-busy={
                      message.id === liveReplyId &&
                      message.reply.status === "streaming"
                    }
                  >
                    {message.reply.status === "error" &&
                    !message.reply.content.trim()
                      ? copy.responseIncomplete
                      : message.reply.content ||
                        (message.reply.status === "streaming"
                          ? copy.thinking
                          : copy.couldNotComplete)}
                    {message.incomplete ||
                    (message.reply.status === "error" &&
                      message.reply.content.trim())
                      ? copy.incompleteMark
                      : ""}
                    {message.reply.status === "streaming" ? (
                      <i className="assistant-cursor" aria-hidden="true" />
                    ) : null}
                  </p>

                  {message.draft && !message.draft.confirmed ? (
                    <div className="assistant-draft">
                      <p>
                        {copy.draftFor(
                          copy.areas[message.draft.areaId] ??
                            message.draft.areaId,
                          copy.kind[message.draft.kind],
                        )}
                      </p>
                      <p className="assistant-draft-note">{copy.draftNote}</p>
                      <div className="assistant-draft-actions">
                        <button
                          type="button"
                          className="assistant-confirm"
                          onClick={() => handleConfirm(message.id)}
                        >
                          {copy.confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(message.id)}
                        >
                          {copy.cancel}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {message.draft?.confirmed ? (
                    <div className="assistant-draft assistant-draft-done">
                      <p>{copy.reportSubmitted}</p>
                      <div className="assistant-draft-actions">
                        <button type="button" onClick={close}>
                          {copy.viewMap}
                        </button>
                        <button
                          type="button"
                          onClick={() => inputRef.current?.focus()}
                        >
                          {copy.keepAsking}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ),
            )}

            {showFallback ? (
              <div className="assistant-fallback">
                <p>
                  {selectedLabel}:{" "}
                  <strong className={`status-${status}`}>
                    {copy.status[status]}
                  </strong>
                  {etaLabel ? ` · ${etaLabel}` : ""}
                </p>
                <p className="assistant-draft-note">{copy.fallbackNote}</p>
                <div className="assistant-draft-actions">
                  <button
                    type="button"
                    className="tap on"
                    onClick={() => onConfirmReport(selectedAreaId, "on")}
                  >
                    {copy.powerOn}
                  </button>
                  <button
                    type="button"
                    className="tap off"
                    onClick={() => onConfirmReport(selectedAreaId, "off")}
                  >
                    {copy.powerOff}
                  </button>
                  <button
                    type="button"
                    className="tap unsure"
                    onClick={() => onConfirmReport(selectedAreaId, "unsure")}
                  >
                    {copy.unsure}
                  </button>
                </div>
                <button
                  type="button"
                  className="assistant-retry"
                  disabled={activeRequest || atLimit || !lastFailedPrompt}
                  onClick={handleRetry}
                >
                  {copy.retry}
                </button>
              </div>
            ) : null}
          </div>

          <form className="assistant-form" onSubmit={submit}>
            <label htmlFor="assistant-question">{copy.askLabel}</label>
            <div>
              <input
                ref={inputRef}
                id="assistant-question"
                value={input}
                maxLength={1000}
                disabled={activeRequest || atLimit}
                onChange={(event) => setInput(event.currentTarget.value)}
              />
              <button
                type="submit"
                disabled={
                  activeRequest || atLimit || input.trim().length === 0
                }
              >
                {copy.send}
              </button>
            </div>
            <p className="assistant-remaining">
              {atLimit
                ? copy.sessionLimit
                : copy.remaining(remaining, ASSISTANT_SESSION_LIMIT)}
            </p>
          </form>
        </section>
      </dialog>
    </>
  );
}
