@RestResource(urlMapping='/OutlookEmailReplyEmailService/*')
global with sharing class OutlookEmailReplyServiceRest {
  // Helper method to get access token
  private static String getAccessToken() {
    String accessToken = OutlookEmailService.getAccessToken();
    if (String.isBlank(accessToken)) {
      //throw new Exception('Access token is missing or invalid.');
    }
    return accessToken;
  }

  // POST method to reply to an email
  @HttpPost
  global static String replyToEmail() {
    HttpResponse res = new HttpResponse();
    RestRequest reqContext = RestContext.request;
    try {
      String requestBody = reqContext.requestBody.toString();
      System.debug('requestBody ' + requestBody);
      Map<String, Object> params = (Map<String, Object>) JSON.deserializeUntyped(
        requestBody
      );

      String toAddress = (String) params.get('to');
      String subject = (String) params.get('subject');
      String bodyContent = (String) params.get('body');
      String reSubject = (String) params.get('reSubject');
      String contentType = (String) params.get('contentType');
      String content = (String) params.get('content');
      String selectedEmailId = (String) params.get('selectedEmailId');

      String accessToken = OutlookEmailService.getAccessToken();
      String endpoint =
        'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/messages/' +
        selectedEmailId +
        '/reply';
      Map<String, Object> message = new Map<String, Object>{
        'subject' => reSubject,
        'body' => new Map<String, Object>{
          'contentType' => 'html',
          'content' => bodyContent
        },
        'conversationId'=>selectedEmailId,
        'toRecipients' => new List<Object>(),
        'ccRecipients' => new List<Object>(),
        'inReplyTo' => new Map<String, Object>{ 'id' => selectedEmailId }, // Use the original email's ID
        'references' => selectedEmailId // Use the original email's ID for thread reference
      };
      List<String> emailList = toAddress.split(';');
      for (String email : emailList) {
        Map<String, Object> recipient = new Map<String, Object>{
          'emailAddress' => new Map<String, Object>{ 'address' => email }
        };
        List<Object> toRecipients = (List<Object>) message.get('toRecipients');
        toRecipients.add(recipient);
      }

      // Loop through the list of email addresses and add them to the 'toRecipients' array
      for (String email : emailList) {
        Map<String, Object> recipient = new Map<String, Object>{
          'emailAddress' => new Map<String, Object>{ 'address' => email }
        };
        List<Object> ccRecipients = (List<Object>) message.get('ccRecipients');
        ccRecipients.add(recipient);
      }


      HttpRequest req = new HttpRequest();
      req.setEndpoint(endpoint); // Replace with the actual Graph API endpoint
      req.setMethod('POST');
      req.setHeader('Authorization', 'Bearer ' + accessToken);
      req.setHeader('Content-Type', 'application/json');
      req.setBody(JSON.serialize(message));

      // Send the HTTP request
      Http http = new Http();
      res = http.send(req);

      // Step 8: Handle the response from the Graph API
      if (res.getStatusCode() == 202) {
        return JSON.serialize(
          new Map<String, Object>{
            'status' => 'success',
            'message' => 'Email reply sent successfully!'
          }
        );
      } else {
        return JSON.serialize(
          new Map<String, Object>{
            'status' => 'error',
            'message' => 'Error sending email reply: ' + res.getBody()
          }
        );
      }
    } catch (IllegalArgumentException e) {
      System.debug('Invalid input: ' + e.getMessage());
      return JSON.serialize(
        new Map<String, Object>{
          'status' => 'error',
          'message' => 'Error replying email reply: ' + res.getBody()
        }
      );
    } catch (Exception e) {
      System.debug('Error forward email: ' + e.getMessage());
      return JSON.serialize(
        new Map<String, Object>{
          'status' => 'error',
          'message' => 'Error replying email reply: ' + res.getBody()
        }
      );
    }
  }
}
