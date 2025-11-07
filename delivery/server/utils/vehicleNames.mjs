export const VEHICLE_MODEL_TO_NAME = {
    904750859: 'mule',
    3850195578: 'mule2',
    2242229365: 'mule3',
    850991848: 'mule4',
    2109513015: 'mule5',
    1653288264: 'packer',
    3265607581: 'benson',
    734217681: 'pounder',
    2053223216: 'pounder2',
};

export function getVehicleNameByHash(hash) {
    return VEHICLE_MODEL_TO_NAME[hash];
}


