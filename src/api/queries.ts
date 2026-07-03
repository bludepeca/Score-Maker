import { gql } from '@apollo/client/core';

export const GET_VIEWER = gql`
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
      mediaListOptions {
        scoreFormat
      }
    }
  }
`;

export const GET_USER_ANIME_LIST = gql`
  query GetUserAnimeList($userId: Int!, $type: MediaType) {
    Page(page: 1, perPage: 50) {
      mediaList(userId: $userId, type: $type, sort: UPDATED_TIME_DESC) {
        id
        status
        score
        media {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          bannerImage
          description(asHtml: false)
          status
          episodes
          type
          genres
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
