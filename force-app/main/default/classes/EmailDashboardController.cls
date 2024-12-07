public with sharing class EmailDashboardController {
    @AuraEnabled(cacheable=true)
    public static List<OutlookEmailService.Email> getEmails() {
        OutlookEmailService.Response resp = OutlookEmailService.getUserEmails('Send.Tech@novigo-solutions.com');
        List<OutlookEmailService.Email> emList = new List<OutlookEmailService.Email>();
        for(OutlookEmailService.Email emT : resp.emailList ){
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
        email.setToAddresses(new String[] { toEmail });
        email.setSubject(subject);
        email.setPlainTextBody(body);
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });
    }
}