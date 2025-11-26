# 🎯 Supabase Realtime - Usage Examples

## 📨 Chat Messages

### Example: Real-time Chat Component

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useConversationMessages } from '@/lib/realtime/client';

export default function ChatRoom({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  // Subscribe to new messages
  const handleNewMessage = useCallback((message: any) => {
    setMessages(prev => [...prev, message]);
  }, []);

  useConversationMessages(conversationId, handleNewMessage);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.sender.username}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
}
```

---

## ⌨️  Typing Indicators

### Example: Show Who's Typing

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTypingIndicator } from '@/lib/realtime/client';

export default function ChatWithTyping({ 
  conversationId, 
  currentUserId,
  currentUsername 
}: { 
  conversationId: string;
  currentUserId: string;
  currentUsername: string;
}) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Handle typing events
  const handleTyping = useCallback((data: any) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      if (data.isTyping) {
        next.add(data.username);
      } else {
        next.delete(data.username);
      }
      return next;
    });

    // Clear typing after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.username);
        return next;
      });
    }, 3000);
  }, []);

  const { sendTyping } = useTypingIndicator(
    conversationId,
    currentUserId,
    handleTyping
  );

  // Call this when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    sendTyping(currentUserId, currentUsername, true);
    
    // Stop typing after 1 second of inactivity
    setTimeout(() => {
      sendTyping(currentUserId, currentUsername, false);
    }, 1000);
  };

  return (
    <div>
      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="text-sm text-gray-500">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        onChange={handleInputChange}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

---

## 🔔 Notifications

### Example: Real-time Notifications

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useUserNotifications } from '@/lib/realtime/client';
import { Bell } from 'lucide-react';

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle new notifications
  const handleNotification = useCallback((notification: any) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
      });
    }
  }, []);

  useUserNotifications(userId, handleNotification);

  return (
    <div className="relative">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
```

---

## 👥 Presence (Online/Offline)

### Example: Show Who's Online

```typescript
'use client';

import { useState, useCallback } from 'react';
import { usePresence } from '@/lib/realtime/client';

export default function OnlineUsers({ 
  conversationId,
  userId,
  username 
}: { 
  conversationId: string;
  userId: string;
  username: string;
}) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const handlePresenceChange = useCallback((presences: any[]) => {
    setOnlineUsers(presences);
  }, []);

  usePresence(
    `conversation:${conversationId}:presence`,
    userId,
    username,
    handlePresenceChange
  );

  return (
    <div>
      <h3>Online ({onlineUsers.length})</h3>
      <ul>
        {onlineUsers.map((user: any) => (
          <li key={user.userId}>
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2" />
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📅 Session Updates

### Example: Live Participant Count

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useSessionUpdates } from '@/lib/realtime/client';

export default function SessionParticipants({ sessionId }: { sessionId: string }) {
  const [participantCount, setParticipantCount] = useState(0);

  const handleSessionUpdate = useCallback((update: any) => {
    // Refetch participant count or update based on event
    if (update.eventType === 'INSERT') {
      setParticipantCount(prev => prev + 1);
    } else if (update.eventType === 'DELETE') {
      setParticipantCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  useSessionUpdates(sessionId, handleSessionUpdate);

  return (
    <div>
      <span>{participantCount} participants</span>
    </div>
  );
}
```

---

## 🔧 Custom Subscription

### Example: Custom Table Subscription

```typescript
'use client';

import { useRealtimeSubscription } from '@/lib/realtime/client';

export default function CustomSubscription() {
  useRealtimeSubscription('my-custom-channel', {
    table: 'Review',
    event: 'INSERT',
    filter: 'rating=gte.4',
    onData: (payload) => {
      console.log('New 4+ star review:', payload.new);
      // Handle the data
    },
  });

  return <div>Listening for reviews...</div>;
}
```

---

## 🎯 Best Practices

### 1. Cleanup Subscriptions
The hooks automatically clean up when the component unmounts. No manual cleanup needed!

### 2. Memoize Callbacks
Always use `useCallback` for event handlers to prevent unnecessary re-subscriptions:

```typescript
const handleNewMessage = useCallback((message: any) => {
  // Handle message
}, []); // Empty deps = stable function
```

### 3. Enable Replication in Supabase
Make sure to enable replication for tables you want to listen to:
- Go to: Supabase Dashboard → Database → Replication
- Enable for: `Message`, `Notification`, `UserSession`, etc.

### 4. Filter Efficiently
Use filters to reduce unnecessary events:

```typescript
filter: `conversation_id=eq.${conversationId}` // Only this conversation
filter: `user_id=eq.${userId}` // Only this user
filter: `rating=gte.4` // Only 4+ star ratings
```

### 5. Handle Errors
Supabase Realtime is very reliable, but always handle edge cases:

```typescript
const handleNewMessage = useCallback((message: any) => {
  try {
    setMessages(prev => [...prev, message]);
  } catch (error) {
    console.error('Error handling message:', error);
  }
}, []);
```

---

## 📊 Performance Tips

1. **Use specific filters** - Don't subscribe to entire tables
2. **Limit subscriptions** - Only subscribe when needed
3. **Cleanup properly** - Let the hooks handle cleanup
4. **Batch updates** - Use `useState` batching for multiple updates
5. **Debounce typing** - Don't send typing events on every keystroke

---

## ✅ Summary

- ✅ **Messages:** `useConversationMessages`
- ✅ **Typing:** `useTypingIndicator`
- ✅ **Notifications:** `useUserNotifications`
- ✅ **Presence:** `usePresence`
- ✅ **Sessions:** `useSessionUpdates`
- ✅ **Custom:** `useRealtimeSubscription`

All hooks work on Vercel, localhost, and everywhere else! 🚀
