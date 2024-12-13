@RestResource(urlMapping='/OutlookEmailService/*')
global with sharing class OutlookEmailServiceRest {
  @HttpGet
  global static ResponseWrapper doGet() {
    OutlookEmailService.Response emailResponse = new OutlookEmailService.Response();
    ResponseWrapper responseWrapper = new ResponseWrapper();
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    // Determine action type (fetch or update)
    String action = req.params.get('action');
    String messageId = req.params.get('messageId');
    String userId = req.params.get('userId');
    String folder = req.params.get('folder');

    // Fetch Emails Logic
    if (String.isNotBlank(action) && action == 'fetch') {
      emailResponse = doGet(userId, folder);
      responseWrapper = new ResponseWrapper(
        'success',
        emailResponse.emailList,
        200,
        'Email Retrieved'
      );
      return responseWrapper;
    }

    // Update Email Logic
    if (String.isNotBlank(messageId) && String.isNotBlank(action)) {
      responseWrapper = new ResponseWrapper(
        'success',
        emailResponse.emailList,
        200,
        updateEmails(messageId, action, res)
      );
      return responseWrapper;
    }

    responseWrapper = new ResponseWrapper(
      'Failed',
      emailResponse.emailList,
      200,
      'Missing or invalid parameters'
    );
    return responseWrapper;
  }

  // Method to update email (e.g., mark as read, flag, pin)
  private static String updateEmails(
    String messageId,
    String action,
    RestResponse res
  ) {
    String body = getActionBody(action);
    ResponseWrapper responseWrapper = new ResponseWrapper();

    if (String.isBlank(body)) {
      return 'Invalid action specified'; // Return serialized JSON string
    }

    try {
      // Call the OutlookEmailService to update the email
      Object response = OutlookEmailService.updateEmails(messageId, body);
      return 'Success updating email';
    } catch (Exception e) {
      return 'Error updating email: ' + e.getMessage();
    }
  }

  // Method to fetch emails
  private static OutlookEmailService.Response doGet(
    String userId,
    String folder
  ) {
    RestResponse res = RestContext.response; // Access response here

    return OutlookEmailService.getSentEmails(userId, folder);
    // if (String.isBlank(userId) || String.isBlank(folder)) {
    //     res.statusCode = 400;
    //     rWrapper.status = 'Error';
    //     rWrapper.data = 'Missing required parameters: userId or folder';
    //     return rWrapper.toJson();  // Return serialized JSON string
    // }

    // try {
    //     OutlookEmailService.Response emailResponse = OutlookEmailService.getUserEmails(
    //         userId
    //       );
    //     return rWrapper.toJson();  // Return serialized JSON string
    // } catch (Exception e) {
    //     // Handle errors and set the response status code
    //     res.statusCode = 500;
    //     rWrapper.status = 'Error';
    //     rWrapper.data = 'Error fetching emails: ' + e.getMessage();
    //     return rWrapper.toJson();  // Return serialized JSON string
    // }
  }

  // Helper function to construct the request body based on action
  private static String getActionBody(String action) {
    switch on action {
      when 'markRead' {
        return '{ "isRead": true }';
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
}
