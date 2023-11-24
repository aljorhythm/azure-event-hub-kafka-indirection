#!/bin/bash

# example
# export KAFKA_DIR=/Users/joel.lim/Downloads/kafka_2.13-3.6.0
# https://kafka.apache.org/downloads

echo kafka_dir: $KAFKA_DIR

broker=$1

echo broker: $broker

sh $KAFKA_DIR/bin/kafka-run-class.sh kafka.admin.ConsumerGroupCommand --topic clicks --bootstrap-server $broker --describe