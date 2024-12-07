import { LightningElement, track } from "lwc";
import sendEmail from "@salesforce/apex/EmailDashboardController.sendEmail";

export default class ComposeEmail extends LightningElement {
  @track toEmail = "";
  @track subject = "";
  @track body = "";

  handleInputChange(event) {
    const field = event.target.label.toLowerCase();
    this[field] = event.target.value;
  }

  sendEmail() {
    sendEmail({ toEmail: this.toEmail, subject: this.subject, body: this.body })
      .then(() => {
        this.dispatchEvent(new CustomEvent("emailsent"));
        this.toEmail = "";
        this.subject = "";
        this.body = "";
      })
      .catch((error) => console.error(error));
  }
}