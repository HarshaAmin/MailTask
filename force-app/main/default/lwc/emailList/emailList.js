import { LightningElement, wire } from "lwc";
import getEmails from "@salesforce/apex/EmailDashboardController.getEmails";

const COLUMNS = [
  { label: "Subject", fieldName: "subject" },
  { label: "Body Preview", fieldName: "bodyPreview" }
];

export default class EmailList extends LightningElement {
  emails = [];
  columns = COLUMNS;

  // Wire the Apex method to fetch email data
  @wire(getEmails)
  wiredEmails({ error, data }) {
    if (data) {
      console.log("Emails data: ", JSON.stringify(data));
      // Directly assign the wrapper response to emails
      this.emails = data;
    } else if (error) {
      console.error("Error retrieving emails: ", error);
    }
  }

  handleRowSelection(event) {
    const selectedRows = event.detail.selectedRows;
    console.log("Selected rows:", selectedRows); // Log the selected rows
    if (selectedRows.length > 0) {
      const selectedEmail = selectedRows[0]; // Assuming one row is selected
      console.log("Selected email:", selectedEmail); // Log the selected email
      const customEvent = new CustomEvent("emailselect", {
        detail: selectedEmail
      });
      this.dispatchEvent(customEvent); // Dispatch custom event
    }
  }
}