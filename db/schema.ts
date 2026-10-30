import { pgTable, serial, text, integer, timestamp, jsonb, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth-schema";
export * from "./auth-schema";

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("conversations_user_id_idx").on(table.userId)]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
    check("messages_role_check", sql`${table.role} IN ('user', 'assistant')`),
  ]
);

export const toolCalls = pgTable(
  "tool_calls",
  {
    id : serial("id").primaryKey(),
    messageId : integer("message_id").notNull().references(()=> messages.id, {onDelete : "cascade"}),
    toolName : text("tool_name").notNull(),
    input : jsonb("input").notNull(),
    output : jsonb("output"),
    durationMs : integer("duration_ms"),
    createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) =>[
    index("tool_calls_message_id_idx").on(table.messageId)
  ]
);