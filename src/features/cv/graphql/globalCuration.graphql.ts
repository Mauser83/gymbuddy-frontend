import { gql } from '@apollo/client';

export const LIST_GLOBAL_SUGGESTIONS = gql`
  query ListGlobalSuggestions($input: ListGlobalSuggestionsInput!) {
    listGlobalSuggestions(input: $input) {
      items {
        id
        equipmentId
        equipment {
          id
          name
        }
        gymImageId
        storageKey
        url
        sha256
        usefulnessScore
        reasonCodes
        nearDupImageId
        createdAt
      }
      nextCursor
    }
  }
`;

export const APPROVE_GLOBAL_SUGGESTION = gql`
  mutation ApproveGlobalSuggestion($input: ApproveGlobalSuggestionInput!) {
    approveGlobalSuggestion(input: $input) {
      approved
      imageId
      storageKey
    }
  }
`;

export const REJECT_GLOBAL_SUGGESTION = gql`
  mutation RejectGlobalSuggestion($input: RejectGlobalSuggestionInput!) {
    rejectGlobalSuggestion(input: $input) {
      rejected
    }
  }
`;
