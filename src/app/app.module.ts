import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { HomeComponent } from './home/home.component';
import { BlogComponent } from './blog/blog.component';
import { ContactComponent } from './contact/contact.component';

const Routs: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'contact', component: ContactComponent }
];

@NgModule({
  imports: [BrowserModule, FormsModule, RouterModule.forRoot(Routs)],
  declarations: [
    AppComponent,
    HelloComponent,
    HomeComponent,
    BlogComponent,
    ContactComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
