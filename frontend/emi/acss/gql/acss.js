import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

// QUERIES
export const getAllClearingsFromBusiness = gql`
  query getAllClearingsFromBusiness($page: Int!, $count: Int!, $businessId: String){
    getAllClearingsFromBusiness(page: $page, count: $count, businessId: $businessId){
      _id
      timestamp
      lastUpdateTimestamp
      businessId
      businessName
      input {
        businessId
        businessName
        amount
      }
      output {
        businessId
        businessName
        amount
      }
      partialSettlement {
        input {
          businessId
          businessName
          amount
        }
        output {
          businessId
          businessName
          amount
        }
      }
      accumulatedTransactionIds
      open
    }
  }
`;

export const getClearingById = gql`
  query getClearingById($id: ID!){
    getClearingById(id: $id){
      _id
      timestamp
      lastUpdateTimestamp
      businessId
      businessName
      input {
        businessId
        businessName
        amount
      }
      output {
        businessId
        businessName
        amount
      }
      partialSettlement {
        input {
          businessId
          businessName
          amount
        }
        output {
          businessId
          businessName
          amount
        }
      }
      accumulatedTransactionIds
      open
    }
  }
`;


export const getAccumulatedTransactionsByIds = gql`
  query getAccumulatedTransactionsByIds($page: Int!, $count: Int!, $ids: [ID!]){
    getAccumulatedTransactionsByIds(page: $page, count: $count, ids: $ids){
      _id
      fromBu
      fromBusinessName
      toBu
      toBusinessName
      timestamp
      transactionIds{
        type
        ids
      }
      amount
    }
  }
`;


//Hello world sample, please remove
export const ACSSHelloWorldSubscription = gql`
  subscription{
    ACSSHelloWorldSubscription{
      sn
  }
}`;
