"""Build offline, metric silhouettes from Natural Earth 1:50m GeoJSON.
Run with a directory containing the two documented input files and gsv-top.json.
Requires shapely and pyproj only for this build script, never at runtime.
"""
import json, sys, hashlib
from pathlib import Path
from shapely.geometry import shape, Polygon, mapping
from shapely.ops import transform, unary_union
from pyproj import CRS, Transformer
root=Path(sys.argv[1]); output=Path(__file__).resolve().parents[1]/'dist/assets/comparison.json'

def pack(geom,flip=True):
    polygons=[geom] if geom.geom_type=='Polygon' else list(geom.geoms)
    return [[[[round(x,3),round(-y if flip else y,3)] for x,y in ring.coords] for ring in [p.exterior,*p.interiors]] for p in polygons if p.geom_type=='Polygon' and p.area>0.0001]

places=[];sources=[]
for filename,kind in [('ne_50m_admin_0_countries.geojson','country'),('ne_50m_admin_1_states_provinces.geojson','state')]:
    data=(root/filename).read_bytes();sources.append({'file':filename,'sha256':hashlib.sha256(data).hexdigest(),'url':'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/'+filename})
    for feature in json.loads(data)['features']:
        p=feature['properties']
        if kind=='state' and p['adm0_a3']!='USA':continue
        if kind=='country':name=p['NAME_LONG'];code=p['ADM0_A3'];lon=p['LABEL_X'];lat=p['LABEL_Y']
        else:name=p['name'];code=p['iso_3166_2'];lon=p['longitude'];lat=p['latitude']
        # Antarctica's polar projection avoids selecting an arbitrary longitude.
        if code=='ATA':lon=0;lat=-90
        project=Transformer.from_crs('EPSG:4326',CRS.from_proj4(f'+proj=laea +lat_0={lat} +lon_0={lon} +datum=WGS84 +units=km'),always_xy=True).transform
        geom=transform(project,shape(feature['geometry']))
        if not geom.is_valid:geom=geom.buffer(0)
        if geom.is_empty:continue
        simple=geom.simplify(.25,preserve_topology=True)
        # Areas and paths use the same equal-area projected, generalized geometry.
        record={'id':kind+':'+code,'name':name,'kind':kind,'area':round(simple.area,3),'polygons':pack(simple)}
        if kind=='country' and simple.geom_type=='MultiPolygon':
            pieces=list(simple.geoms);largest=max(pieces,key=lambda p:p.area);group=[largest];pending=[p for p in pieces if p is not largest]
            while pending:
                joined=[p for p in pending if any(p.distance(q)<300 for q in group)]
                if not joined:break
                group.extend(joined);joined_ids={id(p) for p in joined};pending=[p for p in pending if id(p) not in joined_ids]
            if pending:
                main=unary_union(group);record.update(mainPolygons=pack(main),mainArea=round(main.area,3))
        places.append(record)
ships=unary_union([Polygon(p) for p in json.loads((root/'gsv-top.json').read_text()) if Polygon(p).area>1e-10])
result={'schema':'rfl.scale-geography.v1','units':'km','projection':'WGS84 Lambert azimuthal equal-area, centered on each region','source':{'name':'Natural Earth 1:50m, public domain','url':'https://www.naturalearthdata.com/','retrieved':'2026-10-02','inputs':sources},'places':sorted(places,key=lambda p:p['name']),'gsv':{'polygons':pack(ships,False),'area':ships.area,'note':'Imported RFL hull at the existing avatar-relative gameplay scale'}}
output.write_text(json.dumps(result,separators=(',',':')))
print(len(places),'places; GSV area',ships.area,'km²;',output.stat().st_size,'bytes')
