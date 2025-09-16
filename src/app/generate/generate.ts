import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-generate',
  standalone: false,
  templateUrl: './generate.html',
  styleUrl: './generate.css'
})
export class Generate {
 length: number = 12;
  includeLetters: boolean = true;
  includeNumbers: boolean = true;
  includeSpecial: boolean = true;
  generatedPassword: string = '';

  letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  numbers = '0123456789';
  special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  constructor(private snackBar: MatSnackBar) {}

  generatePassword() {
    let charset = '';
    if (this.includeLetters) charset += this.letters;
    if (this.includeNumbers) charset += this.numbers;
    if (this.includeSpecial) charset += this.special;

    if (!charset) {
      this.snackBar.open('⚠️ Select at least one option!', 'Close', { duration: 3000 });
      return;
    }

    let password = '';
    for (let i = 0; i < this.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    this.generatedPassword = password;
  }

  clearPassword() {
    this.generatedPassword = '';
  }

  copyPassword() {
    navigator.clipboard.writeText(this.generatedPassword).then(() => {
      this.snackBar.open('✅ Password copied!', 'Close', { duration: 2000 });
    });
  }
}
