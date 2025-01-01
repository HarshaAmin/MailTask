@RestResource(urlMapping='/api/parse-emails')
global with sharing class EmailCategorizationEndpoint {
  @HttpPost
  global static String categorizeEmails() {
    RestRequest req = RestContext.request;
    String requestBody = RestContext.request.requestBody.toString();

    // Extract parameters
    List<EmailData> emails = (List<EmailData>) JSON.deserialize(
      requestBody,
      List<EmailData>.class
    );

    // Serialize the list of emails into a JSON string
    String emailsJson = JSON.serialize(emails);

    // Call the future method with the JSON string
    OutlookEmailService.categorizeEmailsAsync(emailsJson);

    return 'Processing emails for categorization';
  }
}
