import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { useAuthStore } from '../store/useAuthStore';

const httpLink = createHttpLink({
  uri: process.env.EXPO_PUBLIC_API_URL || 'https://graphql.anilist.co',
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local state if it exists
  const token = useAuthStore.getState().anilistToken;
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          Page: {
            // Remove pagination arguments from the cache key so all pages map to the same Page object
            keyArgs: false,
            merge(existing = {}, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming);
            },
          },
        },
      },
      Page: {
        fields: {
          mediaList: {
            // Separate independent cache entries by type (Anime/Manga), user, and sorting
            keyArgs: ['userId', 'type', 'sort'],
            merge(existing = [], incoming, { readField }) {
              const merged = [...existing];
              // Deduplicate based on the MediaList id to prevent unbounded growth or duplicates on refetch
              const existingIds = new Set(merged.map((ref) => readField('id', ref)));

              for (const item of incoming) {
                const id = readField('id', item);
                if (id && !existingIds.has(id)) {
                  merged.push(item);
                  existingIds.add(id);
                } else if (!id) {
                  // Fallback if id is somehow missing, though we added it to the query
                  merged.push(item);
                }
              }
              return merged;
            },
          },
        },
      },
    },
  }),
});
