//if current unitid is unable to identify the trace, then choose the correct unitid
//for example: if unitid 2 of the current line is: 2361191; it's not the unitid of the next line
//then choose the correct line with unitid: 7853045
var bad_gis_case = {
    '2361191': '7853045',
    '4153751' : '4188067'
};
