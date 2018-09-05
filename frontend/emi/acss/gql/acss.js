import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

//Hello world sample, please remove
export const getHelloWorld = gql`
  query getHelloWorldFrommsnamecamel{
    getHelloWorldFrommsnamecamel{
      sn      
    }
  }
`;


//Hello world sample, please remove
export const msnamecamelHelloWorldSubscription = gql`
  subscription{
    msnamecamelHelloWorldSubscription{
      sn
  }
}`;
