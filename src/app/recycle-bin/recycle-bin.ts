import { Component,OnInit  } from '@angular/core';
import { AuthService } from '../auth';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialog } from '../dashboard/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-recycle-bin',
  standalone: false,
  templateUrl: './recycle-bin.html',
  styleUrl: './recycle-bin.css'
})
export class RecycleBin implements OnInit{
  displayedColumns: string[] = ['username', 'comments', 'deletedAt', 'action'];
  dataSource = new MatTableDataSource<any>();
constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar,
     private dialog: MatDialog,
  ) {}
  
  ngOnInit(): void {
    this.loadDeletedUsers();
  }

  loadDeletedUsers() {
  const dbName = this.authService.getDbName();
  this.http.get<any[]>(`http://localhost:3000/api/${dbName}/deleted_users`)
    .subscribe(data => {
      this.dataSource.data = data;
    });
}

  restoreUser(row: any) {
  const dbName = this.authService.getDbName();
  this.http.post(`http://localhost:3000/api/${dbName}/restore/${row._id}`, {})
    .subscribe(() => {
      this.snackBar.open('✅ User restored successfully', 'Close', { duration: 3000 });
      this.loadDeletedUsers();
    }, error => {
      this.snackBar.open('❌ Failed to restore user', 'Close', { duration: 3000 });
    });
}
deletePermanently(row: any) {
  const confirm = this.dialog.open(ConfirmDialog, {
    width: '300px',
    data: {
      title: 'Permanently Delete User',
      message: `Are you sure you want to permanently delete user "${row.username}"? This action cannot be undone.`
    }
  });

  confirm.afterClosed().subscribe(result => {
    if (result === true) {
      const dbName = this.authService.getDbName();
      this.http.delete(`http://localhost:3000/api/${dbName}/deleted_users/${row._id}`)
        .subscribe(() => {
          this.snackBar.open('🗑️ User permanently deleted', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.loadDeletedUsers(); // Refresh recycle bin table
        }, error => {
          this.snackBar.open('❌ Failed to permanently delete user', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        });
    }
  });
}
}
