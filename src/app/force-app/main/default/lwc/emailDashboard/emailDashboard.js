import { LightningElement, track } from "lwc";

export default class EmailDashboard extends LightningElement {
  // Track the selected email
  @track selectedEmail = null;

  // Handle email selection (update the selectedEmail state)
  handleEmailSelect(event) {
    console.log("Email selected:", event.detail); // Log the email details received from the custom event
    this.selectedEmail = event.detail; // Store the selected email in the tracked variable
  }

  // Handle email sent action
  handleEmailSent(event) {
    console.log("Email sent:", event.detail); // Log email sent details, could be useful for debugging or UI updates
    // If you need to refresh the email list or perform additional actions after sending an email:
    // You can update the list of emails or perform other state changes here if needed.
  }
}