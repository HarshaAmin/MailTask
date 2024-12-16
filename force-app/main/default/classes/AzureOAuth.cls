public class AzureOAuth {
    public static String authorizationUrl(String clientId, String redirectUri, String tenantId) {
        String url = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize?';
        url += 'response_type=code';
        url += '&client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8');
        url += '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8');
        url += '&scope=' + EncodingUtil.urlEncode('Mail.Read', 'UTF-8'); // Scope of access
        return url;
    }

    public static String getAccessToken(String authorizationCode, String clientId, String clientSecret, String redirectUri) {
        String tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String body = 'client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8') +
                      '&client_secret=' + EncodingUtil.urlEncode(clientSecret, 'UTF-8') +
                      '&code=' + EncodingUtil.urlEncode(authorizationCode, 'UTF-8') +
                      '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8') +
                      '&grant_type=authorization_code';

        req.setBody(body);

        Http http = new Http();
        try {
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                // Parse JSON response to get the access token
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                if (responseMap.containsKey('access_token')) {
                    return (String) responseMap.get('access_token');
                } else {
                    throw new AuraHandledException('Access token not found in response: ' + res.getBody());
                }
            } else {
                throw new AuraHandledException('Failed to get access token: HTTP ' + res.getStatusCode() + ' - ' + res.getBody());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error during token exchange: ' + e.getMessage());
        }
    }
}