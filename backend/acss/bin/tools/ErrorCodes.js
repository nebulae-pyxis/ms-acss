//Every single error code
// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = {code: 17001, description: 'Internal server error'};
const PERMISSION_DENIED_ERROR_CODE = {code: 17002, description: 'Permission denied'};
const USER_DOES_NOT_BELONG_TO_BUSINESS_ERROR_CODE = {code: 17017, description: 'User does not belong to any business'};


module.exports =  { 
    PERMISSION_DENIED_ERROR_CODE,
    INTERNAL_SERVER_ERROR_CODE,
    USER_DOES_NOT_BELONG_TO_BUSINESS_ERROR_CODE
} 