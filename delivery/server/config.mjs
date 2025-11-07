export const DELIVERY_CONFIG = {
    allowedVehicles: ['mule', 'mule2', 'mule3', 'mule4', 'mule5', 'packer', 'benson', 'pounder', 'pounder2'],

    points: [
        // { x: -421.23, y: 1123.12, z: 325.86 },
        // { x: -411.23, y: 1123.12, z: 325.86 },
        //{ x: 234.21, y: -1345.12, z: 30.89 },
        //{ x: 1734.33, y: 3291.88, z: 41.22 },
        //{ x: -2031.22, y: -102.31, z: 27.86 }
        { x: 39.1604, y: -982.1671, z: 30.6783 },
        { x: -49.1604, y: -982.1671, z: 30.6783 }
    ],

    policeStations: [
        { x: 439.1604, y: -982.1671, z: 30.6783, radius: 350 },
        { x: 1854.3165, y: 3684.5671, z: 30.2572, radius: 350 },
        { x: 454.2066, y: 6011.9736, z: 31.4535, radius: 350 },
        { x: 2484.7517, y: -382.4703, z: 82.6937, radius: 350 }
    ],

    blips: {
        // load: radius 10, marker 39, blip 67
        load: { blip: 67, marker: 39, color: 5, scale: 0.9, radius: 10, type: 1 },
        // unload: radius 15, marker 29, blip 293
        unload: { blip: 293, marker: 29, color: 2, scale: 1.0, radius: 15, type: 1 }
    }
};
