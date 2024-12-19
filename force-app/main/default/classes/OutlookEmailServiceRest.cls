@RestResource(urlMapping='/OutlookEmailService/*')
global with sharing class OutlookEmailServiceRest {
  @HttpGet
  global static ResponseWrapper doGet() {
    ResponseWrapper responseWrapper = new ResponseWrapper();
    OutlookEmailService.Response emailResponse = new OutlookEmailService.Response();
    try {
      RestRequest req = RestContext.request;

      // Extract parameters
      String userId = req.params.get('userId');
      String folder = req.params.get('folder');

      if (String.isBlank(userId) || String.isBlank(folder)) {
        return createErrorResponse(
          'Missing required parameters: userId or folder',
          400
        );
      }

      // Fetch emails
      emailResponse = OutlookEmailService.getSentEmails(userId, folder);

      // Success response
      responseWrapper = new ResponseWrapper(
        'success',
        emailResponse.emailList,
        200,
        'Email Retrieved'
      );
    } catch (Exception e) {
      return createErrorResponse(
        'Failed to load emails: ' + e.getMessage(),
        500
      );
    }
    return responseWrapper;
  }

  @HttpPatch
  global static ResponseWrapper doPatch() {
    RestRequest req = RestContext.request;
    ResponseWrapper responseWrapper = new ResponseWrapper();

    try {
      // Extract parameters
      String action = req.params.get('action');
      String messageId = req.params.get('messageId');

      // Validate parameters
      if (String.isBlank(action) || String.isBlank(messageId)) {
        return createErrorResponse(
          'Missing required parameters: action or messageId',
          400
        );
      }

      // Get request body for the specified action
      String body = getActionBody(action);
      if (String.isBlank(body)) {
        return createErrorResponse(
          'Invalid action specified for ' + action + ' and body is ' + body,
          400
        );
      }

      // Call the service to update the email
      OutlookEmailService.updateEmails(messageId, body);

      // Success response
      responseWrapper = new ResponseWrapper(
        'success',
        null,
        200,
        'Email updated successfully'
      );
    } catch (Exception e) {
      return createErrorResponse(
        'Error updating email: ' + e.getMessage(),
        500
      );
    }

    return responseWrapper;
  }

  @HttpDelete
  global static ResponseWrapper deleteEmail() {
    RestRequest reqContext = RestContext.request;
    ResponseWrapper responseWrapper;

    try {
      // Extract emailId from URL
      String[] urlSegments = reqContext.requestURI.split('/');
      System.debug('URL Segments: ' + JSON.serialize(urlSegments));
      System.debug('URL Segments 0: ' + urlSegments[0]);
      System.debug('URL Segments: 1' + urlSegments[1]);
      System.debug('URL Segments: 2' + urlSegments[2]);
      System.debug('URL Segments: 3' + urlSegments[3]);
      if (urlSegments.size() < 3) {
        throw new IllegalArgumentException('Email ID is missing in the URL.');
      }

      // Decode the emailId (multiple times if necessary)
      String emailId = urlSegments[3];
      emailId = EncodingUtil.urlDecode(emailId, 'UTF-8'); // Decode URL

      // Validate emailId
      if (String.isBlank(emailId)) {
        throw new IllegalArgumentException('Email ID cannot be null or empty.');
      }

      // Fetch access token
      String accessToken = OutlookEmailService.getAccessToken();
      if (String.isBlank(accessToken)) {
        //throw new Exception('Access token is missing or invalid.');
      }

      // Construct API endpoint
      String endpoint =
        'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/messages/' +
        emailId;

      // Create HTTP request to delete the email
      HttpRequest req = new HttpRequest();
      req.setEndpoint(endpoint);
      req.setMethod('DELETE');
      req.setHeader('Authorization', 'Bearer ' + accessToken);

      // Send the request
      Http http = new Http();
      HttpResponse res = http.send(req);

      // Process the response
      if (res.getStatusCode() == 204) {
        // No Content
        System.debug('Email deleted successfully.');
        responseWrapper = new ResponseWrapper(
          'Success',
          null,
          res.getStatusCode(),
          'Email deleted successfully.'
        );
      } else {
        System.debug('Failed to delete email. Response: ' + res.getBody());
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
      System.debug('Error deleting email: ' + e.getMessage());
      return createErrorResponse(
        'Error deleting email: ' + e.getMessage(),
        500
      );
    }

    return responseWrapper;
  }

  @HttpPost
  global static ResponseWrapper sendEmail() {
    ResponseWrapper responseWrapper = new ResponseWrapper();
    try {
      RestRequest reqContext = RestContext.request;
      String requestBody = reqContext.requestBody.toString();

      // Deserialize the JSON body into a Map
      Map<String, Object> params = (Map<String, Object>) JSON.deserializeUntyped(
        requestBody
      );

      // Extract parameters
      String toAddress = (String) params.get('toAddress');
      String subject = (String) params.get('subject');
      String bodyContent = (String) params.get('bodyContent');
      String fileName = (String) params.get('fileName');
      String fileType = (String) params.get('fileType');
      String base64Content = (String) params.get('base64Content');
      String accessToken = OutlookEmailService.getAccessToken();
      String endpoint = 'https://graph.microsoft.com/v1.0/users/Send.Tech@novigo-solutions.com/sendMail';

      // Construct the email payload
      Map<String, Object> message = new Map<String, Object>{
        'subject' => subject,
        'body' => new Map<String, Object>{
          'contentType' => 'Text',
          'content' => bodyContent
        },
        'toRecipients' => new List<Object>{
          new Map<String, Object>{
            'emailAddress' => new Map<String, Object>{ 'address' => toAddress }
          }
        }
      };

      // Attachments are added if base64Content exists
      if (String.isNotBlank(base64Content)) {
        message.put(
          'attachments',
          new List<Object>{
            new Map<String, Object>{
              '@odata.type' => '#microsoft.graph.fileAttachment',
              'name' => fileName,
              'contentType' => fileType,
              'contentBytes' => base64Content
            }
          }
        );
      }

      // Final payload
      Map<String, Object> emailPayload = new Map<String, Object>{
        'message' => message,
        'saveToSentItems' => true
      };

      // Prepare HTTP request
      HttpRequest req = new HttpRequest();
      req.setEndpoint(endpoint);
      req.setMethod('POST');
      req.setHeader('Authorization', 'Bearer ' + accessToken);
      req.setHeader('Content-Type', 'application/json');
      req.setBody(JSON.serialize(emailPayload));

      // Send the request
      Http http = new Http();
      HttpResponse res = http.send(req);

      // Return success response
      responseWrapper = new ResponseWrapper(
        res.getStatus(),
        null,
        res.getStatusCode(),
        res.getBody()
      );
    } catch (Exception e) {
      return createErrorResponse(
        'Email Failed to Send: ' + e.getMessage(),
        500
      );
    }

    return responseWrapper;
  }

  // Helper function to construct the request body based on action
  private static String getActionBody(String action) {
    switch on action {
      when 'read' {
        return '{ "isRead": true }';
      }
      when 'unread' {
        return '{ "isRead": false }';
      }
      when 'flag' {
        return '{ "flag": { "flagStatus": "flagged" } }';
      }
      when 'unflag' {
        return '{ "flag": { "flagStatus": "notFlagged" } }';
      }
      when 'pin' {
        return '{ "categories": ["Pinned"] }';
      }
      when 'unpin' {
        return '{ "categories": [] }';
      }
      when else {
        return null;
      }
    }
  }

  // Helper method to create error responses
  private static ResponseWrapper createErrorResponse(
    String errorMessage,
    Integer statusCode
  ) {
    return new ResponseWrapper('error ', null, statusCode, errorMessage);
  }
}
