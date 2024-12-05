public class AzureOAuthHelper {

    private static final String CLIENT_ID = 'CLIENT_ID';
    private static final String CLIENT_SECRET = 'CLIENT_SECRET';
    private static final String TENANT_ID = 'TENANT_ID';
    private static final String TOKEN_URL = 'https://login.microsoftonline.com/' + TENANT_ID + '/oauth2/v2.0/token';
    
    // Get access token from Azure AD
    public static String getAccessToken() {
        // Prepare HTTP request
        HttpRequest req = new HttpRequest();
        req.setEndpoint(TOKEN_URL);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        // Set body with client credentials
        String body = 'grant_type=client_credentials' +
                      '&client_id=' + CLIENT_ID + 
                      '&client_secret=' + CLIENT_SECRET +
                      '&scope=https://graph.microsoft.com/.default';
        
        req.setBody(body);
        
        // Send the request and handle response
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            // Parse JSON response and extract access token
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) responseBody.get('access_token');
        } else {
            // Handle errors
            throw new CustomException('Error fetching access token: ' + res.getBody());
        }
    }
    
    // Custom exception to handle OAuth errors
    public class CustomException extends Exception {}
}