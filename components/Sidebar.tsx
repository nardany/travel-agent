import Link from "next/link";
import { getConversations } from "@/db/queries";
import SignOutButton from "./SignOutButton";
export default async function Sidebar({userId} : {userId : string}) {
  const conversations = await getConversations(userId);

  return (
    <aside className="w-64 border-r p-4 flex flex-col gap-2 overflow-y-auto">
      <Link href="/" className="bg-blue-600 text-white text-center px-4 py-2 rounded">
        + New Chat
      </Link>

      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/chat/${c.id}`}
          className="px-3 py-2 rounded hover:bg-gray-600 truncate"
        >
          {c.title ?? `Chat ${c.id}`}
        </Link>
      ))}
      <div className="mt-auto">
        <SignOutButton/>
      </div>
    </aside>
  );
}