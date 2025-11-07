import * as alt from 'alt-server';
import { DELIVERY_CONFIG } from '../config.mjs';
import { getVehicleNameByHash } from '../utils/vehicleNames.mjs';
import { PointBase } from './PointBase.mjs';

export class PointLoad extends PointBase {
    constructor({ player, x, y, z, radius = 1, meta = {}, onEnter }) {
        super({ x, y, z, radius, meta });
        this.player = player;
        this.onEnter = onEnter;

        this.isLoading = false;

        this.boundEnter = this.handleEnter.bind(this);
        this.boundLeave = this.handleLeave.bind(this);

        this.createColshape();
        alt.on('entityEnterColshape', this.boundEnter);
        alt.on('entityLeaveColshape', this.boundLeave);

        const type = this.meta.type;
        alt.log(`[PointLoad] Колшейп (${type}) создан на Z=${this.position.z}`);
    }

    handleEnter(colshape, entity) {
        if (colshape !== this.colshape) return;
        if (!(entity instanceof alt.Player)) return;

        const player = entity;
        const veh = player.vehicle;
        let vehName = '';

        if (!veh || !veh.valid) {
            alt.emitClient(player, 'delivery:notify', { text: 'Вы должны находиться в транспорте!' });
            return;
        }

        const modelHash = veh.model;
        const mappedName = getVehicleNameByHash(modelHash);
        if (!mappedName) {
            alt.logWarning(`[PointLoad] Неизвестная модель: ${modelHash})`);
            vehName = '';
        } else {
            vehName = mappedName.toLowerCase();
        }

        const allowed = DELIVERY_CONFIG.allowedVehicles.map(vehicle => vehicle.toLowerCase());
        if (!allowed.includes(vehName)) {
            alt.emitClient(player, 'delivery:notify', {
                text: `Нужен транспорт: ${DELIVERY_CONFIG.allowedVehicles.join(', ')}`
            });
            return;
        }

        if (this.isLoading) return;
        this.isLoading = true;
        alt.log(`[PointLoad] ${player.name} начал погрузку на "${vehName}" (ID: ${veh.id})`);

        alt.emitClient(player, 'delivery:startLoad', {
            vehicleId: veh.id,
            duration: 3000
        });
        alt.emitClient(player, 'delivery:notify', { text: 'Погрузка началась...' });

        alt.setTimeout(() => {
            if (!player || !player.valid) {
                this.isLoading = false;
                return;
            }

            let success = false;

            const curVeh = player.vehicle;
            if (curVeh && curVeh.valid && curVeh.id === veh.id) {
                success = true;
            }

            if (!success) {
                this.isLoading = false;
                return;
            }

            alt.emitClient(player, 'delivery:notify', { text: 'Погрузка завершена! Езжайте на разгрузку.' });
            if (this.onEnter) this.onEnter(veh.id);
            this.isLoading = false;
        }, 3000);
    }

    handleLeave(colshape, entity) {
        if (colshape !== this.colshape) return;
        if (!(entity instanceof alt.Player)) return;

        const player = entity;
        if (this.isLoading) {
            this.isLoading = false;
            alt.log(`[PointLoad] ${player.name} покинул зону погрузки`);
        }
    }

    destroy() {
        super.destroy();
        alt.off('entityEnterColshape', this.boundEnter);
        alt.off('entityLeaveColshape', this.boundLeave);
        this.isLoading = false;
    }
}
