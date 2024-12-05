public class OAuthMicrosoftHandler {
    public String authorizationUrl { get; set; }
    public String authorizationCode { get; set; }

    // Constructor to generate the authorization URL
    public OAuthMicrosoftHandler() {
        String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b'; // Replace with your actual client ID
        String redirectUri = 'https://login.salesforce.com/services/oauth2/callback'; // Same as the one registered in Azure
        String tenantId = 'd25e697e-9987-4146-87ba-800be6fd457c';  // Use 'common' for multi-tenant or your specific tenant ID
        authorizationUrl = AzureOAuth.authorizationUrl(clientId, redirectUri, tenantId);
        
        // Capture the authorization code from the URL query parameter
        authorizationCode = ApexPages.currentPage().getParameters().get('code');
    }

    // Method to exchange authorization code for access token
    public void exchangeCodeForToken() {
        if (String.isNotBlank(authorizationCode)) {
            // Replace with your Azure app's details
            String clientId = 'b9d0a69d-7dc4-46d5-9ff6-76026e3e484b';
            String clientSecret = 'zeR8Q~smEpXz2F4n9YyU8MhLnZ4R~aSupCNMOdsu';
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