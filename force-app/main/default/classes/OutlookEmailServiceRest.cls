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
        return createErrorResponse('Invalid action specified', 400);
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
    return new ResponseWrapper('error', null, statusCode, errorMessage);
  }
}
