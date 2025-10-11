import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { HttpClientModule ,provideHttpClient, withFetch } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { App } from './app';
import { FormsModule } from '@angular/forms';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { EditUserDialog } from './dashboard/edit-user-dialog/edit-user-dialog';
import { ConfirmDialog } from './dashboard/confirm-dialog/confirm-dialog';
import { Signup } from './signup/signup';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { Layout } from './layout/layout';
import { Generate } from './generate/generate';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Admin } from './admin/admin';

@NgModule({
  declarations: [
    App,
    Login,
    Dashboard,
    EditUserDialog,
    ConfirmDialog,
    Signup,
    Layout,
    Generate,
    Admin,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
      FormsModule ,
      HttpClientModule,
      MatIconModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatTableModule,
      MatDialogModule,
      MatSnackBarModule,
      MatCardModule,
      MatToolbarModule,
      MatSidenavModule,
      MatListModule,
      MatCheckboxModule,
      MatTooltipModule,
      
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
     provideHttpClient(withFetch()) 
  ],
  bootstrap: [App]
})
export class AppModule { }
