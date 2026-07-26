import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import GlobalNav from "@/components/GlobalNav";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import ChatComposer from "@/components/chat/ChatComposer";
import CouncilPanel from "@/components/chat/CouncilPanel";
import EmptyState from "@/components/chat/EmptyState";
import { Hammer, Menu } from "lucide-react";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");
const friendlyKeyMsg =
  "Lovelace needs her Groq API key configured to think — ask your admin to set GROQ_API_KEY.";

export default function AppWorkspace() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [consult, setConsult] = useState(null);
  const [composerText, setComposerText] = useState("");
  const composerRef = useRef(null);
  const pollRef = useRef(null);

  // Prefill the composer when the Forge Guide overlay launches the user here
  // with a chosen prompt (?q=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setComposerText(q);
      setTimeout(() => composerRef.current?.focus(), 0);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const list = await base44.entities.Conversation.list("-updated_date", 50);
      setConversations(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    setLoadingMsgs(true);
    setThreadError("");
    try {
      const list = await base44.entities.Message.filter(
        { conversation_id: id },
        "-created_date",
        100
      );
      setMessages([...(list || [])].reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const closeConsult = () => {
    stopPolling();
    setConsult(null);
  };

  useEffect(() => () => stopPolling(), []);

  const selectConversation = (id) => {
    setActiveId(id);
    setMobileNav(false);
    closeConsult();
    loadMessages(id);
  };

  const prefillComposer = (text) => {
    setComposerText(text);
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const ensureConversation = async (seedText) => {
    if (activeId) return activeId;
    const c = await base44.entities.Conversation.create({
      title: (seedText || "New conversation").slice(0, 60),
      last_message_preview: "",
    });
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    return c.id;
  };

  const handleSend = async (text) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setThreadError("");
    try {
      const convoId = await ensureConversation(text);
      await base44.functions.invoke("chat_completion", {
        conversation_id: convoId,
        user_message: text,
      });
      await loadMessages(convoId);
      await loadConversations();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong.";
      setThreadError(isGroqKeyError(msg) ? friendlyKeyMsg : msg);
    } finally {
      setSending(false);
    }
  };

  const startPolling = (sessionId) => {
    stopPolling();
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 1500;
      try {
        const rows = await base44.entities.ModelResponse.filter({
          consult_session_id: sessionId,
        }, "-created_date", 50);
        const ordered = [...(rows || [])].reverse();
        setConsult((prev) => (prev ? { ...prev, responses: ordered } : prev));
        const allDone =
          ordered.length > 0 &&
          ordered.every((r) => r.status === "completed" || r.status === "failed");
        if (allDone || elapsed > 45000) {
          stopPolling();
          setConsult((prev) => (prev ? { ...prev, done: true } : prev));
        }
      } catch (e) {
        console.error(e);
      }
    }, 1500);
  };

  const handleConsult = async (prompt) => {
    if (!prompt.trim() || sending) return;
    setThreadError("");
    setSending(true);
    try {
      const convoId = await ensureConversation(prompt);
      // Surface the question in the thread before the council deliberates.
      await base44.entities.Message.create({
        conversation_id: convoId,
        role: "user",
        content: prompt,
      });
      await loadMessages(convoId);

      const res = await base44.functions.invoke("start_consult", {
        conversation_id: convoId,
        prompt,
      });
      const data = res.data || res;
      setConsult({
        consultSessionId: data.consult_session_id,
        responses: data.responses || [],
        synthesizing: false,
        error: "",
        done: false,
      });
      startPolling(data.consult_session_id);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Could not consult the council.";
      setConsult({
        consultSessionId: null,
        responses: [],
        synthesizing: false,
        error: isGroqKeyError(msg) ? friendlyKeyMsg : msg,
        done: false,
      });
    } finally {
      setSending(false);
    }
  };

  const handleSynthesize = async () => {
    if (!consult?.consultSessionId) return;
    setConsult((prev) => ({ ...prev, synthesizing: true, error: "" }));
    try {
      const res = await base44.functions.invoke("synthesize_consult", {
        consult_session_id: consult.consultSessionId,
      });
      const data = res.data || res;

      // Stamp the contributing provider names onto the synthesis message so the
      // chat thread can showcase them ("Synthesized from N models · …").
      const providers = [
        ...new Set(
          (consult.responses || [])
            .filter((r) => r.status === "completed" && r.content)
            .map((r) => r.provider || r.model_id)
            .filter(Boolean)
        ),
      ];
      if (providers.length > 0 && activeId) {
        try {
          const recent = await base44.entities.Message.filter(
            { conversation_id: activeId, role: "consult_synthesis" },
            "-created_date",
            5
          );
          const synth = (recent || [])[0];
          if (synth) {
            await base44.entities.Message.update(synth.id, {
              model_source: `lovelace-synthesis||${providers.join(", ")}`,
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      await loadMessages(activeId);
      await loadConversations();
      setConsult((prev) => ({
        ...prev,
        synthesizing: false,
        done: true,
        collapsed: true,
        synthesis: data.synthesis,
      }));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Synthesis failed.";
      setConsult((prev) => ({
        ...prev,
        synthesizing: false,
        error: isGroqKeyError(msg) ? friendlyKeyMsg : msg,
      }));
    }
  };

  const renameConversation = async (id, title) => {
    await base44.entities.Conversation.update(id, { title });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const deleteConversation = async (id) => {
    const msgs = await base44.entities.Message.filter({ conversation_id: id }, "-created_date", 500);
    await Promise.all((msgs || []).map((m) => base44.entities.Message.delete(m.id)));
    await base44.entities.Conversation.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      closeConsult();
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeId);
  const showEmpty = !activeId && messages.length === 0;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-stone-200">
      <GlobalNav />

      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {mobileNav && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setMobileNav(false)}
          />
        )}

        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={() => {
            newConversation();
            setMobileNav(false);
          }}
          onRename={renameConversation}
          onDelete={deleteConversation}
          loading={loadingConvos}
          user={user}
          onLogout={logout}
          mobileNav={mobileNav}
          className={`fixed z-40 h-full transition-transform md:static md:translate-x-0 ${
            mobileNav ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        />

        <main className="relative flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2.5">
              <button
                className="text-stone-400 hover:text-stone-200 md:hidden"
                onClick={() => setMobileNav((v) => !v)}
                aria-label="Toggle conversations"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700">
                <Hammer className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                {activeConvo?.title || "Lovelace Forge"}
              </span>
            </div>
          </header>

          {showEmpty ? (
            <EmptyState onPrefill={prefillComposer} />
          ) : (
            <MessageList
              messages={messages}
              loading={loadingMsgs || sending}
              error={threadError}
            />
          )}

          {consult && !consult.collapsed && (
            <CouncilPanel
              consult={consult}
              onSynthesize={handleSynthesize}
              onClose={closeConsult}
            />
          )}

          <ChatComposer
            value={composerText}
            onChange={setComposerText}
            inputRef={composerRef}
            onSend={handleSend}
            onConsult={handleConsult}
            disabled={sending}
          />
        </main>
      </div>
    </div>
  );

  async function newConversation() {
    try {
      const c = await base44.entities.Conversation.create({
        title: "New conversation",
        last_message_preview: "",
      });
      setConversations((prev) => [c, ...prev]);
      setActiveId(c.id);
      setMessages([]);
      closeConsult();
    } catch (e) {
      console.error(e);
    }
  }
}