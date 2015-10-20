#!/usr/bin/env perl -w
################################################################################
#
# Title:    RT-SLA-QUERY -- Query RT and output results as TSV
# Author:   Tue Jan 20 21:09:45 CET 2015 lrestifo at esselte dot com
# Description:
#   This script runs a query against an RT instance and output results as
#   a Tab-separated text file.  In addition to the basic RT query, the script
#   computes 2 additional field values per-ticket that cannot be easily
#   calculated in standard RT, namely:
#   1. The week number a ticket is created (YYYYWW)
#   2. The difference in days between ticket creation and resolution
# Usage:
#   rt-sla-query --server=http://example.com/rt --user=u --password=p
# Notes:
#   This script is not generic, because the query statement is built in.
#   Generalizing it shouldn't be too difficult
# Output:
#   STDOUT only
#   Output separator is TAB and not comma (in line with RT practice)
#
################################################################################

use strict;
use Error qw(:try);
use DateTime;
use Date::Parse;
use Date::Calc qw(Time_to_Date check_date Delta_Days Week_of_Year);
use Getopt::Long;
use RT::Client::REST;
binmode(STDOUT, ":utf8");

# Check command line parameters
my $serv = "http://some.server/rt";
my $user = "user";
my $pass = "pass";
GetOptions(
  "server:s"    => \$serv,
  "user:s"      => \$user,
  "password:s"  => \$pass
) or die("Error in command line arguments\n");

my $rt = RT::Client::REST->new(
  server => $serv,
  timeout => 30
);

try {
  $rt->login(username => $user, password => $pass);
} catch Exception::Class::Base with {
  die "Can't login as '$user': ", shift->message;
};

try {
  # Get all non-SAP German tickets
  my @ids = $rt->search(
    type => "ticket",
    query => "(Created > '2015-01-01') AND (Queue = 'IT_Germany' OR Queue = 'IT_Germany_Uelzen') AND ('CF.{Ticket Classification}' NOT LIKE 'ERP_SAP_%')",
    orderby => "id"
  );
  # Output tab-separated
  my $sep = "\t";
  my $eol = "\n";
  print "Id", $sep,
        "Subject", $sep,
        "Owner", $sep,
        "Queue", $sep,
        "Requestors", $sep,
        "Priority", $sep,
        "Status", $sep,
        "Created", $sep,
        "Started", $sep,
        "Due", $sep,
        "LastUpdated", $sep,
        "Resolved", $sep,
        "Country", $sep,
        "RequestType", $sep,
        "Impact", $sep,
        "Classification", $sep,
        "CreatedInWeek", $sep,
        "AgeInDays", $eol;
  for my $id (@ids) {
    my $t = $rt->show(type => "ticket", id => $id);
    print substr($t->{id},7), $sep, # RT returns id as 'ticket/nnnn'
          $t->{Subject}, $sep,
          $t->{Owner}, $sep,
          $t->{Queue}, $sep,
          $t->{Requestors}, $sep,
          $t->{Priority}, $sep,
          $t->{Status}, $sep,
          $t->{Created}, $sep,
          $t->{Started}, $sep,
          $t->{Due}, $sep,
          $t->{LastUpdated}, $sep,
          $t->{Resolved}, $sep,
          $t->{"CF.{Country}"}, $sep,
          $t->{"CF.{Request_Type}"}, $sep,
          $t->{"CF.{Impact Scope}"}, $sep,
          $t->{"CF.{Ticket Classification}"}, $sep,
          weekNo($t->{Created}), $sep,
          ageInDays($t->{Created}, $t->{Resolved}), $eol;
  }
} catch RT::Client::REST::Exception with {
  # something went wrong.
  die shift->message;
};

#
# Given ticket creation date, returns its week number as YYYYWW (zero-padded)
sub weekNo {
  my $created = shift(@_);
  my $time = str2time($created);
  my ($year, $month, $day) = Time_to_Date($time);
  if( check_date($year, $month, $day) ) {
    my ($week, $year) = Week_of_Year($year, $month, $day);
    return sprintf("%04d%02d", $year, $week);
  } else {
    return "000000";
  }
}

#
# Given ticket creation and resolution dates, return their delta in days
# Returns -1 if ticket is not resolved, 0 if resolved on creation day, >0 later
sub ageInDays {
  my ($created, $resolved) = @_;
  if( $resolved =~ /Not set/) {
    return -1;
  } else {
    my $timeC = str2time($created);
    my $timeR = str2time($resolved);
    my ($yearC, $monthC, $dayC) = Time_to_Date($timeC);
    my ($yearR, $monthR, $dayR) = Time_to_Date($timeR);
    if( check_date($yearR, $monthR, $dayR) ) {
      return Delta_Days($yearC, $monthC, $dayC, $yearR, $monthR, $dayR);
    } else {
      return -1;
    }
  }
}

# Game over
#-----------
exit( 0 );
