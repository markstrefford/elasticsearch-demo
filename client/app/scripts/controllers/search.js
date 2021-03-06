'use strict';

angular.module('searchModule', ['leaflet-directive', 'esService'])
    .controller('SearchCtrl', ['$scope', 'es', function ($scope, es) {

        var search={};
        angular.extend($scope, {center: {
                    lat: 53.45,
                    lng: -2.48,
                    zoom: 10
                }});
        angular.extend($scope, {markers: {}});
        angular.extend($scope, {hotels: {}});
        $scope.stats = {esFrom: 0, esSize: 25};

        // Called from search.html "Search" button
        $scope.refineSearch = function (query, adults, children) {
            //console.log(query, adults, children);
            newSearch({ "fields": [ "id", "name", "geo", "description", "star_rating", "cust_rating"],
                "from" : $scope.stats.esFrom, "size" : $scope.stats.esSize,
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "nested_hotel.room.adults": {
                                        "gte": adults
                                    }
                                }
                            },
                            {
                                "range": {
                                    "nested_hotel.room.children": {
                                        "gte": children
                                    }
                                }
                            },
                            {
                                "fuzzy": {
                                    "nested_hotel.description": {
                                        "value": query
                                    }
                                }
                            }
                        ],
                        "must_not": [ ],
                        "should": [ ]
                    }
                },
                "sort": [ ],
                "facets": { }
            });
        }

        // Call es with a search query
        var newSearch = function (searchReq) {
            console.log("search(): " + JSON.stringify(searchReq));
            var m = {},
                h = {};
            es.search({
                host: 'localhost:9200',
                index: 'hotels',
                type: 'nested_hotel',
                body: searchReq
            }).then(function (body) {
                    // Iterate through results and update $scope
                    $scope.stats.numResults = body.hits.total;
                    var searchRes = body.hits.hits;

                    for (var i in searchRes) {
                        var hotel = searchRes[i];
                        m[hotel._id] = {
                            "lat": hotel.fields.geo[1],
                            "lng": hotel.fields.geo[0],
                            "message": hotel.fields.name[0],
                            "draggable": false
                        };
                        h[hotel._id] = {
                            "name": hotel.fields.name[0],
                            "description": hotel.fields.description[0],
                            "starrating": hotel.fields.star_rating[0],
                            "custrating": hotel.fields.cust_rating[0]

                        }
                    }
                    $scope.hotels=h;
                    $scope.markers=m;
                    console.log(JSON.stringify(m));
                    //$scope.apply;
                }, function (error) {
                    console.trace(error.message);
                });
        }

        // Set up a default query
        search.request = { "fields": [ "id", "name", "geo", "description", "star_rating", "cust_rating"],
            "from" : $scope.stats.esFrom, "size" : $scope.stats.esSize,
            "query": {
                "term": {
                    "description": "spa"
                }
            }}

        // Now render the map with the default search
        newSearch(search.request);

    }])
;


