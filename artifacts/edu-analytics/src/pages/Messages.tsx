import { useState } from "react";
import { useGetContacts, useGetMessages, useSendMessage } from "@workspace/api-client-react";
import { getAuthHeaders, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Send, User as UserIcon, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  
  const { data: contacts, isLoading: loadingContacts } = useGetContacts({ request: { headers: getAuthHeaders() } });
  const { data: allMessages, isLoading: loadingMessages } = useGetMessages({ request: { headers: getAuthHeaders() } });
  const sendMutation = useSendMessage({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();

  const selectedContact = contacts?.find(c => c.id === selectedContactId);
  
  // Filter messages between current user and selected contact
  const conversation = allMessages?.filter(m => 
    (m.senderId === user?.id && m.receiverId === selectedContactId) ||
    (m.receiverId === user?.id && m.senderId === selectedContactId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContactId) return;

    try {
      await sendMutation.mutateAsync({
        data: { receiverId: selectedContactId, content: messageInput.trim() }
      });
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages`] });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm flex overflow-hidden">
      {/* Sidebar - Contacts */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="font-bold text-lg text-slate-900">Directory</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingContacts ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : contacts?.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                selectedContactId === contact.id 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "hover:bg-slate-100 text-slate-700"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                selectedContactId === contact.id ? "bg-white/20" : "bg-slate-200 text-slate-500"
              )}>
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{contact.name}</p>
                <p className={cn("text-xs capitalize truncate", selectedContactId === contact.id ? "text-primary-foreground/80" : "text-slate-500")}>
                  {contact.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedContact ? (
          <>
            <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3 bg-white z-10">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedContact.name}</h3>
                <p className="text-xs text-slate-500 capitalize">{selectedContact.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : conversation.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                conversation.map(msg => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isMine ? "ml-auto items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                        isMine 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 mt-1 px-1">
                        {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 min-h-[50px] max-h-32 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex-shrink-0"
                >
                  {sendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-600">Your Messages</p>
            <p className="text-sm">Select a contact from the directory to view the conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
