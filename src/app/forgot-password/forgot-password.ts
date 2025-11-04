import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
 username = '';
  newPassword = '';
  confirmPassword = '';
  secretKey = '';
  resetCode='';
  showSecretKey = false;
  message = '';
  error = '';
showresetCode=false;
  constructor(private auth: AuthService, private router: Router,private http: HttpClient,private snackBar: MatSnackBar) {}

   resetPassword() {
    this.error = '';
    this.message = '';

    // Step 1: Validate password match
    if (!this.showSecretKey && !this.showresetCode) {
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }

      // Show secret key input next
      this.showSecretKey = true;
      this.showresetCode=true;
      return;
    }

    // Step 2: Verify secret key and reset password
    const payload = {
      username: this.username,
      newPassword: this.newPassword,
      secretKey: this.secretKey,
      resetCode:this.resetCode
    };

    this.http.post('http://localhost:3000/api/forgot-password', payload).subscribe({
      next: (res: any) => {
        this.snackBar.open('Password reset successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/']); // back to login
      },
      error: (err) => {
        this.error = err.error.message || 'Password reset failed.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }

}
