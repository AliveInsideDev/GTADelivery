import * as alt from 'alt-server';

export class PointBase {
    constructor({ x, y, z = 100, radius = 1, meta = {} } = {}) {
        this.position = { x, y, z };
        this.radius = radius;
        this.meta = meta;
        this.colshape = null;
    }

    createColshape() {
        if (this.colshape && this.colshape.valid) return;
        this.colshape = new alt.ColshapeSphere(this.position.x, this.position.y, this.position.z, this.radius);
        this.colshape.deliveryPoint = true;
        this.colshape.deliveryMeta = this.meta;
        alt.log(`[PointBase] Колшейп (${this.meta.type}) создан на z=${this.position.z.toFixed(2)} (x=${this.position.x.toFixed(2)}, y=${this.position.y.toFixed(2)}, r=${this.radius})`);
    }

    getPosition() {
        return { ...this.position };
    }

    getRadius() {
        return this.radius;
    }

    getMeta() {
        return this.meta;
    }

    destroy() {
        if (this.colshape && this.colshape.valid) {
            this.colshape.destroy();
        }
        this.colshape = null;
    }
}
