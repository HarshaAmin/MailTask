import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component'; // Ensure the correct path
import { HttpClientModule } from '@angular/common/http'; 
import { SalesforceService } from '../services/salesforce.service'; // Correct path to your service
import { FormsModule } from '@angular/forms'; // <-- Add this import

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,HttpClientModule,FormsModule],
  providers: [SalesforceService],
  bootstrap: [AppComponent]
})
export class AppModule {}
