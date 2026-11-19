import { ChatMessage, FamilyMember } from "@/types/family";
import { getFullName } from "./lineage";

export function buildPersonaSystemPrompt(
  member: FamilyMember,
  allMembers: FamilyMember[]
): string {
  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const parents = member.parentIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m))
    .map(getFullName);
  const partners = member.partnerIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m))
    .map(getFullName);
  const children = member.childrenIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m))
    .map(getFullName);

  const milestonesText = member.milestones
    .map((ms) => `- ${ms.year}: ${ms.title} (${ms.description})`)
    .join("\n");

  return [
    `You are the preserved living memory and conversational echo of ${getFullName(member)}${
      member.maidenName ? ` (née ${member.maidenName})` : ""
    }.`,
    `Born: ${member.birthYear}${member.birthPlace ? ` in ${member.birthPlace}` : ""}.${
      member.passingYear ? ` Passed in ${member.passingYear}.` : ""
    }`,
    `Occupation: ${member.occupation || "Family member"}.`,
    `Era & Cultural Context: ${member.persona.era}.`,
    `Voice & Tone: ${member.persona.tone}.`,
    `Personality Traits: ${member.persona.traits.join(", ")}.`,
    parents.length ? `Parents: ${parents.join(" and ")}.` : "",
    partners.length ? `Partner/Spouse: ${partners.join(", ")}.` : "",
    children.length ? `Children: ${children.join(", ")}.` : "",
    `\nBiography:\n${member.bio}`,
    milestonesText ? `\nKey Life Milestones:\n${milestonesText}` : "",
    `\nCore Values: ${member.beliefs.coreValues.join(", ")}.`,
    `Life Philosophy: "${member.beliefs.philosophy}"`,
    `Favorite Quotes: ${member.beliefs.favoriteQuotes.join(" | ")}`,
    `Spiritual / Cultural Outlook: ${member.beliefs.spiritualBeliefs}`,
    `Advice for Future Generations: "${member.beliefs.adviceForFuture}"`,
    `\nInstructions: Speak warmly in first person as ${member.firstName}. Stay grounded in your real biography, era, and family connections. Keep replies heartfelt, vivid, and concise (2–4 sentences unless asked for a deeper story). Never break character or mention being an AI.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Rich built-in simulated persona engine so the Digital Clone works immediately
 * out of the box without requiring external API keys.
 */
export function generateSimulatedEcho(
  member: FamilyMember,
  allMembers: FamilyMember[],
  userMessage: string,
  history: ChatMessage[] = []
): string {
  const q = userMessage.toLowerCase();
  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const partners = member.partnerIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m));
  const parents = member.parentIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m));
  const children = member.childrenIds
    .map((id) => byId.get(id))
    .filter((m): m is FamilyMember => Boolean(m));

  const turnCount = history.filter((m) => m.role === "user").length;
  const quote =
    member.beliefs.favoriteQuotes[turnCount % Math.max(1, member.beliefs.favoriteQuotes.length)] ??
    member.beliefs.philosophy;

  // 1. Advice / Wisdom / Principles / Philosophy
  if (
    /(advice|wisdom|principle|value|believe|philosophy|lesson|future|teach|hope|hard|tough|afraid|mistake|patient)/.test(
      q
    )
  ) {
    return `${member.beliefs.adviceForFuture} If I had to distill everything I learned in ${member.persona.era.toLowerCase()}, it comes down to ${member.beliefs.coreValues
      .slice(0, 2)
      .join(" and ")
      .toLowerCase()}. As I used to remind myself: "${quote}"`;
  }

  // 2. Partner / Love / Marriage
  if (
    partners.length > 0 &&
    (/(love|marry|married|meet|met|partner|wife|husband|spouse)/.test(q) ||
      partners.some((p) => q.includes(p.firstName.toLowerCase())))
  ) {
    const partner = partners[0];
    const meetingMilestone = member.milestones.find(
      (ms) =>
        ms.title.toLowerCase().includes(partner.firstName.toLowerCase()) ||
        ms.description.toLowerCase().includes(partner.firstName.toLowerCase()) ||
        ms.title.toLowerCase().includes("married")
    );
    if (meetingMilestone) {
      return `Ah, thinking of ${partner.firstName} still warms the whole room. In ${meetingMilestone.year}—${meetingMilestone.title.toLowerCase()}—${meetingMilestone.description} Walking through life beside someone whose strengths complement your own is the greatest gift a person can ask for.`;
    }
    return `${partner.firstName} has always been my anchor. Even when our worlds looked different from the outside, we built a home rooted in ${member.beliefs.coreValues[0]?.toLowerCase() ?? "love"} and quiet loyalty.`;
  }

  // 3. Parents / Childhood / Roots / Growing up
  if (
    /(parent|mother|father|mom|dad|childhood|youth|grow up|grew up|born|hometown|origin)/.test(q) ||
    parents.some((p) => q.includes(p.firstName.toLowerCase()))
  ) {
    const parentNames = parents.map((p) => p.firstName).join(" and ");
    const earliest = member.milestones[0];
    if (parentNames) {
      return `Growing up with ${parentNames} shaped almost every instinct I carry. ${
        earliest
          ? `I still remember ${earliest.year}, when ${earliest.title.toLowerCase()}—${earliest.description} `
          : ""
      }You never really leave the table where you first learned how to pay attention.`;
    }
    return `I was born in ${member.birthYear}${
      member.birthPlace ? ` in ${member.birthPlace}` : ""
    }. ${
      earliest
        ? `One of my clearest early chapters was ${earliest.year}: ${earliest.title}. ${earliest.description}`
        : member.bio.slice(0, 220)
    }`;
  }

  // 4. Children / Descendants / Family
  if (
    children.length > 0 &&
    (/(child|children|kid|son|daughter|proud|family|grand)/.test(q) ||
      children.some((c) => q.includes(c.firstName.toLowerCase())))
  ) {
    const names = children.map((c) => c.firstName).join(" and ");
    return `Watching ${names} find their own compasses has been the truest joy of my life. ${member.beliefs.philosophy} Every branch of this family carries a little piece of everyone who came before.`;
  }

  // 5. Work / Craft / Passion / Career
  if (/(work|job|craft|passion|build|make|paint|music|science|career|study|discover|archive|map|kiln|cello|watch|orchard|kelp|seed|star|violin)/.test(q)) {
    const highlight = member.milestones[Math.min(1, member.milestones.length - 1)] ?? member.milestones[0];
    return `My work as a ${member.occupation?.toLowerCase() ?? "maker"} taught me how to listen closely to the world. ${
      highlight
        ? `Back in ${highlight.year}, when ${highlight.title.toLowerCase()}, ${highlight.description} `
        : ""
    }That's why I always say: "${quote}"`;
  }

  // 6. Health / Longevity / Habits
  if (/(health|long|habit|routine|ritual|morning|day|live|longevity)/.test(q)) {
    return `${member.health.longevityNotes} For me, daily rhythm mattered tremendously—${member.health.lifestyleNotes.toLowerCase()}. And for everyone coming after me: ${member.health.hereditaryGuidance}`;
  }

  // 7. Specific milestone or story request
  const matchingMilestone = member.milestones.find(
    (ms) =>
      q.includes(String(ms.year)) ||
      ms.title
        .toLowerCase()
        .split(/\s+/)
        .some((w) => w.length > 4 && q.includes(w))
  );
  if (matchingMilestone) {
    return `You're asking about ${matchingMilestone.year}—${matchingMilestone.title}! I can still see it clearly: ${matchingMilestone.description} Looking back, it was one of the moments that taught me ${member.beliefs.philosophy.toLowerCase()}`;
  }

  // 8. Rich default conversational response drawing from biography & beliefs
  const milestone = member.milestones[turnCount % Math.max(1, member.milestones.length)];
  if (milestone && turnCount % 2 === 0) {
    return `That reminds me of ${milestone.year}, around the time of "${milestone.title}." ${milestone.description} Whenever I think of our family looking back at these pages, I hope you remember this most of all: "${quote}"`;
  }

  return `${member.beliefs.philosophy} In my years as a ${
    member.occupation?.toLowerCase() ?? "member of this family"
  }${member.birthPlace ? `—starting all the way back in ${member.birthPlace}` : ""}—I found that ${member.beliefs.coreValues
    .slice(0, 3)
    .join(", ")
    .toLowerCase()} never go out of season. What else would you like to ask me?`;
}
