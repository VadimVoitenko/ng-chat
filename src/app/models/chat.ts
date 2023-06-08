import { Timestamp } from '@angular/fire/firestore';
import { ProfileUser } from './user-profile';

export interface Chat {
  id: string;
  lastMessage?: string;
  lastMessageDate?: Date & Timestamp;
  userIDs: string[];
  users: ProfileUser[];

  chatPic?: string;
  chatName?: string;
}

export interface Message {
  text: string;
  senderID: string;
  sentDate: Date & Timestamp;
}
