import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

// QUERIES

export const getACSSBusiness = gql`
  query getACSSBusiness{
    getACSSBusiness{
    _id
    name
  }
}
`;

export const getACSSBusinesses = gql`
  query getACSSBusinesses{
    getACSSBusinesses{
    _id
    name
  }
}
`;

