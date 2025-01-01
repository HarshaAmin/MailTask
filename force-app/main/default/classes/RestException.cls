public class RestException extends Exception {
    public RestException(Integer statusCode, String message) {
        // super(message);
        if (RestContext.response != null) {
            RestContext.response.statusCode = statusCode;
            RestContext.response.responseBody = Blob.valueOf(message);
        }
    }
}
