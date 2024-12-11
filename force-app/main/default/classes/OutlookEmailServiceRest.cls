@RestResource(urlMapping='/OutlookEmailService/*')
global with sharing class OutlookEmailServiceRest {
  // HTTP GET method for fetching emails
  @HttpGet
  global static ResponseWrapper doGet() {
    // Get the userId from query params
    RestRequest req = RestContext.request;
    String userId = req.params.get('userId');

    // Fetch emails using the OutlookEmailService and return the result
    OutlookEmailService.Response emailResponse = OutlookEmailService.getUserEmails(
      userId
    );

    // Create a response wrapper
    ResponseWrapper responseWrapper = new ResponseWrapper(
      'success',
      emailResponse.emailList
    );

    // Return the wrapped response
    return responseWrapper;
  }
}
