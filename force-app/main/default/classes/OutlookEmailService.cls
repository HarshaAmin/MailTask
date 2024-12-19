public class OutlookEmailService {
  // Custom Exception for errors
  public class CustomException extends Exception {
  }

  // Response class to wrap email data
  public class Response {
    @AuraEnabled
    public List<Email> emailList;

    public Response() {
      emailList = new List<Email>();
    }
  }

  // Email class to represent an individual email
  public class Email {
    @AuraEnabled
    public String subject;
    @AuraEnabled
    public String sender;
    @AuraEnabled
    public String bodyPreview;
    @AuraEnabled
    public String receivedDateTime;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String Id;
    @AuraEnabled
    public Boolean isRead;
    @AuraEnabled
    public String flagStatus;
    @AuraEnabled
    public List<String> categories;
  }

  public class CategorizationResponse {
    public String category;
  }

  // Static method to get the Access Token
  public static String getAccessToken() {
    //  String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';  // Replace with your Client ID
    // String clientSecret = 'zeR8Q~smEpXz2F4n9YyU8MhLnZ4R~aSupCNMOdsu';  // Replace with your Client Secret
    // String tenantId = 'd25e697e-9987-4146-87ba-800be6fd457c';  // Replace with your Azure Tenant ID
    String clientId = ''; // Replace with your Client ID
    String clientSecret = ''; // Replace with your Client Secret
    String tenantId = ''; // Replace with your Azure Tenant ID
    String tokenEndpoint =
      'https://login.microsoftonline.com/' +
      tenantId +
      '/oauth2/v2.0/token';
    String body =
      'client_id=' +
      clientId +
      '&scope=https://graph.microsoft.com/.default' + // Using .default scope for app permissions
      '&client_secret=' +
      clientSecret +
      '&grant_type=client_credentials';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(tokenEndpoint);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setBody(body);

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() == 200) {
      Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      return (String) response.get('access_token');
    } else {
      throw new CustomException(
        'Error fetching access token: ' + res.getBody()
      );
    }
  }

  @AuraEnabled(cacheable=true)
  public static Object updateEmails(String messageId, String requestBody) {
    Response resp = new Response();
    String accessToken = getAccessToken();

    String endpoint =
      'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/messages/' +
      messageId;
    //String endpoint = 'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/messages/' + messageId;

    // String endpoint =
    //   'https://graph.microsoft.com/v1.0/user/Send.Tech@novigo-solutions.com/messages/' + messageId;
    // String endpoint =
    //   'https://graph.microsoft.com/v1.0/users/' +
    //   userId +
    //   '/messages';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(endpoint);
    req.setMethod('PATCH');
    req.setHeader('Authorization', 'Bearer ' + accessToken);
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Accept', 'application/json');
    req.setBody(requestBody);

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() != 200) {
      throw new CustomException('Email updated successfully: ' + res.getBody());
    }
    return res.getBody();
  }

  @AuraEnabled(cacheable=true)
  public static Response getSentEmails(String userId, String folder) {
    Response resp = new Response();
    String accessToken = getAccessToken();

    String endpoint =
      'https://graph.microsoft.com/v1.0/users/' +
      userId +
      '/mailFolders/' +
      folder +
      '/messages';
    // String endpoint =
    //   'https://graph.microsoft.com/v1.0/users/' +
    //   userId +
    //   '/messages';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(endpoint);
    req.setMethod('GET');
    req.setHeader('Authorization', 'Bearer ' + accessToken);
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Accept', 'application/json');

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() != 200) {
      throw new CustomException('Error fetching emails: ' + res.getBody());
    }

    Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(
      res.getBody()
    );
    List<Object> messages = (List<Object>) responseBody.get('value');

    List<Email> emailList = new List<Email>();

    for (Object msg : messages) {
      Map<String, Object> msgMap = (Map<String, Object>) msg;

      Email email = new Email();
      email.subject = (String) msgMap.get('subject');

      Map<String, Object> sender = (Map<String, Object>) msgMap.get('sender');
      if (!folder.equalsIgnoreCase('Drafts')) {
        email.sender = (String) ((Map<String, Object>) sender.get(
            'emailAddress'
          ))
          .get('address');
      }
      email.bodyPreview = (String) msgMap.get('bodyPreview');
      email.receivedDateTime = (String) msgMap.get('receivedDateTime');
      email.status = msgMap.get('isRead') == true ? 'read' : 'unread';
      email.Id = (String) msgMap.get('id');
      Object isReadObject = msgMap.get('isRead');
      if (isReadObject instanceof Boolean) {
        email.isRead = (Boolean) isReadObject;
      } else {
        email.isRead = false; // Default value
      }

      Object flagObject = msgMap.get('flag');
      if (flagObject instanceof Map<String, Object>) {
        Map<String, Object> flagMap = (Map<String, Object>) flagObject;
        email.flagStatus = (String) flagMap.get('flagStatus'); // Extract the flag status
      } else {
        // Handle error or invalid case
        System.debug('Invalid flag data');
      }

      // Object categoriesObject = msgMap.get('categories');
      // if (categoriesObject instanceof List<Object>) {
      //   // Cast the categoriesObject to a List of Object
      //   List<Object> categoriesList = (List<Object>) categoriesObject;
      //   email.categories = categoriesList;
      // } else {
      //   // Handle error or invalid categoriesObject case
      //   System.debug('Invalid categories data, categoriesObject is not a List');
      // }

      //email.isRead = (Boolean) msgMap.get('isRead');

      emailList.add(email);
      //email.flagStatus = msgMap.get('flagStatus')==true?'Flagged':'Not Flagged';
      //email.id = (String) msgMap.get('id');
      // email.isRead: string,
      // email.isFlagged: string,
      // email.isPinged: string,
    }

    resp.emailList = emailList;
    return resp;
  }

  // // Method to fetch emails for a user
  // @AuraEnabled(cacheable=true)
  // public static Response getUserEmails(
  //   String userId,
  //   String folder,
  //   String action
  // ) {
  //   Response resp = new Response();
  //   String accessToken = getAccessToken();

  //   // String endpoint =
  //   //   'https://graph.microsoft.com/v1.0/users/' +
  //   //   userId +
  //   //   '/messages';

  //   String endpoint =
  //     'https://graph.microsoft.com/v1.0/users/' +
  //     userId +
  //     '/mailFolders/' +
  //     folder +
  //     '/messages';

  //   HttpRequest req = new HttpRequest();
  //   req.setEndpoint(endpoint);
  //   req.setMethod('GET');
  //   req.setHeader('Authorization', 'Bearer ' + accessToken);
  //   req.setHeader('Content-Type', 'application/json');
  //   req.setHeader('Accept', 'application/json');

  //   Http http = new Http();
  //   HttpResponse res = http.send(req);

  //   if (res.getStatusCode() != 200) {
  //     throw new CustomException('Error fetching emails: ' + res.getBody());
  //   }

  //   Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(
  //     res.getBody()
  //   );
  //   List<Object> messages = (List<Object>) responseBody.get('value');

  //   List<Email> emailList = new List<Email>();

  //   for (Object msg : messages) {
  //     Map<String, Object> msgMap = (Map<String, Object>) msg;

  //     Email email = new Email();
  //     email.subject = (String) msgMap.get('subject');

  //     Map<String, Object> sender = (Map<String, Object>) msgMap.get('sender');
  //     email.sender = (String) ((Map<String, Object>) sender.get('emailAddress'))
  //       .get('address');

  //     email.bodyPreview = (String) msgMap.get('bodyPreview');
  //     email.receivedDateTime = (String) msgMap.get('receivedDateTime');
  //     email.status = msgMap.get('isRead') == true ? 'read' : 'unread';
  //     //email.flagStatus = msgMap.get('flagStatus')==true?'Flagged':'Not Flagged';
  //     email.Id = (String) msgMap.get('id');
  //     String isReadString = (String) msgMap.get('isRead');
  //     email.isRead = (isReadString != null && isReadString.toLowerCase() == 'true');
  //     email.isFlagged = '';
  //     email.isPinged = '';

  //     emailList.add(email);
  //   }

  //   resp.emailList = emailList;
  //   return resp;
  // }

  @future(callout=true)
  public static void categorizeEmailsAsync(String emailsJson) {
    String API_URL = 'https://api-inference.huggingface.co/models/bert-base-uncased'; // Hugging Face API endpoint
    // Deserialize the JSON string into a list of EmailData objects
    List<EmailData> emails = (List<EmailData>) JSON.deserialize(
      emailsJson,
      List<EmailData>.class
    );

    // Create an array of inputs to send in a single API request
    List<String> emailContents = new List<String>();
    for (EmailData email : emails) {
      emailContents.add(email.subject + ' ' + email.body); // Concatenate subject and body
    }

    // Prepare the request body with an array of emails
    String requestBody = '{"inputs": ' + JSON.serialize(emailContents) + '}';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(API_URL);
    req.setMethod('POST');
    req.setHeader(
      'Authorization',
      'Bearer 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'
    );
    req.setHeader('Content-Type', 'application/json');
    req.setBody(requestBody);

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() == 200) {
      // Process the response for each email in the batch
      List<String> categories = (List<String>) JSON.deserialize(
        res.getBody(),
        List<String>.class
      );
      sendCategorizationResultsToCallbackEndpoint(categories);
      for (Integer i = 0; i < categories.size(); i++) {
        System.debug(
          'Email ' + emails[i].subject + ' Category: ' + categories[i]
        );
      }
    } else {
      System.debug('Error in Categorization: ' + res.getStatusCode());
    }
  }

  public static void sendCategorizationResultsToCallbackEndpoint(
    List<String> categories
  ) {
    // Send the results to a callback endpoint
    HttpRequest req = new HttpRequest();
    req.setEndpoint(
      'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/api/categorization-results'
    );
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(categories));

    Http http = new Http();
    HttpResponse res = http.send(req);
  }
}
