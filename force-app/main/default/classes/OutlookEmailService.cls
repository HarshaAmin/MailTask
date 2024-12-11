public class OutlookEmailService {
    
                    public class CustomException extends Exception {}
                
                    public class Response {
                        public List<Email> emailList;
                    }
                    public class Email {
        
                        @AuraEnabled public String subject;
    @AuraEnabled public String sender;
    @AuraEnabled public String bodyPreview;
    @AuraEnabled public String receivedDateTime;
                    }
                
                    // Make sure this method is static
                    private static String getAccessToken() {
                        String clientId = 'clientId';  // Replace with your Client ID
                        String clientSecret = 'clientSecret';  // Replace with your Client Secret
                        String tenantId = 'tenantId';  // Replace with your Azure Tenant ID
                        String tokenEndpoint = 'end/' + tenantId + '/oauth2/v2.0/token';
                        String body = 'client_id=' + clientId +
                                      '&scope=sdsdt' + // Using .default scope for app permissions
                                      '&client_secret=' + clientSecret +
                                      '&grant_type=client_credentials';
                
                        HttpRequest req = new HttpRequest();
                        req.setEndpoint(tokenEndpoint);
                        req.setMethod('POST');
                        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
                        req.setBody(body);
                
                        Http http = new Http();
                        HttpResponse res = http.send(req);
                
                        if (res.getStatusCode() == 200) {
                            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                            String accessToken = (String) response.get('access_token');
                            return accessToken;
                        } else {
                            throw new CustomException('Error fetching access token: ' + res.getBody());
                        }
                    }
                
                    @AuraEnabled(cacheable=true)
                    public static OutlookEmailService.Response getUserEmails(String userId) {
                        OutlookEmailService.Response resp = new OutlookEmailService.Response();
                        String accessToken = getAccessToken();  // Now it's being called correctly within the class
                
                        String endpoint = 'https://graph.microsoft.com/v1.0/users/' + userId + '/messages'; 
                
                        HttpRequest req = new HttpRequest();
                        req.setEndpoint(endpoint);
                        req.setMethod('GET');
                        req.setHeader('Authorization', 'Bearer ' + accessToken);
                        req.setHeader('Content-Type', 'application/json');
                        req.setHeader('Accept', 'application/json');
                
                        Http http = new Http();
                        HttpResponse res = http.send(req);
                
                        System.debug('Graph API Response: ' + res.getBody());
                
                        if (res.getStatusCode() != 200) {
                            throw new CustomException('Error fetching emails: ' + res.getBody());
                        }
                
                        Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                        List<Object> messages = (List<Object>) responseBody.get('value');
                        
                        List<Email> emailList = new List<Email>();
                        
                        // Debugging the list of messages
                        System.debug('Messages received: ' + messages);
                
                        for (Object msg : messages) {
                            Map<String, Object> msgMap = (Map<String, Object>) msg;
                            
                            // Ensure the map has the expected keys
                            System.debug('Message Map: ' + msgMap);
                            
                            Email email = new Email();
                            email.subject = (String) msgMap.get('subject');
                            
                            Map<String, Object> sender = (Map<String, Object>) msgMap.get('sender');
                            email.sender = (String) ((Map<String, Object>) sender.get('emailAddress')).get('address');
                            
                            email.bodyPreview = (String) msgMap.get('bodyPreview');
                            email.receivedDateTime = (String) msgMap.get('receivedDateTime');
                            
                            emailList.add(email);
                        }
                
                        // Debugging the email list before returning
                      
                        resp.emailList = emailList;
                        System.debug('Final Email List: ' + resp);
                        return resp;
                    }
                
                    // Other methods...
                }