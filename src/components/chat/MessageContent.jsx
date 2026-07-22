import React from "react";
import CodeBlock from "./CodeBlock";

// Splits message content into text runs and fenced ```code``` blocks.
function splitContent(content) {
  const parts = [];
  const re = /```(\w*)\r?\n?([\s\S]*?)```/g;
  let last = 0;
  let m;
  while ((m = re.exec(content))) {
    if (m.index > last) parts.push({ type: "text", text: content.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1] || "", code: m[2].replace(/\n$/, "") });
    last = re.lastIndex;
  }
  if (last < content.length) parts.push({ type: "text", text: content.slice(last) });
  return parts;
}

export default function MessageContent({ content }) {
  const parts = splitContent(content || "");
  if (parts.length === 0) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }
  return (
    <div className="space-y-1">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.code} lang={p.lang} />
        ) : (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {p.text}
          </p>
        )
      )}
    </div>
  );
}