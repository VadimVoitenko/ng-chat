import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  where,
  query,
  doc,
  Timestamp,
  updateDoc,
  orderBy,
} from '@angular/fire/firestore';
import { ProfileUser } from '../models/user-profile';
import { Observable, concatMap, map, take } from 'rxjs';
import { UsersService } from './users.service';
import { Chat, Message } from '../models/chat';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(
    private firestore: Firestore,
    private usersService: UsersService
  ) {}

  createChat(otherUser: ProfileUser): Observable<string> {
    const ref = collection(this.firestore, 'chats');
    return this.usersService.currentUserProfile$.pipe(
      take(1),
      concatMap((user) =>
        addDoc(ref, {
          userIDs: [user?.uid, otherUser?.uid],
          users: [
            {
              displayName: user?.displayName ?? '',
              photoURL: user?.photoURL ?? '',
            },
            {
              displayName: otherUser?.displayName ?? '',
              photoURL: otherUser?.photoURL ?? '',
            },
          ],
        })
      ),
      map((ref) => ref.id)
    );
  }

  get myChats$(): Observable<Chat[]> {
    const ref = collection(this.firestore, 'chats');
    return this.usersService.currentUserProfile$.pipe(
      concatMap((user) => {
        const myQuery = query(
          ref,
          where('userIDs', 'array-contains', user?.uid)
        );
        return collectionData(myQuery, { idField: 'id' }).pipe(
          map((chats) =>
            this.addChatNameAndPic(user?.uid ?? '', chats as Chat[])
          )
        ) as Observable<Chat[]>;
      })
    );
  }

  addChatMessage(chatID: string, message: string): Observable<any> {
    const ref = collection(this.firestore, 'chats', chatID, 'messages');
    const chatRef = doc(this.firestore, 'chats', chatID);
    const today = Timestamp.fromDate(new Date());
    return this.usersService.currentUserProfile$.pipe(
      take(1),
      concatMap((user) =>
        addDoc(ref, {
          text: message,
          senderID: user?.uid,
          sentDate: today,
        })
      ),
      concatMap(() =>
        updateDoc(chatRef, { lastMessage: message, lastMessageDate: today })
      )
    );
  }

  getChatMessages$(chatID: string): Observable<Message[]> {
    const ref = collection(this.firestore, 'chats', chatID, 'messages');
    const queryAll = query(ref, orderBy('sentDate', 'asc'));
    return collectionData(queryAll) as Observable<Message[]>;
  }

  isExistingChat(otherUserID: string): Observable<string | null> {
    return this.myChats$.pipe(
      take(1),
      map((chats) => {
        for (let i = 0; i < chats.length; i++) {
          if (chats[i].userIDs.includes(otherUserID)) {
            return chats[i].id;
          }
        }
        return null;
      })
    );
  }

  addChatNameAndPic(currentUserID: string | undefined, chats: Chat[]): Chat[] {
    chats.forEach((chat) => {
      const otherIndex =
        chat.userIDs.indexOf(currentUserID ?? '') === 0 ? 1 : 0;
      const { displayName, photoURL } = chat.users[otherIndex];
      chat.chatName = displayName;
      chat.chatPic = photoURL;
    });

    return chats;
  }
}
