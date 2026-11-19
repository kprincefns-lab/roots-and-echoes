import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, FamilyMember } from "@/types/family";
import { buildPersonaSystemPrompt, generateSimulatedEcho } from "@/lib/persona";

interface ChatRequestBody {
  member: FamilyMember;
  allMembers: FamilyMember[];
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ChatRequestBody>;
    const { member, allMembers = [], messages = [] } = body;

    if (!member || !member.firstName) {
      return NextResponse.json(
        { error: "Missing family member context." },
        { status: 400 }
      );
    }

    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const systemPrompt = buildPersonaSystemPrompt(member, allMembers);
    const formattedHistory = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 1. Optional OpenAI integration via Vercel env var
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.78,
            max_tokens: 320,
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
            ],
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json({ reply, mode: "live" });
          }
        }
      } catch {
        // Fall through to simulated persona
      }
    }

    // 2. Optional Anthropic integration via Vercel env var
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
            max_tokens: 320,
            system: systemPrompt,
            messages: formattedHistory,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            content?: Array<{ type: string; text?: string }>;
          };
          const reply = data.content
            ?.filter((b) => b.type === "text" && b.text)
            .map((b) => b.text)
            .join("\n")
            .trim();
          if (reply) {
            return NextResponse.json({ reply, mode: "live" });
          }
        }
      } catch {
        // Fall through to simulated persona
      }
    }

    // 3. Built-in realistic simulated persona echo (zero-config default)
    const simulatedReply = generateSimulatedEcho(
      member,
      allMembers,
      latestUserMessage,
      messages
    );
    return NextResponse.json({ reply: simulatedReply, mode: "simulated" });
  } catch {
    return NextResponse.json(
      { error: "Unable to process digital echo request." },
      { status: 500 }
    );
  }
}
