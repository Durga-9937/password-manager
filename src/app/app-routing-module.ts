import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth-guard';
import { Layout } from './layout/layout';
import { Generate } from './generate/generate';
import { Admin} from'./admin/admin';
const routes: Routes = [
   { path: '', component: Login },
    { path: 'signup', component: Signup },
  // { path: 'dashboard', component: Dashboard ,canActivate: [AuthGuard]}
  {
    path: '',
    component: Layout,
    canActivate: [AuthGuard],  
    children: [
       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'generate', component: Generate },
      {path:'admin',component:Admin},
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
