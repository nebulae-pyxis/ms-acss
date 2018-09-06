#!/bin/bash
echo *****************************************
echo Starting the replica set
echo *****************************************

sleep 10 | echo Sleeping
mongo mongodb://store-mongo1:27017 replicaSet.js

echo ******************* END **********************