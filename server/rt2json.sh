#!/bin/bash
################################################################################
#
# Title:  RT2JSON -- Query RT and output results as JSON
# Author: Mon May 25 13:48:54 CEST 2015 Luciano Restifo <lrestifo@esselte.com>
# Description:
#   This simple script runs a known query against BestPractical's RT and
#   converts its output to a JSON object array.  Nothing particularly smart.
#   A bit of complication comes from handling of dates, which RT spits out
#   like "Fri Jan 04 22:06:35 CEST 2015", and jq would preserve as a regular
#   text string, however they need to be expressed as new Date() in JavaScript.
#   To handle this I added a bit of awk in the pipeline.
# Dependencies:
#   rt      command-line binary does the heavy lifting
#   .rtrc   contains server configuration (URL and credentials)
#   jq      parse rt's output to JSON (http://stedolan.github.io/jq/)
#   awk     helps converting dates to JavaScript expectations
# Credits:
#   I took inspiration from this article:
#     http://infiniteundo.com/post/99336704013/convert-csv-to-json-with-jq
#
################################################################################
#

queues="IT_Germany,IT_Germany_Uelzen"
fields="Queue,Owner,Subject,Status,Priority,Requestors,Created,Resolved,CF.{Country},CF.{Ticket Classification},CF.{Request_Type}"
tktsql="Created > '01/01/2015' AND 'CF.{Ticket Classification}' NOT LIKE 'ERP_SAP_%'"

rt ls -q "$queues" -f "$fields" "$tktsql" | \
  jq --slurp --raw-input --raw-output \
    'split("\n") | .[1:] | map(split("\t")) |
      map({"id": .[0] | tonumber,
            "queue": .[1],
            "owner": .[2],
            "subject": .[3],
            "status": .[4],
            "priority": .[5],
            "requestors": .[6],
            "created": .[7],
            "resolved": .[8],
            "country": .[9],
            "requestType": .[10],
            "classification": .[11]})' | \
    awk '
      BEGIN {
        month["Jan"] = 0; month["Feb"] = 1; month["Mar"] = 2; month["Apr"] = 3;
        month["May"] = 4; month["Jun"] = 5; month["Jul"] = 6; month["Aug"] = 7;
        month["Sep"] = 8; month["Oct"] = 9; month["Nov"] =10; month["Dec"] =11;
      }
      {
        if( $2 ~ /"[A-Z][a-z][a-z]/ && $5 ~ /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/ && $6 ~ /[0-9][0-9][0-9][0-9]/ )
          printf "    %s new Date(%d,%d,%d),\n", $1, $6, month[$3], $4;
        else
          print $0;
      }'
