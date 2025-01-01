// Defines the structure of a suggestion
export interface Suggestion {
  token_str: string;  // Text of the suggestion (e.g., "advice")
  score: number;      // Relevance score (e.g., 0.7)
  sequence: string;   // Sequence of the suggestion (e.g., "hi, I need advice")
}

// Defines the structure of the sentiment analysis response
export interface SentimentResponse {
  sentimentScore: number;  // Sentiment score (positive or negative)
  sentimentLabel: string;  // Sentiment label (e.g., 'positive', 'negative', etc.)
}

// Defines the structure for the response from suggestions
export interface SuggestionsResponse {
  suggestions: SuggestionsString[];  // Array of suggestion strings
}
export interface SuggestionsString {
  suggestions: string[];  // Array of suggestion strings
}
