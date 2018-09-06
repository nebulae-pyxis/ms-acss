FROM mongo:4.0-xenial

# create app directory
WORKDIR /scripts

# Configure replicaset
COPY replicaSet.js .
COPY setup.sh .

RUN ["chmod", "+x", "./setup.sh"]
CMD ["./setup.sh"]