import * as alt from 'alt-server';
import { PointBase } from './PointBase.mjs';

export class PointUnload extends PointBase {
    constructor({ player, x, y, z, radius = 1, onEnter = null }) {
        super({ x, y, z, radius, meta: { type: 'unload' } });
        this.player = player;
        this.onEnter = onEnter;

        this.boundEnter = this.handleEnter.bind(this);

        this.createColshape();
        alt.on('entityEnterColshape', this.boundEnter);

        alt.log(`[PointUnload] создана точка разгрузки (${x}, ${y}, ${z})`);
    }

    handleEnter(colshape, entity) {
        if (entity !== this.player) return;

        if (!colshape.valid || colshape !== this.colshape) return;

        alt.log(`[PointUnload] ${entity.name} вошёл в зону разгрузки`);
        alt.emitClient(entity, 'delivery:notify', { text: '🚚 Разгрузка началась...' });

        if (this.onEnter) this.onEnter(entity);
    }

    destroy() {
        super.destroy();
        if (this.boundEnter) {
            alt.off('entityEnterColshape', this.boundEnter);
            this.boundEnter = null;
        }
    }
}
