~~init~~
~~spin up and spin down test container~~
~~spin up and spin down kafka container~~
~~producer connect to kafka test container~~
~~producer: publish click~~
~~create topic~~
~~consumer: consume click~~

explore common interface / adaptor layer for azure-sdk and node-rdkafka
- ~~abstract adaptor layer for node-rdkafka~~
- ~~add azure-sdk~~ [adaptor](src/azure-sdk-node-rdfkafa-test-container/azure-sdk-adaptor.ts)
  - add test for azure-sdk adaptor

fix testcontainer container port between test runs
https://github.com/testcontainers/testcontainers-java/issues/256#issuecomment-1525963601