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

export const getAccumulatedTransactionsByClearingId = gql`
  query getAccumulatedTransactionsByClearingId($page: Int!, $count: Int!, $clearingId: ID!){
    getAccumulatedTransactionsByClearingId(page: $page, count: $count, clearingId: $clearingId){
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

export const getTransactionsByIds = gql`
  query getTransactionsByIds($page: Int!, $count: Int!, $filterType: String, $ids: [ID!]){
    getTransactionsByIds(page: $page, count: $count, filterType: $filterType, ids: $ids){
      _id
      amount
      fromBu
      fromBusinessName
      toBu
      toBusinessName
      timestamp
      type
      channel{
        id
        v
        c
      }
      evt{
        id
        type
        user
      }
    }
  }
`;

export const getTransactionsByAccumulatedTransactionId = gql`
  query getTransactionsByAccumulatedTransactionId($page: Int!, $count: Int!, $filterType: String, $accumulatedTransactionId: ID!){
    getTransactionsByAccumulatedTransactionId(page: $page, count: $count, filterType: $filterType, accumulatedTransactionId: $accumulatedTransactionId){
      _id
      amount
      fromBu
      fromBusinessName
      toBu
      toBusinessName
      timestamp
      type
      channel{
        id
        v
        c
      }
      evt{
        id
        type
        user
      }
    }
  }
`;

export const getSettlementsByClearingId = gql`
  query getSettlementsByClearingId($page: Int!, $count: Int!, $clearingId: String!){
    getSettlementsByClearingId(page: $page, count: $count, clearingId: $clearingId){
      _id
      amount
      fromBu
      fromBusinessName
      fromBusinessState
      toBu
      toBusinessName
      toBusinessState
      timestamp
      clearingId
    }
  }
`;

export const getSettlementsCountByClearingId = gql`
  query getSettlementsCouintByClearingId($clearingId: String!){
    getSettlementsCountByClearingId(clearingId: $clearingId)
  }
`;

export const getSettlementsByBusinessId = gql`
  query getSettlementsByBusinessId($page: Int!, $count: Int!, $businessId: String!){
    getSettlementsByBusinessId(page: $page, count: $count, businessId: $businessId){
      _id
      amount
      fromBu
      fromBusinessName
      fromBusinessState
      toBu
      toBusinessName
      toBusinessState
      timestamp
      clearingId
    }
  }
`;

export const getSettlementsCountByBusinessId = gql`
  query getSettlementsCountByBusinessId($businessId: String!){
    getSettlementsCountByBusinessId(businessId: $businessId)
  }
`;

export const getAccumulatedTransactionErrors = gql`
  query getAccumulatedTransactionErrors($page: Int!, $count: Int!){
    getAccumulatedTransactionErrors(page: $page, count: $count){
      timestamp
      error
      event
    }
  }
`;

export const getAccumulatedTransactionErrorsCount = gql`
  query getAccumulatedTransactionErrorsCount{
    getAccumulatedTransactionErrorsCount
  }
`;

export const getClearingErrors = gql`
  query getClearingErrors($page: Int!, $count: Int!){
    getClearingErrors(page: $page, count: $count){
      timestamp
      error
      event
    }
  }
`;

export const getClearingErrorsCount = gql`
  query getClearingErrorsCount{
    getClearingErrorsCount
  }
`;

export const getSettlementErrors = gql`
  query getSettlementErrors($page: Int!, $count: Int!){
    getSettlementErrors(page: $page, count: $count){
      timestamp
      error
      event
    }
  }
`;

export const getSettlementErrorsCount = gql`
  query getSettlementErrorsCount{
    getSettlementErrorsCount
  }
`;

export const changeSettlementState = gql`
  mutation changeSettlementState($settlementId: ID!, $settlementState: SettlementState!) {
    changeSettlementState(settlementId: $settlementId, settlementState: $settlementState) {
      code
      message
    }
  }
`;
