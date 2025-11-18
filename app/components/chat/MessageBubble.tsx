import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  sender: {
    id: string;
    email: string;
    username?: string | null;
  };
  created_at: string;
  isOwn: boolean;
}

export default function MessageBubble({
  content,
  sender,
  created_at,
  isOwn,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex flex-col max-w-[75%] sm:max-w-[60%]`}>
        {!isOwn && (
          <span className="text-xs text-gray-600 mb-1 px-2">
            {sender.username || sender.email.split('@')[0]}
          </span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm sm:text-base break-words whitespace-pre-wrap">
            {content}
          </p>
        </div>
        <span className={`text-xs text-gray-500 mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(created_at)}
        </span>
      </div>
    </div>
  );
}
