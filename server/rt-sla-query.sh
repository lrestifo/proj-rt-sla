#!/bin/bash
set -euo pipefail
IFS=$'\n\t'
################################################################################
#
# Title:  RT-SLA-QUERY -- Query RT and output results as either CSV or JSON
# Author: Mon May 25 13:48:54 CEST 2015 Luciano Restifo <lrestifo@esselte.com>
# Description:
#   This simple script runs a known query against BestPractical's RT and
#   converts its output to either CSV text or a JSON object array, depending
#   on a given input flag.  Defaults to CSV.
# Usage:
#   rt-sla-query --csv      output a list of tickets as CSV text
#   rt-sla-query --json     output a list of tickets as JSON text
# Dependencies:
#   rt-sla-query.pl Perl script doing the heavy lifting
#   csvformat       Convert to plain CSV. Part of CSVKIT (http://csvkit.readthedocs.org/en/0.9.1/)
#   any-json        Convert anything to JSON (https://www.npmjs.com/package/any-json)
#   jq              Parse script's output to JSON (http://stedolan.github.io/jq/)
# Deployment Notes:
#   This script is meant to be run in RT Production as a cron(1) job saving
#   its output by simple stdout redirection
# Credits:
#   For the JSON conversion I initially took inspiration from this article:
#     http://infiniteundo.com/post/99336704013/convert-csv-to-json-with-jq
#   but then I found a more elegant technique on Stedolan's Wiki
#     https://github.com/stedolan/jq/wiki/Cookbook#convert-a-csv-file-with-headers-to-json
#
################################################################################
#

export RTHOME=/opt/rt4
export PATH=$RTHOME/bin:/usr/local/bin:/usr/bin:/bin:$HOME/bin

serv="http://some/host/running/rt"
user="user"
pass="pass"

case "${1:---csv}" in
  "--json")
    perl -w rt-sla-query.pl --server="$serv" --user="$user" --password="$pass" | \
      csvformat -t | \
      any-json -format=csv | \
      jq -f csv2json-helper.jq
    ;;
  "--csv")
    perl -w rt-sla-query.pl --server="$serv" --user="$user" --password="$pass" | csvformat -t
    ;;
  *)
    echo "Usage: rt-sql-query [ --csv | --json ]"
    exit 1
    ;;
esac

exit 0
