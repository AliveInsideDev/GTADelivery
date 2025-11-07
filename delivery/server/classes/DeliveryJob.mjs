import * as alt from 'alt-server';
import { DELIVERY_CONFIG } from '../config.mjs';
import { getGroundZFor3dCoord } from '../utils/getGroundZFor3dCoord.mjs';
import { PointLoad } from './PointLoad.mjs';
import { PointUnload } from './PointUnload.mjs';
import { CommonCargo } from './cargos/CommonCargo.mjs';
import { HardCargo } from './cargos/HardCargo.mjs';
import { DangerCargo } from './cargos/DangerCargo.mjs';
import { IllegalCargo } from './cargos/IllegalCargo.mjs';

export class DeliveryJob {
    constructor(player) {
        this.player = player;
        this.loadPoint = null;
        this.unloadPoint = null;
        this.loadedVehicleId = null;
        this.active = false;

        // Store  job on the player meta
        if (this.player.setMeta) this.player.setMeta('deliveryJob', this);

        this.boundCargoFailed = this.handleCargoFailed.bind(this);
        alt.on('delivery:cargoFailed', this.boundCargoFailed);
    }

    async start() {
        const points = DELIVERY_CONFIG.points;
        const loadPointIndex = Math.floor(Math.random() * points.length);
        let unloadPointIndex = Math.floor(Math.random() * points.length);
        while (unloadPointIndex === loadPointIndex) unloadPointIndex = Math.floor(Math.random() * points.length);

        const types = ['common', 'hard', 'danger', 'illegal'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Check if the unload point is near a police station
        if (type === 'illegal') {
            const maxAttempts = 10;
            let attempts = 0;
            const isNearPolice = (point) => {
                for (const station of DELIVERY_CONFIG.policeStations) {
                    const dx = point.x - station.x;
                    const dy = point.y - station.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const r = station.radius;
                    if (dist <= r) return true;
                }
                return false;
            };

            while (attempts < maxAttempts && isNearPolice(points[unloadPointIndex])) {
                unloadPointIndex = Math.floor(Math.random() * points.length);
                if (unloadPointIndex === loadPointIndex) { attempts++; continue; }
                attempts++;
            }

            if (isNearPolice(points[unloadPointIndex])) {
                alt.logWarning('[DeliveryJob] Не удалось подобрать точку разгрузки вне полицейской зоны после попыток');
            }
        }

        const loadPoint = points[loadPointIndex];
        const unloadPoint = points[unloadPointIndex];

        const z1 = await getGroundZFor3dCoord(loadPoint.x, loadPoint.y, loadPoint.z);
        const z2 = await getGroundZFor3dCoord(unloadPoint.x, unloadPoint.y, unloadPoint.z);

        const loadCfg = {
            radius: DELIVERY_CONFIG.blips.load.radius,
            blip: DELIVERY_CONFIG.blips.load
        };
        const unloadCfg = {
            radius: DELIVERY_CONFIG.blips.unload.radius,
            blip: DELIVERY_CONFIG.blips.unload
        };

        switch (type) {
            case 'hard': this.cargo = new HardCargo(); break;
            case 'danger': this.cargo = new DangerCargo(); break;
            case 'illegal': this.cargo = new IllegalCargo(DELIVERY_CONFIG.policeStations); break;
            default: this.cargo = new CommonCargo(); break;
        }

        this.pickup = { x: loadPoint.x, y: loadPoint.y, z: z1 };
        this.dropoff = { x: unloadPoint.x, y: unloadPoint.y, z: z2 };

        this.loadPoint = new PointLoad({
            player: this.player,
            x: loadPoint.x, y: loadPoint.y, z: z1, radius: loadCfg.radius,
            meta: { type },
            onEnter: (vehicleId) => this.onLoadComplete(vehicleId)
        });

        this.unloadRadius = unloadCfg.radius;
        this.unloadBlipCfg = unloadCfg.blip;

        alt.emitClient(this.player, 'delivery:begin', {
            pickup: { x: loadPoint.x, y: loadPoint.y, z: z1 },
            dropoff: { x: unloadPoint.x, y: unloadPoint.y, z: z2 },
            type,
            loadBlip: DELIVERY_CONFIG.blips.load,
            unloadBlip: DELIVERY_CONFIG.blips.unload
        });

        this.active = true;
        alt.log(`🚚 ${this.player.name} начал доставку (${type})`);
    }

    onLoadComplete(vehicleId) {
        if (!this.active) return;

        if (this.loadPoint) { this.loadPoint.destroy(); this.loadPoint = null; }

        this.loadedVehicleId = vehicleId;

        if (this.cargo) this.cargo.start(this.player);
        if (this.cargo && this.cargo.type === 'illegal') {
            alt.emitClient(this.player, 'delivery:showPoliceZones', { stations: DELIVERY_CONFIG.policeStations });
        }

        // Add unload blip
        alt.emitClient(this.player, 'delivery:removeDeliveryVisuals');
        alt.emitClient(this.player, 'delivery:setDropoff', {
            dropoff: this.dropoff,
            blip: DELIVERY_CONFIG.blips.unload
        });

        // Create unload point
        if (!this.unloadPoint) {
            this.unloadPoint = new PointUnload({
                player: this.player,
                x: this.dropoff.x, y: this.dropoff.y, z: this.dropoff.z, radius: this.unloadRadius,
                onEnter: (entity) => this.onUnloadComplete(entity)
            });
        }

        alt.emitClient(this.player, 'delivery:notify', { text: 'Погрузка завершена! Езжайте на разгрузку.' });
        alt.log(`[DeliveryJob] ${this.player.name} завершил погрузку, направляется к разгрузке (veh=${this.loadedVehicleId})`);
    }

    onUnloadComplete(playerEntity) {
        if (!this.active) return;
        const player = playerEntity ?? this.player;

        // Check same vehicle
        const veh = player.vehicle;
        if (!veh || !veh.valid || veh.id !== this.loadedVehicleId) {
            alt.emitClient(player, 'delivery:notify', { text: 'Вы должны находиться в том же транспорте для разгрузки!' });
            return;
        }

        alt.emitClient(player, 'delivery:notify', { text: '✅ Разгрузка выполнена! Работа окончена.' });
        alt.emitClient(player, 'delivery:removeDeliveryVisuals');


        if (this.cargo) {
            this.cargo.success(player);
            this.cargo.destroy();
            this.cargo = null;
        }

        alt.emitClient(player, 'delivery:hidePoliceZones');

        if (this.unloadPoint) { this.unloadPoint.destroy(); this.unloadPoint = null; }

        this.active = false;
        if (this.player.setMeta) this.player.setMeta('deliveryJob', null);

        alt.off('delivery:cargoFailed', this.boundCargoFailed);
        alt.log(`[DeliveryJob] ${this.player.name} завершил доставку`);
    }

    handleCargoFailed(player) {
        if (player !== this.player) return;

        alt.log(`[DeliveryJob] ${this.player.name} провалил доставку (cargo.fail)`);

        alt.emitClient(this.player, 'delivery:removeDeliveryVisuals');
        alt.emitClient(this.player, 'delivery:hidePoliceZones');

        if (this.loadPoint) { this.loadPoint.destroy(); this.loadPoint = null; }
        if (this.unloadPoint) { this.unloadPoint.destroy(); this.unloadPoint = null; }
        if (this.cargo) this.cargo.destroy();
        this.cargo = null;

        this.active = false;
        if (this.player.setMeta) this.player.setMeta('deliveryJob', null);

        alt.off('delivery:cargoFailed', this.boundCargoFailed);
    }
}
