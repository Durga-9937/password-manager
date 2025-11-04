import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['username', 'dbName'];
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }
  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    this.http.get('http://localhost:3000/api/admin').subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Failed to load users.', 'Close', { duration: 3000 });
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
