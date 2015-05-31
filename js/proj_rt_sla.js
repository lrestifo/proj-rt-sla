///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////
"use strict";

// Create chart objects & link them to the page, initialize page globals
var dataTable = dc.dataTable("#bc-table","bc");
var testsPie = dc.pieChart("#bc-test-chart","bc");
var statusRow = dc.rowChart("#issue-stat-chart","ii");
var ownerPie = dc.pieChart("#issue-own-chart","ii");
var impactBub = dc.bubbleChart("#issue-impact-chart","ii");
var issueTable = dc.dataTable("#issue-table", "ii");

// Hold crossfilter facts
var facts;                // Business Cases
var issueFacts;           // Issues
var factsAll;             // Counters
var issueFactsAll;        // Counters
var factsLoaded = false;  // Boolean set after loading, enables filters (BC's)
var issueLoaded = false;  // Boolean set after loading, enables filters (Issues)

// Filter on facts is page-wide
var filterLocn = 0;       // 0=All, 1=Hestra, 2=StAme
var siteDim;              // Dimension to filter upon
var issueSiteDim;         // For issues, too

// Create the spinning wheel while waiting for data load
// See http://fgnass.github.io/spin.js/
var spinner = [ null, null, null, null, null, null ];
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
  factsAll = facts.groupAll();
  siteDim = facts.dimension(function (d) { return d.site; });
  var bcDim = facts.dimension(function (d) { return d.id; });
  var statusDim = facts.dimension(function (d) { return d.completion; });
  var statusGroup = statusDim.group();

  // Business cases status pie chart
  testsPie.width(200).height(200)
    .radius(100)
    .innerRadius(70)
    .ordinalColors(["#5668e2","#56aee2","#56e2cf","#56e289","#68e256","#aee256","#e2cf56","#e28956","#e25668","#e256ae","#cf56e2","#8a56e2"])
    .legend(dc.legend().x(50).y(40).itemHeight(12).gap(3))
    .renderLabel(false)
    .dimension(statusDim)
    .group(statusGroup)
    .title(function(d) { return d.value + toPlural(" business case", d.value) + " " + d.key; });

  // Table of Business Cases
  var nFmt = d3.format("4d");
  dataTable.width(960).height(800)
    .dimension(bcDim)
    .group(function(d) { return ( filterLocn == 0 ? "All Business Cases" : ( filterLocn == 1 ? "Business Cases Hestra" : "Business Cases St.Amé" ) ); })
    .size(200)
    .columns([
      function(d) { return ticketA(d.id, d.id); },
      function(d) { return d.site; },
      function(d) { return( d.subject.substring(0,5) == "Integ" ? ticketA(d.id, d.subject.substr(19)) : ticketA(d.id, d.subject) ); },
      function(d) { return d.completion; },
      function(d) { return nFmt( d.issues ); },
      function(d) { return bcSymbol( d.progress.charAt(0) ); },
      function(d) { return bcSymbol( d.progress.charAt(1) ); },
      function(d) { return bcSymbol( d.progress.charAt(2) ); },
      function(d) { return bcSymbol( d.progress.charAt(3) ); },
      function(d) { return bcSymbol( d.progress.charAt(4) ); },
      function(d) { return bcSymbol( d.progress.charAt(5) ); },
      function(d) { return bcSymbol( d.progress.charAt(6) ); },
      function(d) { return bcSymbol( d.progress.charAt(7) ); },
      function(d) { return bcSymbol( d.progress.charAt(8) ); },
      function(d) { return bcSymbol( d.progress.charAt(9) ); },
      function(d) { return bcSymbol( d.progress.charAt(10) ); }
    ])
    .sortBy(function(d){ return d.id; })
    .order(d3.ascending);

  dc.dataCount(".bc-data-count", "bc")
    .dimension(facts)
    .group(factsAll);

  // Render the charts
  dc.renderAll("bc");
  dataLoaded("bc");

});

// Load issue data from the server
// d3.json("../cgi-bin/rapid/issues.pl", function (data) {
d3.json("./data/issues.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  issueFacts = crossfilter(data);
  issueFactsAll = issueFacts.groupAll();
  issueSiteDim = issueFacts.dimension(function (d) { return d.site; });
  var issueDim = issueFacts.dimension(function (d) { return d.id; });
  var issueStatusDim = issueFacts.dimension(function (d) { return d.status; });
  var issueStatusGroup = issueStatusDim.group();
  var issueOwnerDim = issueFacts.dimension(function (d) { return d.owner; });
  var issueOwnerGroup = issueOwnerDim.group();

  // Issue status row chart
  issueStatusDim.filterAll();
  statusRow.width(200).height(200)
    .margins({top:5, left:10, right:10, bottom:20})
    .dimension(issueStatusDim)
    .group(issueStatusGroup)
    .colors(d3.scale.category10())
    .label(function (d) { return d.key; })
    .title(function (d) { return d.value + " " + d.key + toPlural(" issue", d.value); })
    .elasticX(true)
    .xAxis().ticks(4);

  // Table of Issues -- Shows them all
  issueTable.width(960).height(800)
    .dimension(issueDim)
    .group(function(d) { return ( filterLocn == 0 ? "All Issues" : ( filterLocn == 1 ? "Issues Hestra" : "Issues St.Amé" ) ); })
    .size(200)
    .columns([
      function(d) { return ticketA(d.id, d.id); },
      function(d) { return d.site; },
      function(d) { return ticketA(d.id, d.subject); },
      function(d) { return d.owner; },
      function(d) { return d.frequency; },
      function(d) { return d.impact; },
      function(d) { return d.status; },
      function(d) { return d.bc; }
      ])
      .sortBy(function(d){ return d.id; })
      .order(d3.ascending);

  // Issue owners pie chart -- From now on only active issues
  issueStatusDim.filter(function (d) { return d != "resolved"; });
  ownerPie.width(200).height(200)
    .radius(100)
    .ordinalColors(["#8a56e2","#cf56e2","#e256ae","#e25668","#e28956","#e2cf56","#aee256","#68e256","#56e289","#56e2cf","#56aee2","#5668e2"])
    .dimension(issueOwnerDim)
    .group(issueOwnerGroup)
    .label(function (d) { return d.key; })
    .title(function (d) { return d.key + ": " + d.value + toPlural(" issue", d.value); });

  // Issue grouping by Frequency / Impact (for the bubble chart)
  var issueFreqImpDim = issueFacts.dimension(function (d) {
    var f = d.frequency.charAt(0).toUpperCase();
    var i = d.impact.charAt(0).toUpperCase();
    if( f != "H" && f != "M" && f != "L" ) {
      f = "L";
    }
    if( i != "H" && i != "M" && i != "L" ) {
      i = "L";
    }
    return( f.concat(i) );
  });
  var issueFreqImpGroup = issueFreqImpDim.group();

  // Assign a temperature to each combination of frequency and impact
  // ranging from 40 to 200 "degrees"
  var temperature = function(fi) {
    var temps = {HH:200, HM:180, HL:160, MH:140, MM:120, ML:100, LH:80, LM:60, LL:40};
    return temps[fi];
  };

  // Assign an axis position to each inidcator, one of: 10, 20, 30
  var position = function(v) {
    return( v === 'H' ? 30 : ( v === 'M' ? 20 : 10 ) );
  };

  // Issue impact bubble chart
  impactBub.width(200).height(200)
    .margins({top:5, left:25, right:2, bottom:30})
    .dimension(issueFreqImpDim)
    .group(issueFreqImpGroup)
    .colors(colorbrewer.YlOrRd[9])
    .colorDomain([40,200])
    .colorAccessor(function (p) { return temperature(p.key); } )
    .keyAccessor(function (p) { return position(p.key.charAt(0)); } )
    .valueAccessor(function (p) { return position(p.key.charAt(1)); } )
    .radiusValueAccessor(function (p) { return p.value; } )
    .maxBubbleRelativeSize(0.3)
    .x(d3.scale.linear().domain([10,30]))
    .y(d3.scale.linear().domain([10,30]))
    .r(d3.scale.linear().domain([0,100]))
    .elasticX(true)
    .elasticY(true)
    .elasticRadius(true)
    .yAxisPadding(5)
    .xAxisPadding(5)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .xAxisLabel("Frequency")
    .yAxisLabel("Impact")
    .renderLabel(true)
    .label(function (d) { return d.value; })
    .renderTitle(true)
    .title(function (d) {
      return d.value + " " + toPlural("issue", d.value) + " " +
             d.key.charAt(0) + " freq./" + d.key.charAt(1) + " imp.";
    });
    impactBub.yAxis().tickFormat(function (v) {
      switch( v ) {
        case 10:
          return "L";
        case 20:
          return "M";
        case 30:
          return "H";
        default:
          return " ";
      }
    });
    impactBub.xAxis().tickFormat(function (v) {
      switch( v ) {
        case 10:
          return "L";
        case 20:
          return "M";
        case 30:
          return "H";
        default:
          return " ";
      }
    });

    // Update counters
    dc.dataCount(".issue-data-count", "ii")
      .dimension(issueFacts)
      .group(issueFactsAll);

    // Render the charts
    dc.renderAll("ii");
    dataLoaded("ii");

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
