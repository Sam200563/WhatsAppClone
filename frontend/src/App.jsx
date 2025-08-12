import React, { useEffect, useState, useRef } from "react";
import { fetchConversations, fetchMessages, sendMessage } from "./api";
import {
  Check,
  CheckCheck,
  Video,
  Phone,
  Search,
  Smile,
  Paperclip,
  ArrowLeft,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const MY_WA_ID = "me";

function ConversationItem({ item, onClick, active }) {
  const time = item.lastTimestamp
    ? new Date(item.lastTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <div
      onClick={() => onClick(item)}
      className={`px-4 py-3 cursor-pointer flex items-center ${
        active ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold mr-3">
        {item.name ? item.name[0] : item.wa_id[0]}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="font-medium text-sm truncate">{item.name || item.wa_id}</div>
          <div className="text-xs text-gray-500">{time}</div>
        </div>
        <div className="text-xs text-gray-600 truncate">{item.lastText}</div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "sent") return <Check size={16} className="text-gray-400" />;
  if (status === "delivered") return <CheckCheck size={16} className="text-gray-400" />;
  if (status === "read") return <CheckCheck size={16} className="text-blue-500" />;
  return null;
}

function MessageBubble({ m }) {
  const isMine = m.from === "me";
  const time = m.timestamp
    ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg ${
          isMine ? "bg-[#DCF8C6] text-black rounded-br-none" : "bg-white text-black rounded-bl-none"
        }`}
        style={{
          borderRadius: "7.5px",
          boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
        }}
      >
        <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>
        <div className="text-[11px] mt-1 flex items-center justify-end text-gray-500">
          <span>{time}</span>
          {isMine && (
            <span className="ml-1">
              <StatusIcon status={m.status} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  return (
    <div className="text-center text-gray-500 text-xs my-3">
      <span className="bg-white px-3 py-1 rounded-full shadow-sm">{date}</span>
    </div>
  );
}

function getFormattedDate(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
}

function ChatMessages({ messages }) {
  let lastDate = null;

  return messages.map((m) => {
    const messageDate = new Date(m.timestamp).toDateString();
    const showSeparator = messageDate !== lastDate;
    lastDate = messageDate;

    return (
      <React.Fragment key={m._id || m.id}>
        {showSeparator && <DateSeparator date={getFormattedDate(new Date(m.timestamp))} />}
        <MessageBubble m={m} />
      </React.Fragment>
    );
  });
}

export default function App() {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // controls mobile overlay
  const emojiRef = useRef();

  async function loadConvos() {
    let c = await fetchConversations();
    c = c.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    c = c.filter((chat) => chat.wa_id !== MY_WA_ID);
    setConvos(c);
    if (!active && c.length > 0) setActive(c[0]);
  }

  async function openConversation(conv) {
    setActive(conv);
    const msgs = await fetchMessages(conv.wa_id);
    setMessages(msgs);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }

  function goBackToList() {
    setShowSidebar(true);
    setActive(null);
  }

  useEffect(() => {
    loadConvos();
    const onResize = () => {
      if (window.innerWidth >= 768) setShowSidebar(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !active) return;

    const saved = await sendMessage(active.wa_id, input.trim());
    const localMsg = saved.message;
    setMessages((prev) => [...prev, localMsg]);

    setConvos((prev) =>
      prev
        .map((c) =>
          c.wa_id === active.wa_id
            ? { ...c, lastText: localMsg.text, lastTimestamp: localMsg.timestamp, lastFrom: "me" }
            : c
        )
        .sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
    );

    setInput("");
  }

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <div
        className={`
          ${showSidebar ? "block" : "hidden"}
          fixed inset-0 z-40 w-full bg-white flex flex-col
          md:static md:block md:w-80 md:border-r md:z-auto
        `}
      >
        <div className="p-4 font-bold bg-green-600 text-white">WhatsApp Clone</div>
        <div className="p-2 border-b bg-white">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring focus:border-green-400"
          />
        </div>
        <div className="overflow-auto flex-1">
          {convos
            .filter((c) => (c.name || c.wa_id).toLowerCase().includes(search.toLowerCase()))
            .map((c) => (
              <ConversationItem
                key={c.wa_id}
                item={c}
                onClick={openConversation}
                active={active?.wa_id === c.wa_id}
              />
            ))}
        </div>
      </div>


      <div className={`${showSidebar ? "hidden" : "flex"} flex-1 flex-col md:flex`}>
       
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center">
            <ArrowLeft
              className="mr-3 cursor-pointer md:hidden"
              size={24}
              onClick={goBackToList}
            />
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold mr-3">
              {active?.name ? active.name[0] : active?.wa_id?.[0]}
            </div>
            <div>
              <div className="font-semibold">{active?.name || active?.wa_id || "Select a chat"}</div>
              <div className="text-sm text-gray-500">last seen today at 7:58 AM</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-gray-600">
            <Video className="cursor-pointer hover:text-black" size={20} />
            <Phone className="cursor-pointer hover:text-black" size={20} />
            <Search className="cursor-pointer hover:text-black" size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[url('/src/whatsapp-bg.jpg')] bg-cover">
          {messages.length === 0 && <div className="text-gray-500">No messages yet</div>}
          <ChatMessages messages={messages} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center gap-2 relative">
          <Smile
            className="cursor-pointer text-gray-600 hover:text-black"
            size={24}
            onClick={() => setShowEmoji((prev) => !prev)}
          />
          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-16 left-2 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}

          <Paperclip className="cursor-pointer text-gray-600 hover:text-black" size={24} />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-400"
            placeholder="Type a message"
          />
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Send</button>
        </form>
      </div>
    </div>
  );
}
