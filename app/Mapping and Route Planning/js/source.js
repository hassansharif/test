"use strict";
//
//
//	This is standard jQuery idiom; it gets called after the DOM tree has been created and is used to
//  initialize the Emotive Common Device Framework (CDF).
//
$(document).ready(CDF_Initialize);


//
//  After the DOM is loaded and the CDF is initialized this function will be called as the starting
//  point of the actual application.
//


function CDF_Ready()
{
    //  var requestedQueries = new Array();
    //  requestedQueries.push(new DeclareDataValueObject("Emotive.Data.hello","String"));
    
    


    
    


    $('#Loading').bind('pagebeforeshow', function(event)
    {
        Emotive.Ui.Header.setTitle("Loading...");
    });

    //    $('#MainPage').bind('pagebeforeshow', function(event)
    //    {
    //        Emotive.Ui.Header.setTitle("Hello, World!");
    //        Emotive.Ui.Header.setBackButton(null);
    //    });
    
    //
    // Declare an event handler to fire before the #Map page is about to be shown.
    //
    $('#Map').bind('pageshow', function(event)
    {

        // Emotive.Ui.Header.setBackButton(null);
        Emotive.Ui.Header.setTitle("Drop pin to locate stores");
        Emotive.Ui.Header.setRightButton("Search", FilterPage);
        
        
    }
    );

    //
    // Declare an event handler to fire after the #Map page is shown.
    //
    $('#Map').bind('pageshow', function(event)
    {
        

        });
    
    onRequestDataReady();
}
  
//
//  After the Emotive.Service.submit call above has completed it will drive this callback. In applications
//  which do actual server requests the query results would now be available.
//
function onRequestDataReady()
{
    //alert(DM.allAccounts.length);

    
    //Get current user cordinate
    openLocation();
    Emotive.App.changePage("#Map");
    // Emotive.Data.set("Emotive.Data.hello","Hello, " + Emotive.User.getName() + "!");
    
    
}

setTimeout(function(){
    
    loadMap();
    
},5000);

function FilterPage(){
    $('#FilterPage').bind('pageshow', function(event)    {
        
          
    Emotive.Ui.Header.setTitle("Filters");
    Emotive.Ui.Header.setBackButton('#Map');
     
     Emotive.Ui.Header.setRightButton("Search", FilterStores);
        
    //  $(".ui-btn").hide();
       
    });
  Emotive.App.changePage("#FilterPage");
     
    
}

