import React from 'react';
export default function MapAirport({x=0,y=0}){return <g data-amenity="airport" aria-label="機場" transform={`translate(${x},${y})`}><title>機場</title><rect width="28" height="28" rx="5" fill="#596A7B"/><path d="M14 3l3 10 9 5v3l-9-3v6l3 2v2l-6-2-6 2v-2l3-2v-6l-9 3v-3l9-5z" fill="white"/></g>;}
