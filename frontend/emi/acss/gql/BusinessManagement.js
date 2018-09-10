import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

// QUERIES
export const getBusinesses = gql`
  query getBusinesses(){
  getBusinesses(){
    _id
    name
  }
}
`;

