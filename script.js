async function queryFeaturesByEndPoint(mapServer, unitID) {
    // Step 1: Query to get the endpoint of the line
    let endPoint = null;
    const queryUrl = `${mapServer}/query?where=UNITID='${unitID}'&outFields=FACILITYID,UPSTREAMMANHOLENUMBER,DOWNSTREAMMANHOLENUMBER,DIAMETER,UNITID,UNITID2,MAINCOMP2,UFID,SHAPE.STLength()&outSR=4326&f=pjson`;
    try {
        let response = await fetch(queryUrl);
        let data = await response.json();
        if (data.features.length > 0) {
            let paths = data.features[0].geometry.paths;
            let lastPath = paths[paths.length - 1];
            endPoint = lastPath[lastPath.length - 1]; // Last point of the last path
        }
    } catch (error) {
        console.error('Error fetching endpoint:', error);
        return null;
    }
    // Check if endPoint was successfully retrieved
    if (!endPoint) {
        return null;
    }

    // Step 2: Query to find intersecting features at the endpoint, excluding the original UNITID
    const intersectQueryUrl = `${mapServer}/query?geometry={"x": ${endPoint[0]}, "y": ${endPoint[1]}}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FACILITYID,UPSTREAMMANHOLENUMBER,DOWNSTREAMMANHOLENUMBER,DIAMETER,UNITID,UNITID2,MAINCOMP2,UFID,SHAPE.STLength()&outSR=4326&f=pjson`;
    try {
        let intersectResponse = await fetch(intersectQueryUrl);
        let intersectData = await intersectResponse.json();
        let intersectingFeatures = intersectData.features.filter(feature => feature.attributes.UNITID !== unitID || feature.attributes.UNITID2 !== unitID);
        return intersectingFeatures;
    } catch (error) {
        console.error('Error fetching intersecting features:', error);
        return null;
    }
}
async function queryFeature2AtFeature1(mapServerFeature1, mapServerFeature2, unitID, outfieldLine) {
    // Step 1: Query to get the endpoint of the line
    let endPoint = null;
    const queryUrl = `${mapServerFeature1}/query?where=UNITID='${unitID}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;
    try {
        let response = await fetch(queryUrl);
        let data = await response.json();
        if (data.features.length > 0) {
            let paths = data.features[0].geometry.paths;
            let lastPath = paths[paths.length - 1];
            endPoint = lastPath[lastPath.length - 1]; // Last point of the last path
        }
    } catch (error) {
        console.error('Error fetching endpoint:', error);
        return [];
    }

    // Check if endPoint was successfully retrieved
    if (!endPoint) {
        return [];
    }

    // Step 2: Query to find intersecting features at the endpoint, excluding the original UNITID
    const intersectQueryUrl = `${mapServerFeature2}/query?geometry={"x": ${endPoint[0]}, "y": ${endPoint[1]}}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=${outfieldLine}&outSR=4326&f=pjson`;
    try {
        let intersectResponse = await fetch(intersectQueryUrl);
        let intersectData = await intersectResponse.json();
        let intersectingFeatures = intersectData.features.filter(feature => feature.attributes.UNITID !== unitID && feature.attributes.UNITID2 !== unitID);
        //let intersectingFeatures = intersectData.features.filter(feature => feature.attributes.UNITID !== unitID);
        return intersectingFeatures;
    } catch (error) {
        console.error('Error fetching intersecting features:', error);
        return [];
    }
}
async function queryFeaturesAndGetGeoJson(initialUnitId, stopPoint) {
    let currentUnitId = initialUnitId;
    let currentUnitId_ups = initialUnitId;
    let lastDownstreamManholeNumber = "";
    let keepQuerying = true;
    let ufidArray = [];
    let unitidArray = [];
    let geojsonFeatures = [];
    let iterationCount = 0;
    const maxIterations = 250; // Adjust this value as needed
    let loopCount = 0;
    const forcemain_enable = true;
    const gravityMain_layer = "https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/1"
    const forceMain_layer = "https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/4"
    outfieldLine = "FACILITYID,UPSTREAMMANHOLENUMBER,DOWNSTREAMMANHOLENUMBER,DIAMETER,UNITID,UNITID2,MAINCOMP2,UFID,SHAPE.STLength(),ADDRESS,SUBTYPECD"
    let stopPoints =[];
    while (keepQuerying) {
        try{
            if (bad_gis_case[currentUnitId])
            {
                console.log("reassigned: ", currentUnitId, " to ",(bad_gis_case[currentUnitId]);
                currentUnitId = bad_gis_case[currentUnitId];
            }            
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        const queryUrl_gravitymain = `${gravityMain_layer}/query?where=UNITID = '${currentUnitId}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;
        //const queryUrl = `https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3/query?where=UNITID = '${currentUnitId}'&outFields=FACILITYID,UFID,UPSTREAMMANHOLENUMBER,DOWNSTREAMMANHOLENUMBER,DIAMETER,MEASUREDLENGTH,UNITID,UNITID2,MAINCOMP2,UFID&outSR=4326&f=pjson`;
        const queryUrl_by_DNS_gravitymain = `${gravityMain_layer}/query?where=UPSTREAMMANHOLENUMBER = '${lastDownstreamManholeNumber}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;

        const queryUrl_forcemain = `${forceMain_layer}/query?where=UNITID = '${currentUnitId}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;
        const queryUrl_by_DNS_forcemain = `${forceMain_layer}/query?where=UPSTREAMMANHOLENUMBER = '${lastDownstreamManholeNumber}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;

        //manual adding detection if prv
        iterationCount++;
        if (iterationCount > maxIterations) {
            keepQuerying = false; //no need
            break;
        }
        try {
            let response = await fetch(queryUrl_gravitymain);

            let data = await response.json();

            //if data by UnitID2 is empty then check by downstream
            if (data.features.length === 0) {
                let tmp_data = await queryFeature2AtFeature1(gravityMain_layer, forceMain_layer, currentUnitId_ups, outfieldLine);
                if (tmp_data.length > 0) {
                    data.features = tmp_data;
                } else {
                    tmp_data = await queryFeature2AtFeature1(gravityMain_layer, gravityMain_layer, currentUnitId_ups, outfieldLine);
                    if (tmp_data.length > 0) {
                        data.features = tmp_data;
                    }
                }
            }
            //considering move this guy down to HEAD__DNS

            if (loopCount > 0) {
                data.features = [];
            }
            if (forcemain_enable === true) {
                if (data.features.length === 0) {
                    response = await fetch(queryUrl_forcemain);
                    data = await response.json();
                }
                if (data.features.length === 0) {
                    response = await fetch(queryUrl_by_DNS_forcemain);
                    data = await response.json();
                }

                if (data.features.length === 0) {
                    let tmp_data = await queryFeature2AtFeature1(forceMain_layer, forceMain_layer, currentUnitId_ups, outfieldLine);
                    if (tmp_data.length > 0) {
                        data.features = tmp_data;
                    }
                }
                if (data.features.length === 0) {
                    let tmp_data = await queryFeature2AtFeature1(forceMain_layer, gravityMain_layer, currentUnitId_ups, outfieldLine);
                    if (tmp_data.length > 0) {
                        data.features = tmp_data;
                    }
                }
            }
            //I/m not sure if this is the best place to put this
            if (data.features.length === 0) {
                response = await fetch(queryUrl_by_DNS_gravitymain);
                data = await response.json();
            }
            if (data.features.length === 0) {
                keepQuerying = false;
            } else {
                // Process the features
                let selectedFeature = data.features[0]; // Default to the first feature

                if (data.features.length > 1) {
                    // If there are multiple features, find the one with the largest diameter where UNITID !== UNITID2
                    // If they have the same size, select the first one where UNITID !== UNITID2
                    selectedFeature = data.features.reduce((selected, current) => {
                        const isCurrentLarger = current.attributes.DIAMETER > selected.attributes.DIAMETER;
                        const isDifferentUnitId = current.attributes.UNITID !== current.attributes.UNITID2;

                        if (isCurrentLarger) {
                            return current; // Select larger diameter
                        } else if (selected.attributes.DIAMETER === current.attributes.DIAMETER && isDifferentUnitId) {
                            return current; // Same size, but different UNITID, so select current
                        }
                        return selected; // Otherwise, keep the selected feature
                    }, data.features[0]);
                }

                if (ufidArray.includes(selectedFeature.attributes.UFID)) {
                    loopCount = loopCount + 1;
                } else {
                    loopCount = 0;
                    // Add to arrays and GeoJSON features
                    ufidArray.push(selectedFeature.attributes.UFID);

                    // Convert ArcGIS geometry to GeoJSON format
                    const geojsonGeometry = {
                        type: "LineString",
                        coordinates: selectedFeature.geometry.paths[0]
                    };

                    geojsonFeatures.push({
                        type: "Feature",
                        properties: selectedFeature.attributes,
                        geometry: geojsonGeometry
                    });
                }
                if (!ufidArray.includes(selectedFeature.attributes.UNITID)) {
                    unitidArray.push(selectedFeature.attributes.UNITID);
                    stopPoints.push({
                            "type": selectedFeature.attributes.MAINCOMP2,
                            "unitID": selectedFeature.attributes.UNITID2
                        }
                    );
                }


                // Check MAINCOMP2 value
                if (selectedFeature.attributes.UNITID2 === currentUnitId) {
                    lastDownstreamManholeNumber = selectedFeature.attributes.DOWNSTREAMMANHOLENUMBER
                    currentUnitId = "SameUNITID"
                    //keepQuerying = false;
                } else {
                    // Continue with the next UNITID2
                    currentUnitId = selectedFeature.attributes.UNITID2;
                    currentUnitId_ups = selectedFeature.attributes.UNITID;
                    lastDownstreamManholeNumber = selectedFeature.attributes.DOWNSTREAMMANHOLENUMBER;
                }
                if (currentUnitId == "" && lastDownstreamManholeNumber === "") {
                    keepQuerying = false;
                }
                if ([98].includes(selectedFeature.attributes.MAINCOMP2) || [98].includes(selectedFeature.attributes.MAINCOMP1)) {          
                    keepQuerying = false;
                }

            }
        } catch (error) {
            console.error('Error fetching data:', error);
            keepQuerying = false;
        }
    }

    // Construct GeoJSON
    const geojson = {
        type: "FeatureCollection",
        features: geojsonFeatures
    };

    return { ufidArray, unitidArray, stopPoints,geojson };
}


async function findNearestFeatureUnitId(longitude, latitude) {
    let distance = 50; // Initial distance in feet
    const maxDistance = 1000; // Maximum distance to search - adjust as needed
    const increment = 10; // Distance increment in feet

    while (distance <= maxDistance) {
        const queryUrl = `https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/12/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=${distance}&outFields=UNITID&geometry={"x":${longitude},"y":${latitude}}&units=esriSRUnit_Foot&f=json`;

        try {
            const response = await fetch(queryUrl);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                // Return the UNITID of the first feature found
                return data.features[0].attributes.UNITID;
            }

            // Increment the search distance and try again
            distance += increment;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null; // Or handle the error as needed
        }
    }

    return null;
}

//find by unitID
async function findLSWWTP(assetType, unitID) {
    let outfield = "FACILITYNAME,ADDRESS"
    let queryUrl = ""
    //98: wwtp - 15: lift station - 25: PS
    if([98,15,25].includes(assetType)){
         queryUrl = `https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/16/query?where=UNITID='${unitID}'&outFields=${outfield}&f=pjson&outSR=4326`;
    } else {
         let queryUrl_manhole = `https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/12/query?where=UNITID='${unitID}'&outFields=TREATMENTPLANTID&f=pjson&outSR=4326`;
         let response = await fetch(queryUrl_manhole);
         let data = await response.json();
         if (data.features.length > 0) {
             let refID =  data.features[0].attributes.TREATMENTPLANTID;
             refID = "0"+refID.toString();
             queryUrl = `https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer/16/query?where=REFERENCEID='${refID}'&outFields=${outfield}&f=pjson&outSR=4326`;
         } else {
            return null;
         }
    }
    try {
        let response = await fetch(queryUrl);
        let data = await response.json();
        if (data.features.length > 0) {
            let info = data.features[0].attributes;
            if(info.ADDRESS.includes("3005 GALVESTON")){
                info.FACILITYNAME = "SIMS BAYOU SOUTH";
            }
            try{
                info.FACILITYNAME = info.FACILITYNAME.replace("SLUDGE","WWTP");
            } catch (error) {}
            let location = data.features[0].geometry;
            return {info,location};
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function getUniqueStreetNames(data) {
    let streetNames = data.map(item => {
        try {
            // Attempt to extract and process the address
            return item.properties.ADDRESS.replace(/^\d+\s/, '');
        } catch (e) {
            // If an error occurs, return a unique value that signifies an error
            return "__INVALID_ADDRESS__";
        }
    });

    // Filter out any invalid addresses and get unique street names
    let uniqueStreetNames = [...new Set(streetNames)].filter(name => name !== "__INVALID_ADDRESS__");

    return uniqueStreetNames;
}

function getUniqueSuperNeighborhood(data) {
    let neighborhoodName = data.map(item => {
        try {
            // Attempt to extract and process the address
            return item.attributes.SNBNAME;
        } catch (e) {
            // If an error occurs, return a unique value that signifies an error
            return "__INVALID_NAME__";
        }
    });
    // Filter out any invalid addresses and get unique street names
    let neighborhoodNameUnique = [...new Set(neighborhoodName)].filter(SNBNAME => SNBNAME !== "__INVALID_NAME__");

    return neighborhoodNameUnique;
}

function roundToDecimals(num, decimals) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(num * multiplier) / multiplier;
}
function calculateRoute(data) {
    let total_len_ft = 0.00;
    let total_second_min = 0.00;
    let total_second_max = 0.00;

    for (let i = 0; i < data.length; i++) {
        let length = data[i].properties["SHAPE.STLength()"];
        let type = data[i].properties["SUBTYPECD"];

        if (length === undefined || isNaN(length)) {
            continue;
        }

        total_len_ft += length;

        if (type === 1 || type === 2) { // force main
            total_second_min += length / 8.0; // in seconds
            total_second_max += length / 2.0;
        } else { // gravity main
            total_second_min += length / 3.0; // in seconds
            total_second_max += length / 1.0;
        }
    }

    total_len_ft = roundToDecimals(total_len_ft, 2);
    let total_len_mi = roundToDecimals(total_len_ft / 5280, 2);
    let total_hour_min = roundToDecimals(total_second_min / 3600, 2);
    let total_hour_max = roundToDecimals(total_second_max / 3600, 2);

    return {total_len_ft, total_len_mi, total_hour_min, total_hour_max};
}


function makeDraggable(dragHandles, draggableElement) {
    var offsetX, offsetY, initialMouseX, initialMouseY;

    dragHandles.forEach(function(dragHandle) {
        dragHandle.addEventListener('mousedown', function(e) {
            offsetX = draggableElement.offsetLeft;
            offsetY = draggableElement.offsetTop;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            e.preventDefault(); // Prevents text selection during drag
        });
        dragHandle.style.cursor = 'move';
    });

    function onMouseMove(e) {
        draggableElement.style.left = offsetX + e.clientX - initialMouseX + 'px';
        draggableElement.style.top = offsetY + e.clientY - initialMouseY + 'px';
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function processGeoJsonData(geojsonData) {
    let processedFeatures = [];

    for (let i = 0; i < geojsonData.features.length - 1; i++) {
        let currentFeature = geojsonData.features[i];
        let nextFeature = geojsonData.features[i + 1];

        // Add the current feature
        processedFeatures.push(currentFeature);

        // Check if there's a discontinuity
        let currentEnd = currentFeature.geometry.coordinates[currentFeature.geometry.coordinates.length - 1];
        let nextStart = nextFeature.geometry.coordinates[0];

        if (currentEnd[0] !== nextStart[0] || currentEnd[1] !== nextStart[1]) {
            // Discontinuity detected, insert the missing segment
            let missingSegment = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [currentEnd, nextStart]
                },
                properties: {} // Add any necessary properties for the missing segment
            };
            processedFeatures.push(missingSegment);
        }
    }

    // Add the last feature
    processedFeatures.push(geojsonData.features[geojsonData.features.length - 1]);

    return {
        type: 'FeatureCollection',
        features: processedFeatures
    };
}

function calculateBoundingBox(geojsonData) {
    let minLat = Infinity;
    let minLng = Infinity;
    let maxLat = -Infinity;
    let maxLng = -Infinity;

    geojsonData.features.forEach(feature => {
        feature.geometry.coordinates.forEach(coord => {
            // Assuming LineString coordinates [lng, lat]
            let lng = coord[0];
            let lat = coord[1];

            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        });
    });

    return [[minLat, minLng], [maxLat, maxLng]]; // SouthWest and NorthEast corners
}

function calculateBoundingBoxWithBuffer(geojsonData) {
    let minLat = Infinity;
    let minLng = Infinity;
    let maxLat = -Infinity;
    let maxLng = -Infinity;

    geojsonData.features.forEach(feature => {
        feature.geometry.coordinates.forEach(coord => {
            let lng = coord[0];
            let lat = coord[1];

            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        });
    });

    // Convert 100 feet buffer to degrees
    let latBuffer = 100 / 364000; // Approximation
    let avgLat = (minLat + maxLat) / 2;
    let lngBuffer = 100 / (Math.cos(avgLat * Math.PI / 180) * 364000); // Adjusted for avg latitude

    // Apply the buffer
    minLat -= latBuffer;
    maxLat += latBuffer;
    minLng -= lngBuffer;
    maxLng += lngBuffer;

    return [[minLat, minLng], [maxLat, maxLng]]; // SouthWest and NorthEast corners
}


async function calculateUnifiedBoundaryWithBuffer_polygon(geojsonData) {
    const bufferDistanceInMeters = 700 * 0.3048; // Convert 200 feet to meters

    // Combine all lines into a single MultiLineString or use them as is if already combined
    let combinedGeometry = turf.combine(geojsonData);

    // Apply buffer to the combined geometry
    const buffered = turf.buffer(combinedGeometry, bufferDistanceInMeters, { units: 'meters' });

    // Calculate the convex hull of the buffered area, if desired, for a simplified outer boundary
    const convexHull = turf.convex(buffered);
    return convexHull;
}

async function calculateUnifiedBoundaryWithBuffer_polygon_V1(geojsonData) {
    // Adjust buffer size to 500 feet in meters
    const bufferDistanceInMeters = 500 * 0.3048; // 500 feet in meters

    // Step 1: Buffer the GeoJSON data slightly
    const buffered = turf.buffer(geojsonData, bufferDistanceInMeters, { units: 'meters' });

    // step2: merge and dissolve all buffer into 1 polygon
    return buffered;
}

async function calculateUnifiedBoundaryWithBuffer_polygon_V2(geojsonData,qualityFactor,buffer_size) {

    const bufferDistanceInMeters = buffer_size * 0.3048;

    // Simplify the GeoJSON data first to reduce complexity
    const simplifiedGeojson = turf.simplify(geojsonData, {tolerance: 0.001, highQuality: true});

    // Combine all features into a single feature for buffering (if they are lines or polygons)
    // This step assumes your GeoJSON is a FeatureCollection
    let combinedFeature;
    if (simplifiedGeojson.features.length > 1) {
        combinedFeature = turf.combine(simplifiedGeojson);
        // turf.combine wraps the combined feature in a FeatureCollection
        combinedFeature = combinedFeature.features[0]; // Assuming we want the first feature
    } else {
        combinedFeature = simplifiedGeojson.features[0]; // Use the single feature directly
    }

    // Buffer the combined or single simplified feature
    const buffered = turf.buffer(combinedFeature, bufferDistanceInMeters, { units: 'meters' });
    const simplifiedBuffer  = turf.simplify(buffered, {tolerance: qualityFactor, highQuality: true});

    const generalBound = turf.convex(buffered);
    // Extract the coordinates of the simplified buffer polygon
    // Assuming the simplifiedBuffer is a Feature or FeatureCollection
    let coordinates;
    if (simplifiedBuffer.type === 'FeatureCollection') {
        // If the simplifiedBuffer is a FeatureCollection, take the first feature's geometry
        coordinates = simplifiedBuffer.features[0].geometry.coordinates;
    } else if (simplifiedBuffer.type === 'Feature') {
        // If the simplifiedBuffer is a single Feature, take its geometry
        coordinates = simplifiedBuffer.geometry.coordinates;
    } else {
        return null;
    }

    // Convert the coordinates to a format suitable for esriGeometryPolygon
    const esriPolygonGeometry = {
        "rings": coordinates,
        "spatialReference": {"wkid": 4326}
    };    
    return {simplifiedBuffer,esriPolygonGeometry,generalBound}; // Return the highly simplified buffered shape
}


async function queryPointsWithinBoundingBox(bbox) {
    let baseUrl = "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/RSSO_Package/FeatureServer/0/query";
    let geometry = encodeURIComponent(JSON.stringify({
        xmin: bbox[0][1],
        ymin: bbox[0][0],
        xmax: bbox[1][1],
        ymax: bbox[1][0],
        spatialReference: { wkid: 4326 }
    }));
    let query = "SYSTEM like '%blic%' AND STARTDATE >= date '2022-01-01'";
    let queryUrl = `${baseUrl}?where=${query}&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=json`;

    try {
        const response = await fetch(queryUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // Return the data to be used where the function is called
    } catch (error) {
        console.error("Query failed:", error);
        return null; // Return null to indicate failure
    }
}

//super neighborhood: "https://mycity2.houstontx.gov/pubgis02/rest/services/HoustonMap/Administrative_Boundary/MapServer/3/query"
//SSO:  "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/RSSO_Package/FeatureServer/0/query"
// let query = "SYSTEM like '%blic%' AND STARTDATE >= date '2022-01-01'";
// let query = "1=1"
async function queryGISWithinPolygon(arcgis_url,query_cmd, esriPolygonGeometry) {
    let baseUrl = arcgis_url;
    let geometry =  encodeURIComponent(JSON.stringify(esriPolygonGeometry));
    let query = query_cmd;
    let queryUrl = `${baseUrl}?where=${query}&geometry=${geometry}&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=json`;

    try {
        const response = await fetch(queryUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // Return the data to be used where the function is called
    } catch (error) {
        return null; // Return null to indicate failure
    }
}

function isPointInsideBoundary(latlng, boundary) {
    // Create a point from latlng
    const point = turf.point([latlng.lng, latlng.lat]);

    // Assuming boundary is a valid GeoJSON Polygon or MultiPolygon
    const isInside = turf.booleanPointInPolygon(point, boundary);

    return isInside;
}

function moveMarkerSmoothly(marker, to, duration) {
    var from = marker.getLatLng();
    var start = Date.now();
    var step = function() {
        var elapsed = Date.now() - start;
        marker.setLatLng({
            lat: from.lat + (to.lat - from.lat) * elapsed / duration,
            lng: from.lng + (to.lng - from.lng) * elapsed / duration
        });
        if (elapsed < duration) {
            requestAnimationFrame(step);
        }
    };
    step();
}

function isElementVisible(element) {
    var style = window.getComputedStyle(element);
    return style.width !== "0" && style.height !== "0" && style.opacity !== "0" && style.display !== 'none' && style.visibility !== 'hidden';
}

function findNearestPointOnBoundary(point, boundary) {
    // Convert the point to a GeoJSON Point if it's not already
    var geoJsonPoint = (point instanceof L.LatLng) ? 
                       turf.point([point.lng, point.lat]) : point;

    // Assuming boundary is a GeoJSON Polygon (from turf.convex)
    var line = turf.polygonToLine(boundary); // Convert boundary polygon to a line

    var nearestPoint = turf.nearestPointOnLine(line, geoJsonPoint, { units: 'meters' });

    return L.latLng(nearestPoint.geometry.coordinates[1], nearestPoint.geometry.coordinates[0]);
}
