///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////
"use strict";

// Create chart objects & link them to the page, initialize page globals
var tktTab = dc.dataTable("#tkt-table","tkt");
var tktBar = dc.barChart("#tkt-sl-chart","tkt");
var tktPie = dc.pieChart("#tkt-pc-chart","tkt");

// Hold crossfilter facts
var facts;                // Tickets

// Filter on facts is page-wide
/*var filterLocn = 0;       // 0=All, 1=Hestra, 2=StAme
var siteDim;              // Dimension to filter upon
var issueSiteDim;         // For issues, too
*/
// Create the spinning wheel while waiting for data load
// See http://fgnass.github.io/spin.js/
/*var spinner = [ null, null, null, null, null, null ];
var spinDiv = [ 0, 0, 0, 0, 0, 0 ];
var spinGrp = [ "bc", "bc", "ii", "ii", "ii", "ii" ];  // Follow chart groups
$(document).ready(function() {
  var opts = {
    lines: 13,        // The number of lines to draw
    length: 20,       // The length of each line
    width: 10,        // The line thickness
    radius: 30,       // The radius of the inner circle
    corners: 1,       // Corner roundness (0..1)
    rotate: 0,        // The rotation offset
    direction: 1,     // 1: clockwise, -1: counterclockwise
    color: "#000",    // #rgb or #rrggbb or array of colors
    speed: 1,         // Rounds per second
    trail: 60,        // Afterglow percentage
    shadow: false,    // Whether to render a shadow
    hwaccel: true,    // Whether to use hardware acceleration
    className: "spinner", // The CSS class to assign to the spinner
    zIndex: 2e9,      // The z-index (defaults to 2000000000)
    top: "50%",       // Top position relative to parent
    left: "50%"       // Left position relative to parent
  };
  spinDiv[0] = $("#spinner0").get(0);
  spinDiv[1] = $("#bc-test-div").get(0);
  spinDiv[2] = $("#issue-stat-div").get(0);
  spinDiv[3] = $("#issue-own-div").get(0);
  spinDiv[4] = $("#issue-impact-div").get(0);
  spinDiv[5] = $("#spinner1").get(0);
  for( var i = 0; i < spinDiv.length; i++ ) {
    spinner[i] = new Spinner(opts).spin(spinDiv[i]);
  }
  // Reset location filter
  setLocationFilter( 0 );
});
*/
// Map a status letter to its corresponding colored icon
function bcSymbol( c ) {
  switch( c.toUpperCase() ) {
    case "N": return( "<span class='label label-warning glyphicon glyphicon-pause'> N </span>" );
    case "O": return( "<span class='label label-info glyphicon glyphicon-play'> O </span>" );
    case "E": return( "<span class='label label-danger glyphicon glyphicon-remove'> E </span>" );
    case "R": return( "<span class='label label-success glyphicon glyphicon-ok'>&nbsp;&nbsp;</span>" );
    default: return( "&nbsp;" );
  }
}

// Anchor the ticket subject
function ticketA( id, subj ) {
  return( "<a href='http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id=" + id + "'>" + subj + "</a>" );
}

// Turn a string plural if necessary
function toPlural( s, n ) {
  return( n == 1 ? s : s+"s" );
}

// Called at the end of data loading
function dataLoaded( g ) {
  if( g == "bc" ) {
    factsLoaded = true;
    // End Group 0 spinner(s)
    for( var i = 0; i < spinDiv.length; i++ ) {
      if( spinner[i] != null && spinGrp[i] == "bc" ) {
        spinner[i].stop(spinDiv[i]);
      }
    }
  }
  if( g == "ii" ) {
    issueLoaded = true;
    // End Group 1 spinner(s)
    for( var i = 0; i < spinDiv.length; i++ ) {
      if( spinner[i] != null && spinGrp[i] == "ii" ) {
        spinner[i].stop(spinDiv[i]);
      }
    }
  }
  if( factsLoaded && issueLoaded ) {
    $(".toggle-hidden").toggleClass("hidden");
    $("#lastUpdate").livestamp(new Date());
  }
}

// Load data from the server
// d3.json("../cgi-bin/rapid/tickets.pl", function (data) {
d3.json("./data/tickets.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  facts = crossfilter(data);
  //factsAll = facts.groupAll();
  //siteDim = facts.dimension(function (d) { return d.site; });
  var tktDim = facts.dimension(function (d) { return d.id; });
  //var statusDim = facts.dimension(function (d) { return d.completion; });
  //var statusGroup = statusDim.group();

  // Business cases status pie chart
  //testsPie.width(200).height(200)
    //.radius(100)
    //.innerRadius(70)
    //.ordinalColors(["#5668e2","#56aee2","#56e2cf","#56e289","#68e256","#aee256","#e2cf56","#e28956","#e25668","#e256ae","#cf56e2","#8a56e2"])
    //.legend(dc.legend().x(50).y(40).itemHeight(12).gap(3))
    //.renderLabel(false)
    //.dimension(statusDim)
    //.group(statusGroup)
    //.title(function(d) { return d.value + toPlural(" business case", d.value) + " " + d.key; });

  // Table of Tickets
  tktTab.width(960).height(800)
    .dimension(tktDim)
    .group(function(d) { return "All Tickets"; })
    .size(2000)
    .columns([
      function(d) { return ticketA(d.id, d.id); },
      function(d) { return ticketA(d.id, d.subject); },
      function(d) { return d.queue; },
      function(d) { return d.owner; },
      function(d) { return d.requestors; },
      function(d) { return d.status; },
      function(d) { return d.classification; },
      function(d) { return moment(new Date(d.created)).isoWeek(); },
      function(d) {
        var dBeg = moment(new Date(d.created));
        var dEnd = ( d.resolved == "Not Set" || (d.status != "resolved" && d.status != "rejected") ? moment(new Date()) : moment(new Date(d.resolved)) );
        return dEnd.diff(dBeg, "days");
      }
    ])
    .sortBy(function(d){ return d.id; })
    .order(d3.ascending);

/*  dc.dataCount(".bc-data-count", "bc")
    .dimension(facts)
    .group(factsAll);
*/
  // Render the charts
  dc.renderAll("tkt");
  //dataLoaded("bc");

});

// Process ticket search
$("#tk-search").submit(function(e) {
  var t = $("#tk-num").val();
  if( t == parseInt(t) && t > 0 ) {
    window.open("http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id="+t,"_blank");
  }
  e.preventDefault();
});

// Set location filter
$("#filterSE").click(function(e) { setLocationFilter(1); });
$("#filterFR").click(function(e) { setLocationFilter(2); });
$("#filterXX").click(function(e) { setLocationFilter(0); });
function setLocationFilter( l ) {
  if( !factsLoaded || !issueLoaded ) { return; }
  dc.filterAll("bc");
  dc.filterAll("ii");
  switch( l ) {
    case 1:
      siteDim.filter("H");
      issueSiteDim.filter("H");
      filterLocn = 1;
      $(".currentLocn").text("Hestra");
      break;
    case 2:
      siteDim.filter("S");
      issueSiteDim.filter("S");
      filterLocn = 2;
      $(".currentLocn").text("St.Amé");
      break;
    default:
      siteDim.filterAll("bc");
      issueSiteDim.filterAll("ii");
      filterLocn = 0;
      $(".currentLocn").text("Hestra + St.Amé");
      break;
  }
  dc.redrawAll("bc");
  dc.redrawAll("ii");
}

// Reset all filters button
$("#resetAll").click(function(e) {
  dc.filterAll("bc");
  dc.filterAll("ii");
  dc.renderAll("bc");
  dc.renderAll("ii");
});
