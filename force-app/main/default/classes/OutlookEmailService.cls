public class OutlookEmailService {

    public class CustomException extends Exception {}

    public class Email {
        public String subject;
        public String sender;
        public String bodyPreview;
        public String receivedDateTime;
    }

    // Method to get the access token (OAuth 2.0 with Application Flow)
    public static String getAccessToken() {
    String clientId = 'clientId';  // Replace with your Client ID
        String clientSecret = 'clientSecret';  // Replace with your Client Secret
        String tenantId = 'tenantId';  // Replace with your Azure Tenant ID

        String tokenEndpoint = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token';
        String body = 'client_id=' + clientId +
                      '&scope=https://graph.microsoft.com/.default' + // Using .default scope for app permissions
                      '&client_secret=' + clientSecret +
                      '&grant_type=client_credentials';

        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenEndpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody(body);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            String accessToken = (String) response.get('access_token');
            return accessToken;
        } else {
            throw new CustomException('Error fetching access token: ' + res.getBody());
        }
    }

    // Method to fetch emails from a specific user's inbox
    public static List<Email> getUserEmails(String userId) {
        String accessToken = getAccessToken();

        // Set the endpoint to fetch emails from a specific user's inbox
        String endpoint = 'https://graph.microsoft.com/v1.0/users/' + userId + '/messages'; 

      HttpRequest req = new HttpRequest();
    req.setEndpoint(endpoint);
req.setMethod('GET');
req.setHeader('Authorization', 'Bearer ' + accessToken);
req.setHeader('Content-Type', 'application/json');
req.setHeader('Accept', 'application/json');  // Ensure Accept header is set to application/json

Http http = new Http();
HttpResponse res = http.send(req);

// Log the response for debugging
System.debug('Graph API Response: ' + res.getBody());
        if (res.getStatusCode() != 200) {
            throw new CustomException('Error fetching emails: ' + res.getBody());
        }

        Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> messages = (List<Object>) responseBody.get('value');
        ReadEmailDTO parsedData = ReadEmailDTO.parse(res.getBody());
        for(ReadEmailDTO.cls_value valueData : parsedData .value){
            ReadEmailDTO.cls_body bodyData = valueData.body;
                        System.debug('Email subject'+valueData.subject);
            System.debug('Email sender'+valueData.sender );
            System.debug('Email emailFrom'+valueData.emailFrom );
            System.debug('Email toRecipients'+valueData.toRecipients );
            System.debug('Email ccRecipients'+valueData.ccRecipients );
            System.debug('Email bccRecipients'+valueData.bccRecipients );
            System.debug('Email replyTo'+valueData );
        }
        System.debug('Email data '+parsedData );
        List<Email> emailList = new List<Email>();
        for (Object msg : messages) {
System.debug('Message is '+msg);
//            Email email = new Email();
          //  email.subject = (String) msg.subject;
/*            Map<String, Object> sender = (Map<String, Object>) msg.get('sender');
            email.sender = (String) ((Map<String, Object>) sender.get('emailAddress')).get('address');
            email.bodyPreview = (String) msg.get('bodyPreview');
            email.receivedDateTime = (String) msg.get('receivedDateTime');*/
            //emailList.add(email);
        }

        return emailList;
    }

    // Example method to run and log the results
    public static void run() {
        // Example userId (replace with actual user ID or email address)
        String userId = 'Send.Tech@novigo-solutions.com'; // Replace with the user’s email or GUID

        try {
            List<Email> emails = getUserEmails(userId);
            System.debug('Emails fetched: ' + emails);
        } catch (CustomException e) {
            System.debug('Error: ' + e.getMessage());
        }
    }
}