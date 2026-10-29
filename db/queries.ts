import { db } from "./index";
import { conversations, messages } from "./schema";
import { eq, desc, asc, and } from "drizzle-orm";

export async function getConversations(userId: number) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));
}

export async function getMessages(conversationId: number) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function createConversation(userId: number) {
  const [conversation] = await db
    .insert(conversations)
    .values({ userId })
    .returning();
  return conversation;
}

export async function addMessage(
  conversationId : number,
  role : "user" | "assistant",
  content : string
) {
   const [message] = await db
    .insert(messages)
    .values({ conversationId, role, content })
    .returning();
  return message;
}

export async function getConversation(conversationId: number, userId: number) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
  return conversation;
}

export async function createConversationWithMessage(userId: number, content: string) {
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({ userId })
      .returning();


    await tx
      .insert(messages)
      .values({ conversationId: conversation.id, role: "user", content });

    return conversation;
  });
}