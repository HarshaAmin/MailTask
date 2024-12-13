global class ResponseWrapper {
  public String status;
  public String message;
  public List<OutlookEmailService.Email> emails;
  public Integer statusCode; // Change to Integer for HTTP status codes
  // Constructor for the wrapper class
  public ResponseWrapper() {
  }
  public ResponseWrapper(
    String status,
    List<OutlookEmailService.Email> emails,
    Integer statusCode,
    String message
  ) {
    this.status = status;
    this.emails = emails;
  }
}
