global class ResponseWrapper {
  public String status;
  public List<OutlookEmailService.Email> emails;

  // Constructor for the wrapper class
  public ResponseWrapper(
    String status,
    List<OutlookEmailService.Email> emails
  ) {
    this.status = status;
    this.emails = emails;
  }
}
