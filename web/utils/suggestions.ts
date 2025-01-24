export type SuggestionState = {
  isTyping: boolean;
  lastTypingTime: number;
  canShowSuggestions: boolean;
  suggestion: string;
  isStreaming: boolean;
};

export type SuggestionAction =
  | { type: "TYPE" }
  | { type: "PAUSE_TYPING" }
  | { type: "ACCEPT_SUGGESTION" }
  | { type: "CANCEL_SUGGESTIONS" }
  | { type: "SET_SUGGESTION"; payload: string }
  | { type: "START_STREAMING" }
  | { type: "STOP_STREAMING" };

export const suggestionReducer = (
  state: SuggestionState,
  action: SuggestionAction
): SuggestionState => {
  const now = Date.now();
  console.log("Suggestion Reducer:", { action, prevState: state });

  const newState = (() => {
    switch (action.type) {
      case "TYPE":
        return {
          ...state,
          isTyping: true,
          lastTypingTime: now,
          suggestion: "",
          isStreaming: false,
        };
      case "PAUSE_TYPING":
        return {
          ...state,
          isTyping: false,
          canShowSuggestions: true,
          suggestion: "",
          isStreaming: false,
        };
      case "ACCEPT_SUGGESTION":
        return {
          ...state,
          isTyping: false,
          canShowSuggestions: false,
          suggestion: "",
          isStreaming: false,
        };
      case "CANCEL_SUGGESTIONS":
        return {
          ...state,
          canShowSuggestions: false,
          suggestion: "",
          isStreaming: false,
        };
      case "SET_SUGGESTION":
        return {
          ...state,
          suggestion: action.payload,
          isStreaming: true,
        };
      case "START_STREAMING":
        return {
          ...state,
          isStreaming: true,
          suggestion: "",
        };
      case "STOP_STREAMING":
        return {
          ...state,
          isStreaming: false,
        };
    }
    return state;
  })();

  console.log("New State:", newState);
  return newState;
};

export const SUGGESTION_DELAY = 500;
export const MIN_LENGTH_FOR_SUGGESTIONS = 8;

export function cleanSuggestionIfNeeded(
  text: string,
  suggestion: string
): string {
  // Only clean spaces (not newlines) if the text ends with a space
  return text.endsWith(" ") ? suggestion.replace(/^ +/, "") : suggestion;
}
