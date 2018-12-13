'use strinct'

const Rx = require('rxjs');
const { map } = require('rxjs/operators');
const { CustomError, DefaultError } = require('./customError');

const buildSuccessResponse$ = (rawRespponse) => {
    return Rx.of(rawRespponse).pipe(
        map(resp =>  ({
                data: resp,
                result: { code: 200 }
            })
        )
    );
};

const buildErrorResponse$ = (errCode, rawRespponse) => {
    return Rx.of(rawRespponse).pipe(
        map(resp => ({
                data: resp,
                result: { code: errCode }
            })
        )
    );
};

const handleError$ = (err) => {
    console.log("GraphQl error handler ==> ", err)
    return Rx.of(err).pipe(
        map(err => {
            const exception = { data: null, result: {} };
            const isCustomError = err instanceof CustomError;
            if (!isCustomError) {
                err = new DefaultError(err);
            }
            exception.result = {
                code: err.code,
                error: { ...err.getContent() }
            };
            return exception;
        })
    );
}

module.exports = {
    buildSuccessResponse$, 
    handleError$,
    buildErrorResponse$
}