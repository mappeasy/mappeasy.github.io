<!DOCTYPE html>
<html>
<head>
    <title>OpenLayers Map with Custom Layer Control</title>
    <style>
        #mapid {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
        }
        .custom-layer-switcher {
            position: absolute;
            bottom: 40px; /* Adjusted to make room for the toggle button */
            right: 10px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 4px;
            padding: 5px;
            z-index: 1000;
            display: none; /* Initially hidden */
        }
        .layer-group {
            margin-bottom: 5px;
        }
        .layer-group-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .ol-attribution {
            bottom: 10px;
            left: 10px;
        }
        .toggle-button {
            position: absolute;
            bottom: 10px;
            right: 10px;
            z-index: 1001;
            cursor: pointer;
            background-color: rgba(0, 60, 136, 0.7);
            color: white;
            padding: 5px;
            border-radius: 4px;
        }
    </style>
    <link rel="stylesheet" href="https://openlayers.org/en/v6.5.0/css/ol.css" type="text/css">
    <script src="https://openlayers.org/en/v6.5.0/build/ol.js" type="text/javascript"></script>
</head>
<body>
<div id="mapid"></div>
<div class="toggle-button" id="toggle-button">Layers</div>
<div class="custom-layer-switcher" id="layer-switcher">
    <div class="layer-group">
        <div class="layer-group-title">Layers</div>
        <div><input type="checkbox" id="layer1-checkbox" checked> Gravity Main</div>
        <div><input type="checkbox" id="layer2-checkbox" checked> Gravity Main Label</div>
        <div><input type="checkbox" id="layer3-checkbox" checked> Manhole</div>
        <div><input type="checkbox" id="layer4-checkbox" checked> Manhole Label</div>
        <div><input type="checkbox" id="layer5-checkbox" checked> LS/WWTP</div>
        <div><input type="checkbox" id="layer6-checkbox" checked> LS/WWTP Label</div>
        <!-- Add more layers as needed -->
    </div>
</div>
<script>
    var map = new ol.Map({
        target: 'mapid',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: 'Base Layer'
            }),
            new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:1'}
                }),
                title: 'Gravity Main',
                visible: true // Initially hidden
            }),
            new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:2'}
                }),
                title: 'Gravity Main Label',
                visible: true // Initially hidden
            }),
			new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:12'}
                }),
                title: 'Manhole',
                visible: true // Initially hidden
            }),
            new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:13'}
                }),
                title: 'Manhole Label',
                visible: true // Initially hidden
            }),	
			new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:16'}
                }),
                title: 'LS/WWTP Label',
                visible: true // Initially hidden
            }),
            new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: 'https://geogimsms.houstontx.gov/arcgis/rest/services/HW/WasteWaterUtilities_gx/MapServer',
                    params: {LAYERS: 'show:17'}
                }),
                title: 'LS/WWTP Label',
                visible: true // Initially hidden
            }),				
            // Add more layers here
        ],
        view: new ol.View({
			center: ol.proj.fromLonLat([-95.3698, 29.7604]), // Center on Houston
            zoom: 11 // Adjusted zoom level
        })
    });

    document.getElementById('layer1-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(1).setVisible(e.target.checked);
    });
    document.getElementById('layer2-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(2).setVisible(e.target.checked);
    });
    document.getElementById('layer3-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(3).setVisible(e.target.checked);
    });
    document.getElementById('layer4-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(4).setVisible(e.target.checked);
    });
    document.getElementById('layer5-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(5).setVisible(e.target.checked);
    });
    document.getElementById('layer6-checkbox').addEventListener('change', function (e) {
        map.getLayers().item(6).setVisible(e.target.checked);
    });	

    // Toggle layer switcher visibility
    document.getElementById('toggle-button').addEventListener('click', function() {
        var layerSwitcher = document.getElementById('layer-switcher');
        layerSwitcher.style.display = layerSwitcher.style.display === 'none' ? 'block' : 'none';
    });

    // Click outside to collapse the layer switcher
    document.addEventListener('click', function(event) {
        var layerSwitcher = document.getElementById('layer-switcher');
        var toggleButton = document.getElementById('toggle-button');
        var isClickInsideElement = layerSwitcher.contains(event.target) || toggleButton.contains(event.target);
        if (!isClickInsideElement) {
            layerSwitcher.style.display = 'none';
        }
    });

</script>
</body>
</html>
