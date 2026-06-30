import { gql } from '@apollo/client/core';

export const GET_VIEWER = gql`
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
    }
  }
`;

export const GET_USER_ANIME_LIST = gql`
  query GetUserAnimeList($userId: Int!) {
    Page(page: 1, perPage: 50) {
      mediaList(userId: $userId, type: ANIME, sort: UPDATED_TIME_DESC) {
        status
        media {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          episodes
        }
      }
    }
  }
`;

export const SAVE_MEDIA_LIST_ENTRY = gql`
  mutation SaveMediaListEntry($mediaId: Int, $scoreRaw: Int) {
    SaveMediaListEntry(mediaId: $mediaId, scoreRaw: $scoreRaw) {
      id
      score
    }
  }
`;
