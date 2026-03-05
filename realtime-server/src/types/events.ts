/**
 * TypeScript Event Contracts for Socket.IO
 * Defines all client-server communication events
 */

// ===========================
// Common Types
// ===========================

export interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface RoomMessage {
  _id: string;
  roomId: string;
  sender: User;
  content: string;
  createdAt: Date;
}

export interface AudioRoomState {
  roomId: string;
  currentTrackId: string | null;
  playbackPosition: number;
  isPlaying: boolean;
  playedBy: string | null;
  timestamp: number;
  currentTrack?: {
    id: string;
    title: string;
    artist: string;
    albumArt: string;
    duration: number;
  };
}

// ===========================
// Client → Server Events
// ===========================

export interface ClientToServerEvents {
  // Chat Events
  send_message: (data: {
    receiverId: string;
    content: string;
  }, callback: (response: { success: boolean; message?: Message; error?: string }) => void) => void;

  mark_messages_read: (data: { chatId: string }) => void;

  // Text Room Events
  join_room: (data: {
    roomId: string;
  }, callback: (response: { success: boolean; error?: string }) => void) => void;

  leave_room: (data: { roomId: string }) => void;

  room_message: (data: {
    roomId: string;
    content: string;
  }, callback: (response: { success: boolean; message?: RoomMessage; error?: string }) => void) => void;

  // Typing Indicators
  typing_start: (data: { roomId: string }) => void;
  typing_stop: (data: { roomId: string }) => void;
  typing_start_dm: (data: { receiverId: string }) => void;
  typing_stop_dm: (data: { receiverId: string }) => void;

  // Presence
  get_online_friends: (callback: (userIds: string[]) => void) => void;

  // Audio Room Events
  join_audio_room: (data: {
    roomId: string;
  }, callback: (response: { success: boolean; state?: AudioRoomState; error?: string }) => void) => void;

  leave_audio_room: (data: { roomId: string }) => void;

  play_track: (data: {
    roomId: string;
    trackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      albumArt: string;
      duration: number;
    };
  }) => void;

  pause_track: (data: { roomId: string }) => void;

  resume_track: (data: { roomId: string }) => void;

  seek_track: (data: {
    roomId: string;
    position: number;
  }) => void;

  change_track: (data: {
    roomId: string;
    trackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      albumArt: string;
      duration: number;
    };
  }) => void;
}

// ===========================
// Server → Client Events
// ===========================

export interface ServerToClientEvents {
  // Chat Events
  new_message: (message: Message) => void;
  message_sent: (message: Message) => void;
  messages_read: (data: { chatId: string; userId: string }) => void;

  // Room Events
  room_message: (message: RoomMessage) => void;
  room_user_joined: (data: { roomId: string; user: User }) => void;
  room_user_left: (data: { roomId: string; userId: string }) => void;

  // Typing Indicators
  typing: (data: { roomId: string; userId: string; username: string; isTyping: boolean }) => void;
  typing_dm: (data: { userId: string; username: string; isTyping: boolean }) => void;

  // Presence
  friend_online: (data: { userId: string; username: string }) => void;
  friend_offline: (data: { userId: string; username: string }) => void;

  // Audio Room Events
  audio_room_state: (state: AudioRoomState) => void;
  audio_play: (data: {
    roomId: string;
    trackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      albumArt: string;
      duration: number;
    };
    playedBy: string;
    timestamp: number;
  }) => void;
  audio_pause: (data: {
    roomId: string;
    position: number;
    pausedBy: string;
    timestamp: number;
  }) => void;
  audio_resume: (data: {
    roomId: string;
    resumedBy: string;
    timestamp: number;
  }) => void;
  audio_seek: (data: {
    roomId: string;
    position: number;
    seekedBy: string;
    timestamp: number;
  }) => void;
  audio_track_changed: (data: {
    roomId: string;
    trackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      albumArt: string;
      duration: number;
    };
    changedBy: string;
    timestamp: number;
  }) => void;
  audio_user_joined: (data: {
    roomId: string;
    user: User;
  }) => void;
  audio_user_left: (data: {
    roomId: string;
    userId: string;
  }) => void;

  // Connection Events
  reconnect_success: (data: {
    message: string;
    timestamp: number;
  }) => void;
}

// ===========================
// Socket Data (attached to socket instance)
// ===========================

export interface SocketData {
  userId: string;
  username: string;
  profilePicture?: string;
}
