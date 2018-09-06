rsConf = {
    _id: "rs0",
    members: [
        {_id: 0, host: "store-mongo1:27017"},
        {_id: 1, host: "store-mongo2:27018"},
        {_id: 2, host: "store-mongo3:27019"},
    ]
}

rs.initiate(rsConf);

rs.conf();
