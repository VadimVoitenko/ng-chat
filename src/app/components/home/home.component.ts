import { UsersService } from 'src/app/services/users.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { ProfileUser } from 'src/app/models/user-profile';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChild('endOfChat')
  endOfChat!: ElementRef;

  user$ = this.usersService.currentUserProfile$;

  searchControl = new FormControl('');
  chatListControl = new FormControl();
  messageControl = new FormControl('');

  users$ = combineLatest([
    this.usersService.allUsers$,
    this.user$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([users, user, searchString]) =>
      users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchString.toLowerCase()) &&
          u.uid !== user?.uid
      )
    )
  );

  myChats$ = this.chatService.myChats$;

  selectedChat$ = combineLatest([
    this.chatListControl.valueChanges,
    this.myChats$,
  ]).pipe(map(([value, chats]) => chats.find((c) => c.id === value[0])));

  messages$ = this.chatListControl.valueChanges.pipe(
    map((value) => value[0]),
    switchMap((chatID) => this.chatService.getChatMessages$(chatID)),
    tap(() => {
      this.scrollToBottom();
    })
  );

  constructor(
    private usersService: UsersService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {}

  createChat(otherUser: ProfileUser) {
    this.chatService
      .isExistingChat(otherUser?.uid)
      .pipe(
        switchMap((chatID) => {
          if (chatID) {
            return of(chatID);
          } else {
            return this.chatService.createChat(otherUser);
          }
        })
      )
      .subscribe((chatID) => {
        this.chatListControl.setValue([chatID]);
      });
  }

  sendMessage() {
    const message = this.messageControl.value;
    const selectedChatID = this.chatListControl.value[0];

    if (message && selectedChatID) {
      this.chatService.addChatMessage(selectedChatID, message).subscribe(() => {
        this.scrollToBottom();
      });
      this.messageControl.setValue('');
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.endOfChat) {
        this.endOfChat.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
}
