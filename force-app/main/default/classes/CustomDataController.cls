@RestResource(urlMapping='/customData/*')
global with sharing class CustomDataController {
  @HttpGet
  global static List<Account> getAccounts() {
    return [SELECT Id, Name FROM Account LIMIT 10];
  }
}
