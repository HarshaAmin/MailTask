import { LightningElement, wire } from 'lwc';
import getUserEmails from '@salesforce/apex/OutlookEmailService.getUserEmails';

export default class OutlookDashboard extends LightningElement {
    userId = 'Send.Tech@novigo-solutions.com';  // User ID for fetching emails
    emails = [];
    selectedEmail = null;

    // Fetch emails from Apex
    @wire(getUserEmails, { userId: 'Send.Tech@novigo-solutions.com' })
wiredEmails({ error, data }) {
    if (data) {
        console.log('Fetched emails:', data.emailList);  // Accessing emailList from the Response
        this.emails = data.emailList;  // Assigning to emails array
        console.log('Emails length:', this.emails.length);
        console.log('Emails data:', JSON.stringify(this.emails));  // Log the actual data structure
    } else if (error) {
        console.error("Error fetching emails: ", error);
    }
}


    // Handle email click event to show email details
    handleEmailClick(event) {
        console.log('Email clicked:', event.target.dataset.subject);  // Log clicked email data
        const emailSubject = event.target.dataset.subject;
        this.selectedEmail = this.emails.find(email => email.subject === emailSubject);
        console.log('Selected email:', this.selectedEmail);

        // Dynamically render the email body HTML in the preview section
        const emailBodyContainer = this.template.querySelector('.email-body');
        if (emailBodyContainer && this.selectedEmail) {
            emailBodyContainer.innerHTML = this.selectedEmail.bodyPreview;  // Insert the email body preview
        }
    }
}
