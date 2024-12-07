import { LightningElement } from "lwc";

export default class DynamicFolderPanel extends LightningElement {
  // List of folders (you can fetch from an API or hard-code them)
  folders = [
    { id: 1, name: "Inbox", details: "All your incoming emails are here." },
    { id: 2, name: "Sent", details: "Emails that you have sent." },
    {
      id: 3,
      name: "Drafts",
      details: "Emails you have started but not sent yet."
    }
  ];

  // Selected folder object (default to Inbox)
  selectedFolder = {
    id: 1,
    name: "Inbox",
    details: "All your incoming emails are here."
  };

  // State to show Compose Email or not
  showComposeEmail = false;

  // Selected email object
  selectedEmail = null;

  // Handle folder click
  handleFolderClick(event) {
    const folderId = event.target.dataset.id;
    this.selectedFolder = this.folders.find(
      (folder) => folder.id === parseInt(folderId)
    );
    this.selectedEmail = null; // Reset selected email
    console.log("Folder selected:", this.selectedFolder);
  }

  // Handle Compose Email button click
  handleComposeClick() {
    this.showComposeEmail = true;
  }

  // Handle close of Compose Email form
  handleCloseCompose() {
    this.showComposeEmail = false;
  }

  // Handle email selection
  handleEmailSelect(event) {
    const emailId = event.detail.emailId;
    this.selectedEmail = event.detail;
    console.log("Email selected:", this.selectedEmail);
  }

  // Example function to get email by ID (replace with actual logic)
  getEmailById(emailId) {
    // You can fetch the email details from your backend or use a dummy object
    return {
      id: emailId,
      subject: "Sample Email",
      body: "This is a sample email body."
    };
  }
}