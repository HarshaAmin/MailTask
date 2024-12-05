public class ReadEmailDTO {
    public String odata_context;   //e.g., https://graph.microsoft.com/v1.0/$metadata#users('user-id')/messages
    public cls_value[] value;  // Array of email details

    public class cls_value {
        public String odata_etag;  //e.g., W/"CQAAABYAAAAuzDui6tbzTZSwRkLQQ7YtAAAA67RV"
        public String id;   // Unique message ID
        public String createdDateTime;  // Timestamp when the message was created
        public String lastModifiedDateTime; // Timestamp when the message was last modified
        public String changeKey;    // Change key to track modifications
        public cls_categories[] categories; // Categories associated with the message
        public String receivedDateTime; // Date when the message was received
        public String sentDateTime; // Date when the message was sent
        public Boolean hasAttachments; // Whether the message has attachments
        public String internetMessageId; // Internet message ID
        public String subject;  // Subject of the email
        public String bodyPreview;  // Preview of the email body
        public String importance;   // Importance level of the email (e.g., normal, high)
        public String parentFolderId;   // ID of the parent folder
        public String conversationId;   // Conversation ID for threading
        public String conversationIndex;    // Index used to order the conversation
        public Boolean isDeliveryReceiptRequested; // Delivery receipt info (changed to Boolean)
        public Boolean isReadReceiptRequested; // Whether read receipt is requested
        public Boolean isRead;  // Whether the email is read
        public Boolean isDraft;  // Whether the email is a draft
        public String webLink;  // Web link to view the email
        public String inferenceClassification;  // Focused or other categories
        public cls_body body;  // Body of the email
        public cls_sender sender;  // Sender details
        public cls_from emailFrom;  // From address (renamed from 'from')
        public cls_toRecipients[] toRecipients;  // To recipients
        public cls_ccRecipients[] ccRecipients;  // CC recipients
        public cls_bccRecipients[] bccRecipients;  // BCC recipients
        public cls_replyTo[] replyTo;  // Reply to addresses
        public cls_flag flag;  // Email flag status
    }

    public class cls_categories {
    }

    public class cls_body {
        public String contentType;  // Content type (e.g., html, text)
        public String content;  // The actual body content of the email
    }

    public class cls_sender {
        public cls_emailAddress emailAddress;  // Sender's email address
    }

    public class cls_emailAddress {
        public String name; // Name of the sender/recipient
        public String address;  // Email address
    }

    public class cls_from {
        public cls_emailAddress emailAddress;  // Sender's email address
    }

    public class cls_toRecipients {
        public cls_emailAddress emailAddress;  // To recipient's email address
    }

    public class cls_ccRecipients {
    }

    public class cls_bccRecipients {
    }

    public class cls_replyTo {
    }

    public class cls_flag {
        public String flagStatus;   // Flag status of the email (e.g., notFlagged, flagged)
    }

    // Method to parse the raw JSON response into the DTO
    public static ReadEmailDTO parse(String json) {
        return (ReadEmailDTO) System.JSON.deserialize(json, ReadEmailDTO.class);
    }
}