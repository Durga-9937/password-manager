import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})

export class Signup {
username = '';
  password = '';
  confirmPassword = '';
  error = '';

   constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar ) {}

    private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  signUp() {
    this.error = '';  
     if (!this.isValidEmail(this.username)) {
      this.error = 'Please enter a valid email address';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    this.http.post('http://localhost:3000/api/signup', {
      username: this.username,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (res: any) => {
        this.snackBar.open('Signup successful!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // ✅ Clear form fields
        this.username = '';
        this.password = '';
        this.confirmPassword = '';

        // ✅ Redirect to login
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error.message || "Signup failed.";
        // this.snackBar.open(this.error, 'Close', {
        //   duration: 3000,
        //   panelClass: ['error-snackbar']
        // });
      }
    });
  }
}
