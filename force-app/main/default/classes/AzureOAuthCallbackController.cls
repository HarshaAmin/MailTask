public with sharing class AzureOAuthCallbackController {
  public String accessToken { get; set; }
  public String refreshToken { get; set; }
  public String errorMessage { get; set; }

  public AzureOAuthCallbackController() {
    // Constructor just handles OAuth response processing
    String authorizationCode = ApexPages.currentPage()
      .getParameters()
      .get('code');
    String sessionState = ApexPages.currentPage()
      .getParameters()
      .get('session_state');

    System.debug('Authorization Code: ' + authorizationCode);
    System.debug('Session State: ' + sessionState);

    if (String.isEmpty(authorizationCode)) {
      errorMessage = 'Authorization failed: No code received.';
    } else {
      processOAuthResponse(authorizationCode); // Proceed with exchanging the code
    }
  }

  public PageReference processOAuthResponse(String authorizationCode) {
    // Set your Azure OAuth token endpoint and other necessary details

    // // Set your Azure OAuth token endpoint and other necessary details
    //         String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';
    // String clientSecret = 'zeR8Q~smEpXz2F4n9YyU8MhLnZ4R~aSupCNMOdsu';
    // String redirectUri = 'https://novigosolutionspvtltd2-dev-ed--c.develop.vf.force.com/apex/UserDashboard';
    // String tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    String clientId = '';
    String clientSecret = '';
    String redirectUri = 'https://novigosolutionspvtltd2-dev-ed--c.develop.vf.force.com/apex/UserDashboard';
    String tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    // Prepare the HTTP request to exchange the authorization code for an access token
    HttpRequest req = new HttpRequest();
    req.setEndpoint(tokenUrl);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    String body =
      'client_id=' +
      clientId +
      '&client_secret=' +
      clientSecret +
      '&code=' +
      authorizationCode +
      '&redirect_uri=' +
      EncodingUtil.urlEncode(redirectUri, 'UTF-8') +
      '&grant_type=authorization_code';
    req.setBody(body);

    Http http = new Http();
    HttpResponse res = http.send(req);
    System.debug('Inside redirect call');
    if (res.getStatusCode() == 200) {
      Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      accessToken = (String) response.get('access_token');
      refreshToken = (String) response.get('refresh_token');
      System.debug('200 Inside redirect success call');
      ApexPages.addMessage(
        new ApexPages.Message(
          ApexPages.Severity.CONFIRM,
          'Authentication successful! Redirecting...'
        )
      );

      // Return the redirection to the dashboard page here
      PageReference dashboardPage = Page.UserDashboard;
      dashboardPage.setRedirect(true); // Important for client-side redirect
      return dashboardPage;
    } else {
      System.debug('fail Inside redirect failure call');
      errorMessage = 'Failed to obtain token. Response: ' + res.getBody();
      ApexPages.addMessage(
        new ApexPages.Message(ApexPages.Severity.ERROR, errorMessage)
      );
      return null; // No redirection if token retrieval failed
    }
  }

  public PageReference redirectToDashboard() {
    // After processing OAuth, redirect to UserDashboard page
    return Page.UserDashboard;
  }
}
