@RestResource(urlMapping='/OutlookForwardEmailService/*')
global with sharing class OutlookEmailFeatureServiceRest {
  
  @HttpPost
  global static ResponseWrapper forwardEmail() {
    RestRequest reqContext = RestContext.request;
    ResponseWrapper responseWrapper;

    try {

      String requestBody = reqContext.requestBody.toString();
        System.debug('requestBody '+requestBody);
      // Deserialize the JSON body into a Map
      Map<String, Object> params = (Map<String, Object>) JSON.deserializeUntyped(
        requestBody
      );
        System.debug('requestBody '+requestBody);
      // Extract parameters
      String emailId = (String) params.get('emailId');
      emailId = EncodingUtil.urlDecode(emailId, 'UTF-8'); // Decode URL

      // Validate emailId
      if (String.isBlank(emailId)) {
        throw new IllegalArgumentException('Email ID cannot be null or empty.');
      }

      String toRecipientsData = (String) params.get('toRecipients');
      
    //     System.debug('emailId '+emailId);
    //     System.debug('toRecipients '+toRecipients);
      // Fetch access token
      String accessToken = OutlookEmailService.getAccessToken();
      if (String.isBlank(accessToken)) {
        //throw new Exception('Access token is missing or invalid.');
      }

      // Construct API endpoint
      String endpoint =
        'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/messages/' +
        emailId+'/forward';

    
//   String emailAddresses = 'sanathshetty986@gmail.com;harshaamin099@gmail.com;rachelchalet99@gmail.com';

// Split the email addresses by semicolon
List<String> emailList = toRecipientsData.split(';');

// Create the structure for the Graph API request
Map<String, Object> message = new Map<String, Object>{
    'toRecipients' => new List<Object>()
};

// Loop through the list of email addresses and add them to the 'toRecipients' array
for (String email : emailList) {
    Map<String, Object> recipient = new Map<String, Object>{
        'emailAddress' => new Map<String, Object>{ 'address' => email }
    };
    List<Object> toRecipients = (List<Object>)message.get('toRecipients');
    toRecipients.add(recipient); 
}

HttpRequest req = new HttpRequest();
req.setEndpoint(endpoint); // Replace with the actual Graph API endpoint
req.setMethod('POST');
req.setHeader('Authorization', 'Bearer ' + accessToken);
req.setHeader('Content-Type', 'application/json');
req.setBody(JSON.serialize(message));

// Send the HTTP request
Http http = new Http();
HttpResponse res = http.send(req);

// Debug the response (if necessary)
System.debug('Response: ' + res.getBody());


      // Process the response
      if (res.getStatusCode() == 202) {
        // No Content
        System.debug('Email forwarded successfully.');
        responseWrapper = new ResponseWrapper(
          'Success',
          null,
          res.getStatusCode(),
          'Email forwarded successfully.'
        );
      } else {
        System.debug('Failed to forward email. Response: ' + res.getBody());
        responseWrapper = new ResponseWrapper(
          'Failure',
          null,
          res.getStatusCode(),
          res.getBody()
        );
      }
    } catch (IllegalArgumentException e) {
      System.debug('Invalid input: ' + e.getMessage());
      return createErrorResponse(e.getMessage(), 400);
    } catch (Exception e) {
      System.debug('Error forward email: ' + e.getMessage());
      return createErrorResponse(
        'Error deleting email: ' + e.getMessage(),
        500
      );
    }

    return responseWrapper;
  }


  // Helper method to create error responses
  private static ResponseWrapper createErrorResponse(
    String errorMessage,
    Integer statusCode
  ) {
    return new ResponseWrapper('error ', null, statusCode, errorMessage);
  }
}
