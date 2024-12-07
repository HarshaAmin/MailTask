import { LightningElement } from "lwc";

export default class OutlookLeftPanel extends LightningElement {
  // Example folder data (you can replace this with dynamic data from Salesforce objects)
  folders = [
    { id: "1", name: "Inbox", details: "You have 50 unread messages." },
    {
      id: "2",
      name: "Sent Items",
      details: "You have sent 20 messages today."
    },
    {
      id: "3",
      name: "Drafts",
      details: "You have 5 drafts waiting to be sent."
    },
    {
      id: "4",
      name: "Deleted",
      details: "You have deleted 10 messages this week."
    }
  ];

  // Default selected folder
  selectedFolder = { name: "", details: "" };

  // Handle folder click and update the right panel
  handleFolderClick(event) {
    event.preventDefault();
    const folderId = event.target.dataset.id;

    // Find the selected folder from the folder list
    this.selectedFolder = this.folders.find(
      (folder) => folder.id === folderId
    ) || { name: "", details: "" };
  }
}