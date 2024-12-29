import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component'; // Ensure the correct path
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Ensure this is imported
import { SalesforceService } from '../services/salesforce.service'; // Correct path to your service
import { FormsModule } from '@angular/forms'; // <-- Add this import
import { QuillModule } from 'ngx-quill';
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    CommonModule, // Ensure CommonModule is here for ngClass
    QuillModule.forRoot()
  ],
  providers: [SalesforceService],
  bootstrap: [AppComponent]
})
export class AppModule {}
