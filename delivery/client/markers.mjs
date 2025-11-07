import * as alt from 'alt-client';
import * as native from 'natives';

let deliveryMarkerTick = null;
let policeMarkerTick = null;
let policeBlips = [];

export function createDeliveryMarker(pos) { //pos: { x,y,z, marker, radius, color, scale, type }
    if (deliveryMarkerTick) alt.clearEveryTick(deliveryMarkerTick);

    const markerType = pos.marker;
    const visRadius = pos.radius;

    let colorR = 255, colorG = 200, colorB = 0, alpha = 180;
    if (typeof pos.color === 'number') {
        alpha = 180;
    } 
    else if (typeof pos.color === 'object') {
        colorR = pos.color.r ?? colorR;
        colorG = pos.color.g ?? colorG;
        colorB = pos.color.b ?? colorB;
        alpha = pos.color.a ?? alpha;
    }

    deliveryMarkerTick = alt.everyTick(() => {
        native.drawMarker(
            markerType, // type 
            pos.x, pos.y, pos.z, // position
            0, 0, 0, // postiion offset
            0, 0, 0, // rotate
            visRadius, visRadius, 1, // scale
            colorR, colorG, colorB, alpha, // rgba
            false, false, 2, false, null, null, false // bobUpAndDown, faceCamera, cylinder, rotate, etc...
        );
    });
}

export function removeDeliveryMarker() {
    if (deliveryMarkerTick) {
        alt.clearEveryTick(deliveryMarkerTick);
        deliveryMarkerTick = null;
    }
}

export function createPoliceZones(stations) {
    removePoliceZones();

    alt.log(`[Markers] createPoliceZones: stations=${stations.length}`);
    for (const s of stations) {
        alt.log(`[Markers] add blip station (${s.x},${s.y},${s.z}) radius=${s.radius}`);
        const blip = native.addBlipForCoord(s.x, s.y, s.z);
        native.setBlipSprite(blip, 60); // police icon
        native.setBlipColour(blip, 1);
        native.setBlipScale(blip, 0.9);
        policeBlips.push(blip);
    }

    policeMarkerTick = alt.everyTick(() => {
        for (const s of stations) {
            const visRadius = s.radius;
            native.drawMarker(
                1,
                s.x, s.y, s.z,
                0, 0, 0,
                0, 0, 0,
                visRadius * 2, visRadius * 2, 1,
                255, 0, 0, 50,
                false, false, 2, false, null, null, false
            );
        }
    });
}

export function removePoliceZones() {
    if (policeMarkerTick) {
        alt.clearEveryTick(policeMarkerTick);
        policeMarkerTick = null;
    }

    for (const b of policeBlips) {
        if (b) native.removeBlip(b);
    }

    policeBlips = [];
}
