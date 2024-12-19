import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  private emojiPickerVisible = new BehaviorSubject<boolean>(false); // Manage visibility of emoji picker
  private selectedEmoji = new BehaviorSubject<string>(''); // Store selected emoji

  constructor() {}

  // Getter to check if emoji picker is visible
  get isEmojiPickerVisible() {
    return this.emojiPickerVisible.asObservable();
  }

  // Getter to get selected emoji
  get selectedEmoji$() {
    return this.selectedEmoji.asObservable();
  }

  // Toggle visibility of the emoji picker
  toggleEmojiPicker() {
    this.emojiPickerVisible.next(!this.emojiPickerVisible.value);
    console.log('Toggling emoji picker...');
  }

  // Method to select an emoji
  selectEmoji(emoji: string) {
    this.selectedEmoji.next(emoji); // Update selected emoji
    this.toggleEmojiPicker(); // Optionally close the picker after selection
    console.log(`Selected emoji: ${emoji}`);
  }

  // Method to clear selected emoji (if needed)
  clearEmoji() {
    this.selectedEmoji.next('');
    console.log('Cleared selected emoji.');
  }
}
