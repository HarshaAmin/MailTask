public with sharing class EmailDashboardController {
  @AuraEnabled(cacheable=true)
  public static List<OutlookEmailService.Email> getEmails() {
    String userId = ApexPages.currentPage().getParameters().get('userId');
    String folder = ApexPages.currentPage().getParameters().get('folder');
    OutlookEmailService.Response resp = OutlookEmailService.getUserEmails(
      userId,
      folder
    );
    //OutlookEmailService.Response resp = OutlookEmailService.getUserEmails('Send.Tech@novigo-solutions.com');
    List<OutlookEmailService.Email> emList = new List<OutlookEmailService.Email>();
    for (OutlookEmailService.Email emT : resp.emailList) {
      OutlookEmailService.Email em = new OutlookEmailService.Email();
      em.subject = emT.subject;
      em.bodyPreview = emT.bodyPreview;
      em.sender = emT.sender;
      emList.add(em);
    }
    return emList;
    //return [SELECT Id, Subject, TextBody, FromAddress, ToAddress, CreatedDate FROM EmailMessage ORDER BY CreatedDate DESC];
  }
  @AuraEnabled(cacheable=true)
  public static List<OutlookEmailService.Email> getSentEmails() {
    String userId = ApexPages.currentPage().getParameters().get('userId');
    String folder = ApexPages.currentPage().getParameters().get('folder');
    OutlookEmailService.Response resp = OutlookEmailService.getSentEmails(
      userId,
      folder
    );
    List<OutlookEmailService.Email> emList = new List<OutlookEmailService.Email>();
    for (OutlookEmailService.Email emT : resp.emailList) {
      OutlookEmailService.Email em = new OutlookEmailService.Email();
      em.subject = emT.subject;
      em.bodyPreview = emT.bodyPreview;
      em.sender = emT.sender;
      emList.add(em);
    }
    return emList;
    //return [SELECT Id, Subject, TextBody, FromAddress, ToAddress, CreatedDate FROM EmailMessage ORDER BY CreatedDate DESC];
  }

  @AuraEnabled
  public static void sendEmail(String toEmail, String subject, String body) {
    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
    email.setToAddresses(new List<String>{ toEmail });
    email.setSubject(subject);
    email.setPlainTextBody(body);
    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });
  }
}
