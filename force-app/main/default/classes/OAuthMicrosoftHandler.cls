public class OAuthMicrosoftHandler {
    public String authorizationUrl { get; set; }
    public String authorizationCode { get; set; }

    // Constructor to generate the authorization URL
    public OAuthMicrosoftHandler() {
        String clientId = 'clientId'; // Replace with your actual client ID
        String redirectUri = 'https://login.salesforce.com/services/oauth2/callback'; // Same as the one registered in Azure
        String tenantId = 'TENANT_ID';  // Use 'common' for multi-tenant or your specific tenant ID
        authorizationUrl = AzureOAuth.authorizationUrl(clientId, redirectUri, tenantId);
        
        // Capture the authorization code from the URL query parameter
        authorizationCode = ApexPages.currentPage().getParameters().get('code');
    }

    // Method to exchange authorization code for access token
    public void exchangeCodeForToken() {
        if (String.isNotBlank(authorizationCode)) {
            // Replace with your Azure app's details
            String clientId = 'clientId';
            String clientSecret = 'clientSecret';
            String redirectUri = 'https://login.salesforce.com/services/oauth2/callback';

            // Call the method to exchange the authorization code for an access token
            String accessToken = AzureOAuth.getAccessToken(authorizationCode, clientId, clientSecret, redirectUri);
            
            // Example: Use the access token to interact with Microsoft Graph API
            System.debug('Access Token: ' + accessToken);

            // You can now use this token to interact with Microsoft Graph, e.g., get emails, send emails, etc.
        } else {
            // Handle error if code is not found
            System.debug('Authorization code is missing!');
        }
    }
}