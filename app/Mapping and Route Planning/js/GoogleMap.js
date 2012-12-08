/* 
 * 
 * 
 */

var MarkerAdded='';
var UserDropMarkerLat='';
var UserDropMarkerLng='';
var MarkerForUser = new Array();
var Abbottlat = new Array();
var Abbottlng = new Array();
var markers = [];

var radius='';


function currentPositionUpdated(coord)
{
    //
    //	If "error" is set it contains a String explaining why the call failed.
    //
    if (coord.error)
    {
        Emotive.Ui.Dialog.alert(coord.error);
    }
    // Otherwise extract the latitude and longitude
    else
    {
        // var location = document.getElementById('location_info');
        //location.innerHTML = "Your current latitude is " + coord.latitude + ", and your current longitude is " + coord.longitude;
        // alert("Your current latitude is " + coord.latitude + ", and your current longitude is " + coord.longitude);
        Emotive.Data.myPosition = new google.maps.LatLng(coord.latitude, coord.longitude);

    }
}

// Begin monitoring the current position
function openLocation()
{
    // Provide the callback to the function that will get called every time the coordinates update
    Emotive.Device.Gps.watchPosition(currentPositionUpdated);
}

// Stop monitoring the current position
function closeLocation()
{
    //
    //	Turn off location services
    //
    Emotive.Device.Gps.watchPosition(null);

//    var locationInfo = document.getElementById('location_info');
//    locationInfo.innerHTML ="";
}



// Loads the map
function loadMap() {
    //
    // Initialize a position to be used as the center of the map (and where we will show a marker).
    // 
    //Emotive.Data.myPosition = new google.maps.LatLng(37.8071984, -122.2637331);

    var mapOptions = 
    {
        center : Emotive.Data.myPosition,
        zoom : 12,
        mapTypeId : google.maps.MapTypeId.ROADMAP
    };

    //
    //  Give the map its final size
    //
    $("#map_canvas").css('height',Emotive.Ui.getClientHeight() + "px");
    $("#map_canvas").css('width',Emotive.Ui.getClientWidth() + "px");

    // Create the map
    Emotive.Data.googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    // Bind the listener for canvas resize (in the event of a change from portrait to landscape)
    google.maps.event.addListener(document.getElementById("map_canvas"), 'resize', 
        function()
        {
            $("#map_canvas").css('height',Emotive.Ui.getClientHeight() + "px");
            $("#map_canvas").css('width',Emotive.Ui.getClientWidth() + "px");
            Emotive.Data.googleMap.setCenter(Emotive.Data.myPosition);

        });

    //
    //  Create a visible marked on the map
    //
    var marker = new google.maps.Marker(
    {
        position: Emotive.Data.myPosition,
        map: Emotive.Data.googleMap,
        title: "Emotive"
    });
        
    //Drop marker by the user
    google.maps.event.addListener(Emotive.Data.googleMap, 'click', function(event) {
        if(!MarkerAdded){
            var myLatLng = event.latLng;
            UserDropMarkerLat = myLatLng.lat();
            UserDropMarkerLng = myLatLng.lng();
            //Get cordinates of marker where user drop it on map 
            var UserPin = new google.maps.LatLng(UserDropMarkerLat, UserDropMarkerLng);
                   
                    
            UserDropMarker = new google.maps.Marker({
                position: event.latLng, 
                map: Emotive.Data.googleMap,
                draggable: true,
                animation: google.maps.Animation.DROP
            });
        }//if(MarkerAdded) close
        MarkerAdded=1;
    });
    
}

function FilterStores(){
    
    radius=$("#radius").val();
    Emotive.App.changePage("#FilterStoresOnMapPage");
    
    QueryDataFilter();
}
function QueryDataFilter(){
    var requestedQueries = new Array();
    requestedQueries.push(new DeclareDataValueObject("DM.Account","Account"));
    requestedQueries.push(new QueryRequestObject({
        op:'SELECT', 
        targetType:'Account',
        where:{
            "Name":"11 C Food Store"
        },
        options: {
            "limit":1
        }
    },"DM.allAccounts","DM.allAccountsHash",{
        extraHashKey:"externalId"
    }));

    //  In most apps this call will include REST requests to the Emotive Mobile Messaging Server (MMS). In this
    //  simple example we just declare the "Emotive.Data.hello" data value and immediately invoke the onRequestDataReady()
    //  callback function below.
    //
    Emotive.Service.submit(requestedQueries, ShowFilterMap);
    
}

function ShowFilterMap(){
    var markerLatLng = '';//Get lat lng in the format that google accept
 
    var AreaInMiles='';  //Calculate total area between two markers
        
    for (var i = 0; i < DM.allAccounts.length; i++) {
        var account = DM.allAccounts[i];
        if(account.Longitude__c==null){
            account.Longitude__c='';
        }
        if(account.Latitude__c==null){
            account.Latitude__c='';
        }
        Abbottlat[i]=account.Latitude__c;
        Abbottlng[i]=account.Longitude__c;
        
    }
    // alert(Abbottlat[0]);
    

    
    var UserPinCoords= new google.maps.LatLng(UserDropMarkerLat, UserDropMarkerLng);
   
    var mapOptionsFilterMap = 
    {
        center : UserPinCoords,
        zoom : 12,
        mapTypeId : google.maps.MapTypeId.ROADMAP
    };
    var FilterMap = new google.maps.Map(document.getElementById("FilterStoresMap"), mapOptionsFilterMap);
    
    google.maps.event.addListener(document.getElementById("FilterStoresMap"), 'resize', 
        function()
        {
            $("#FilterStoresMap").css('height',Emotive.Ui.getClientHeight() + "px");
            $("#FilterStoresMap").css('width',Emotive.Ui.getClientWidth() + "px");
            FilterMap.setCenter(UserPinCoords);
        });
        
       
       
    for(var i=0;i<Abbottlat.length;i++){
           
        markerLatLng = new google.maps.LatLng(Abbottlat[i], Abbottlng[i]);
        AreaInMiles= google.maps.geometry.spherical.computeDistanceBetween(UserPinCoords,markerLatLng,3963.19)
        alert('AbbortLat='+Abbottlat[i]+' Abbottlng='+Abbottlng[i]+'AreaInMiles=+' +AreaInMiles+' Radius='+radius +'UserPinCoords='+UserPinCoords+' markerLatLng='+markerLatLng);
        if(AreaInMiles<radius){
            MarkerForUser.push({
                "lat": Abbottlat[i], 
                "lng": Abbottlng[i]
            });
        }
        
    }
    
    
    for(var i=0;i<MarkerForUser.length;i++){
        var StoresForUser = {
            map: FilterMap, 
            position: new google.maps.LatLng(35.4085,-119.0336)
        }
        var marker = new google.maps.Marker(StoresForUser);
        markers.push(marker);   
    }
//   alert(MarkerForUser[0].lat);
   
    
}

