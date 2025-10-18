import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { EditUserDialog } from './edit-user-dialog/edit-user-dialog';
import { ConfirmDialog } from './confirm-dialog/confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CryptoJS from 'crypto-js';
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {
  constructor(private authService: AuthService,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) { }
  displayedColumns: string[] = ['username', 'password', 'comments', 'action'];
  visiblePasswords: { [username: string]: boolean } = {};
  dataSource = new MatTableDataSource<any>();
  private secretKey = 'mySecretKey123';
  ngOnInit(): void {
    this.fetchUserData();
    
  }
  fetchUserData(): void {
    const dbName = this.authService.getDbName();
    this.http.get<any[]>(`http://localhost:3000/api/${dbName}/users`).subscribe(data => {
      const decryptedData = data.map(user => ({
        ...user,
        password: CryptoJS.AES.decrypt(user.password, this.secretKey).toString(CryptoJS.enc.Utf8)
      }));
      this.dataSource.data = decryptedData;

       this.dataSource.filterPredicate = (row: any, filter: string) => {
      const lowerFilter = filter.trim().toLowerCase();
      return (
        row.username.toLowerCase().includes(lowerFilter) ||
        row.comments.toLowerCase().includes(lowerFilter)
      );
    };
    });
  }
  addUser() {
    const dialogRef = this.dialog.open(EditUserDialog, {
      width: '400px',
      data: { title: 'Add User', username: '', password: '', comments: '' } // Empty data for new user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Encrypt the password before sending
        result.password = CryptoJS.AES.encrypt(result.password, this.secretKey).toString();
        const dbName = this.authService.getDbName();
        this.http.post(`http://localhost:3000/api/${dbName}/users`, result).subscribe(() => {
          this.snackBar.open('✅ User added successfully', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.ngOnInit(); // Reload table
        }, error => {
          this.snackBar.open('❌ Failed to add user', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        });
      }
    });
  }
  edit(row: any) {
    const dialogRef = this.dialog.open(EditUserDialog, {
      width: '400px',
      data: { ...row, title: 'Edit User' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.password = CryptoJS.AES.encrypt(result.password, this.secretKey).toString();
        const dbName = this.authService.getDbName();
        this.http.put(`http://localhost:3000/api/${dbName}/users/${row._id}`, result).subscribe(() => {
          this.snackBar.open('✅ User updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.ngOnInit(); // Reload the table
        }, error => {
          this.snackBar.open('❌ Failed to update user', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        });
      }
    });
  }
  delete(row: any) {
    const confirm = this.dialog.open(ConfirmDialog, {
      width: '300px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${row.username}"?`
      }
    });

    confirm.afterClosed().subscribe(result => {
      if (result === true) {
        const dbName = this.authService.getDbName();
        this.http.delete(`http://localhost:3000/api/${dbName}/users/${row._id}`).subscribe(() => {
          this.snackBar.open('✅ User deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.ngOnInit(); // Refresh table
        }, error => {
          this.snackBar.open('❌ Failed to delete user', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        });
      }
    });
  }


  togglePassword(username: string) {
    this.visiblePasswords[username] = !this.visiblePasswords[username];
  }
  getPasswordStrength(password: string): string {
  if (!password) return 'weak';

  let strength = 0;

  if (password.length >= 8) strength++; 
  if (/[A-Z]/.test(password)) strength++; 
  if (/[0-9]/.test(password)) strength++; 
  if (/[^A-Za-z0-9]/.test(password)) strength++; 

  if (strength <= 1) return 'weak';
  if (strength === 2) return 'medium';
  if (strength >= 3) return 'strong';

  return 'weak';
}
 applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
