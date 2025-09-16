import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService  {
   private isLoggedIn = false;
   private dbName: string = '';
     private username: string = ''; 
  constructor(private http: HttpClient, private router: Router) { const storedDb = localStorage.getItem('dbName');
    const storedUser = localStorage.getItem('username');
    const storedAuth = localStorage.getItem('auth');

    if (storedDb) this.dbName = storedDb;
    if (storedUser) this.username = storedUser;
    if (storedAuth === 'true') this.isLoggedIn = true;}

  // login(credentials: any) {
  //   return this.http.post('http://localhost:3000/api/login', credentials);
  // }
   login(data: { username: string; password: string }): Observable<{ dbName: string }> {
    return this.http.post<{ message: string; dbName: string }>('http://localhost:3000/api/login', data);
  }

  setDbName(name: string): void {
    this.dbName = name;
    localStorage.setItem('dbName', name);
  }

  getDbName(): string {
     return this.dbName || localStorage.getItem('dbName') || '';
  }
   setUsername(name: string): void {
    this.username = name;
    localStorage.setItem('username', name); 
  }

  getUsername(): string {
    return this.username || localStorage.getItem('username') || '';
  }
   setLoginState(state: boolean) {
    this.isLoggedIn = state;
  }

  isUserLoggedIn(): boolean {
    return this.isLoggedIn;
  }
  loginSuccess(username: string ,dbName: string) {
   this.isLoggedIn = true;

     this.setUsername(username);
      this.setDbName(dbName);
    localStorage.setItem('auth', 'true'); 
  }
  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem('auth'); 
    localStorage.removeItem('username');
    localStorage.removeItem('dbName')
    this.router.navigate(['/'],);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn || !!localStorage.getItem('auth');
  }
  redirectToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
