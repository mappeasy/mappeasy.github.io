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
        console.log('No endpoint found for the given UNITID.');
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
        console.log('No endpoint found for the given UNITID.');
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
        const queryUrl_gravitymain = `${gravityMain_layer}/query?where=UNITID = '${currentUnitId}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;
        //const queryUrl = `https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3/query?where=UNITID = '${currentUnitId}'&outFields=FACILITYID,UFID,UPSTREAMMANHOLENUMBER,DOWNSTREAMMANHOLENUMBER,DIAMETER,MEASUREDLENGTH,UNITID,UNITID2,MAINCOMP2,UFID&outSR=4326&f=pjson`;
        const queryUrl_by_DNS_gravitymain = `${gravityMain_layer}/query?where=UPSTREAMMANHOLENUMBER = '${lastDownstreamManholeNumber}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;

        const queryUrl_forcemain = `${forceMain_layer}/query?where=UNITID = '${currentUnitId}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;
        const queryUrl_by_DNS_forcemain = `${forceMain_layer}/query?where=UPSTREAMMANHOLENUMBER = '${lastDownstreamManholeNumber}'&outFields=${outfieldLine}&outSR=4326&f=pjson`;

        iterationCount++;
        if (iterationCount > maxIterations) {
            console.log('Maximum iterations reached, stopping to prevent infinite loop.');
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
                console.log('No more features found.');
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

    console.log('No features found within the maximum search distance.');
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
    // Extract the addresses and remove the street numbers
    let streetNames = data.map(item => item.properties.ADDRESS.replace(/^\d+\s/, ''));

    // Get unique street names
    let uniqueStreetNames = [...new Set(streetNames)];

    return uniqueStreetNames;
}
function roundToDecimals(num, decimals) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(num * multiplier) / multiplier;
}
function calculateRoute(data) {
    let total_len_ft = 0.00;
    let toal_second_min = 0.00;
    let toal_second_max = 0.00;
    let total_len_mi = 0.00
    for (let i = data.length - 1; i >= 0; i--) {
        total_len_ft = total_len_ft + data[i].properties["SHAPE.STLength()"];
        //There are a lot of factors that might contribute to the rate of flow; this estimate assumes a flow of between 1 and 3 feet/second in Gravity Main; between 2 to 8 feet/second in Forcemain.
        if(data[i].properties["SUBTYPECD"] === 1 || data[i].properties["SUBTYPECD"] === 2){ //force main
            toal_second_min = toal_second_min + data[i].properties["SHAPE.STLength()"]/8.0; //in seconds
            toal_second_max = toal_second_max + data[i].properties["SHAPE.STLength()"]/2.0;
        } else { //gravity main
            toal_second_min = toal_second_min + data[i].properties["SHAPE.STLength()"]/3.0; //in seconds
            toal_second_max = toal_second_max + data[i].properties["SHAPE.STLength()"]/1.0;
        }

    }
    total_len_ft = roundToDecimals(total_len_ft, 2);
    total_len_mi = roundToDecimals(total_len_ft / 5280, 2);
    let total_hour_min = roundToDecimals(toal_second_min / 3600, 2);
    let total_hour_max = roundToDecimals(toal_second_max / 3600, 2);
    return {total_len_ft,total_len_mi,total_hour_min,total_hour_max};
}
