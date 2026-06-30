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
    }
  };
});

// Adding retry or offline links can be done here as part of offline-first strategy
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
