public class AzureOAuthController {
  public String authUrl { get; set; }

  public AzureOAuthController() {
    String clientId = '';
    // Define the OAuth authorization URL (replace with actual details)
    // String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';
    String redirectUri = 'https://novigosolutionspvtltd2-dev-ed--c.develop.vf.force.com/apex/AzureOAuthCallback'; // Your callback page
    String scope = 'openid profile email'; // Scope for Azure OAuth
    String authorizationUrl =
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=' +
      clientId +
      '&response_type=code&redirect_uri=' +
      EncodingUtil.urlEncode(redirectUri, 'UTF-8') +
      '&scope=' +
      scope;
    System.debug('auth url in azurauth controller ' + authorizationUrl);
    this.authUrl = authorizationUrl;
  }
  /*
    // Replace with your Azure app details
    private static final String CLIENT_ID = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';
    private static final String CLIENT_SECRET = 'zeR8Q~smEpXz2F4n9YyU8MhLnZ4R~aSupCNMOdsu';
    private static final String REDIRECT_URI = 'https://novigosolutionspvtltd2-dev-ed--c.develop.vf.force.com/apex/AzureOAuthCallback';
    private static final String TENANT_ID = 'd25e697e-9987-4146-87ba-800be6fd457c';

    public String authUrl { get; private set; }

    // Constructor to generate the authorization URL
    public AzureOAuthController() {
        authUrl = 'https://login.microsoftonline.com/' + TENANT_ID + '/oauth2/v2.0/authorize?'
                + 'response_type=code'
                + '&client_id=' + EncodingUtil.urlEncode(CLIENT_ID, 'UTF-8')
                + '&redirect_uri=' + EncodingUtil.urlEncode(REDIRECT_URI, 'UTF-8')
                + '&scope=' + EncodingUtil.urlEncode('Mail.Read', 'UTF-8'); // Adjust scopes as needed
    }

    // Method to exchange the authorization code for an access token
    @AuraEnabled
    public static String handleCallback(String code) {
        if (String.isBlank(code)) {
            throw new AuraHandledException('Authorization code is missing.');
        }

        String tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String body = 'client_id=' + EncodingUtil.urlEncode(CLIENT_ID, 'UTF-8')
                    + '&client_secret=' + EncodingUtil.urlEncode(CLIENT_SECRET, 'UTF-8')
                    + '&code=' + EncodingUtil.urlEncode(code, 'UTF-8')
                    + '&redirect_uri=' + EncodingUtil.urlEncode(REDIRECT_URI, 'UTF-8')
                    + '&grant_type=authorization_code';

        req.setBody(body);

        Http http = new Http();
        try {
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                if (responseMap.containsKey('access_token')) {
                    return (String) responseMap.get('access_token'); // Return the access token
                } else {
                    throw new AuraHandledException('Access token not found in response: ' + res.getBody());
                }
            } else {
                throw new AuraHandledException('Failed to get access token: HTTP ' + res.getStatusCode() + ' - ' + res.getBody());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error during token exchange: ' + e.getMessage());
        }
    }*/
}
