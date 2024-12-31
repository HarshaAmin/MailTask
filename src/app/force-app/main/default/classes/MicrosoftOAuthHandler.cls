public class MicrosoftOAuthHandler {

    // Method to return the Microsoft Authorization URL
    public String getAuthorizationUrl() {
        // Replace with your actual client ID, redirect URI, and tenant ID
        String clientId = 'your-client-id';
        String redirectUri = 'https://login.salesforce.com/services/oauth2/callback';  // Salesforce callback URL
        String tenantId = 'common';  // Or use your specific tenant ID

        // Construct the Microsoft OAuth authorization URL
        String authUrl = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize';
        authUrl += '?client_id=' + clientId;
        authUrl += '&response_type=code';  // response_type=code means we are requesting an authorization code
        authUrl += '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8');
        authUrl += '&scope=Mail.Read';  // Example scope, adjust as needed

        return authUrl;  // Return the constructed URL
    }

    // Method to exchange authorization code for access token
    public static String exchangeCodeForToken(String authorizationCode) {
        String clientId = 'your-client-id';  // Replace with actual client ID
        String clientSecret = 'your-client-secret';  // Replace with actual client secret
        String redirectUri = 'https://login.salesforce.com/services/oauth2/callback';  // Salesforce callback URL
        String tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';  // Microsoft token endpoint

        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        // Build request body
        String body = 'client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8');
        body += '&client_secret=' + EncodingUtil.urlEncode(clientSecret, 'UTF-8');
        body += '&code=' + EncodingUtil.urlEncode(authorizationCode, 'UTF-8');
        body += '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8');
        body += '&grant_type=authorization_code';

        req.setBody(body);

        // Send HTTP request to exchange code for token
        Http http = new Http();
        HttpResponse res = http.send(req);

        // Parse the response to get the access token
        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            if (responseMap.containsKey('access_token')) {
                return (String) responseMap.get('access_token');
            }
        }
        return null;  // Return null if no access token found
    }
}