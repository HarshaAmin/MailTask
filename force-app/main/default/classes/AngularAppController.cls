public class AngularAppController {
  @AuraEnabled(cacheable=true)
  public static String getWelcomeMessage() {
    return 'Welcome to the Angular app!';
  }
}
