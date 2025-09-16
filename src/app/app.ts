import { Component, signal } from '@angular/core';
// import { AuthService } from '../auth';
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('password-manager');
}
