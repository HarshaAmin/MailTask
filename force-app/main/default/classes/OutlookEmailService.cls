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
  }

  // Static method to get the Access Token
  private static String getAccessToken() {
    String clientId = ''; // Replace with your Client ID
    String clientSecret = ''; // Replace with your Client Secret
    String tenantId = ''; // Replace with your Azure Tenant ID
    // String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';  // Replace with your Client ID
    // String clientSecret = 'zeR8Q~smEpXz2F4n9YyU8MhLnZ4R~aSupCNMOdsu';  // Replace with your Client Secret
    // String tenantId = 'd25e697e-9987-4146-87ba-800be6fd457c';  // Replace with your Azure Tenant ID
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

  // Method to fetch emails for a user
  @AuraEnabled(cacheable=true)
  public static Response getUserEmails(String userId) {
    Response resp = new Response();
    String accessToken = getAccessToken();

    String endpoint =
      'https://graph.microsoft.com/v1.0/users/' +
      userId +
      '/messages';

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
      email.sender = (String) ((Map<String, Object>) sender.get('emailAddress'))
        .get('address');

      email.bodyPreview = (String) msgMap.get('bodyPreview');
      email.receivedDateTime = (String) msgMap.get('receivedDateTime');

      emailList.add(email);
    }

    resp.emailList = emailList;
    return resp;
  }
}
