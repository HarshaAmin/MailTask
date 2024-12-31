@RestResource(urlMapping='/api/categorization-results')
global with sharing class CategorizationResultsEndpoint {
  @HttpPost
  global static String receiveCategorizationResults(String categoriesJson) {
    // Deserialize the incoming categories JSON string
    List<String> categories = (List<String>) JSON.deserialize(
      categoriesJson,
      List<String>.class
    );

    // Process the categorization results
    System.debug('Received Categorization Results: ' + categories);

    // You could now save these results to a custom object, send notifications, etc.

    // Example: Save results to a custom object
    // for (String category : categories) {
    //     Categorization__c result = new Categorization__c(Category__c = category);
    //     insert result;
    // }
    return categories[0];

    // Return a success message
    //return 'Categorization results processed successfully';
  }
}
