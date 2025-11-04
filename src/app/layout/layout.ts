import { Component ,OnInit} from '@angular/core';
import { AuthService } from '../auth';
@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit{
    username: string = '';
constructor(private authService: AuthService,) {}

ngOnInit(): void {
    this.username = this.authService.getUsername(); 
  }

  confirmLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      this.authService.logout();
    }
  }
   isAdminUser(): boolean {
    return this.authService.getUsername() === 'admin@gmail.com';
  }
}
