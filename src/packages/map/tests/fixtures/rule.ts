import { xml2js } from 'xml-js'
import { Map2dRules } from '../../src'

export default new Map2dRules(xml2js(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.6" orientation="orthogonal" renderorder="right-down" width="10" height="10" tilewidth="32" tileheight="32" infinite="0" nextlayerid="2" nextobjectid="1">
 <tileset firstgid="1" source="../../src/modules/main/server/maps/tmx/[Base]BaseChip_pipo.tsx"/>
 <layer id="1" name="Tile Layer 1" width="10" height="10">
  <data encoding="csv">
9,10,0,11,12,0,0,0,0,0,
17,18,0,19,20,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
41,0,42,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
15,16,0,0,0,0,0,0,0,0,
23,24,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
</map>

`, { compact: true })['map'] as any)