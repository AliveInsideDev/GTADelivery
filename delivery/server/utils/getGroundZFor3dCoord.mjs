import * as alt from 'alt-server';

export function getGroundZFor3dCoord(x, y, fallbackZ = 30) {
    return new Promise((resolve) => {
        const player = alt.Player.all[0];
        if (!player || !player.valid) {
            alt.logWarning(`Нет игроков онлайн`);
            return resolve(fallbackZ);
        }

        const id = Math.floor(Math.random() * 999999);
        const timeout = alt.setTimeout(() => {
            alt.logWarning(`[getGroundZ] Время ожидания ответа вышло (${x}, ${y})`);
            resolve(fallbackZ);
        }, 2000);

        const handler = (playerRespond, reqId, z) => {
            if (playerRespond !== player || reqId !== id) return;
            alt.offClient('delivery:returnGroundZ', handler);
            alt.clearTimeout(timeout);
            resolve(z);
        };

        alt.onClient('delivery:returnGroundZ', handler);

        alt.emitClient(player, 'delivery:requestGroundZ', id, { x, y, z: fallbackZ });
    });
}
