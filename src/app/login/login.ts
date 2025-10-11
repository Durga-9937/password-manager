import { Component } from '@angular/core';
import { AuthService } from '../auth';
import { Router } from '@angular/router';
interface LoginResponse {
  dbName: string;
  username: string;
  // Add more if needed
}
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
    username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService,private router: Router) {}
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  login() {
     if (!this.isValidEmail(this.username)) {
      this.error = 'Please enter a valid email address';
      return;
    }
    this.auth.login({ username: this.username, password: this.password }).subscribe({
    next: (res: {dbName: string }) => {
      this.auth.loginSuccess(this.username,res.dbName);
      this.auth.setLoginState(true);
      this.auth.redirectToDashboard();
      
    },
      error: err => this.error = err.error.message
    });
  }
   goToSignup() {
    this.router.navigate(['/signup']);
  }
}
