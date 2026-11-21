const { withDangerousMod } = require('expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');
const { copyFileSync, mkdirSync, writeFileSync } = require('fs');
const { basename, resolve } = require('path');

const DENSITY_SCALES = {
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
};
const ICON_BASELINE_PX = 24;
const ICON_RESOURCE_NAME = 'notification_icon';

/**
 * Copies the notification icon (resized per density bucket) and custom
 * notification sounds into the Android `res` directory so they are bundled
 * as resources (`@drawable/notification_icon`, `res/raw/<name>`).
 *
 * Props:
 * - `icon`: path to the notification icon image (96dp source recommended).
 * - `sounds`: array of paths to sound files (e.g. `./assets/audio/gong.wav`).
 */
function withNotificationAssets(config, { icon, sounds = [] } = {}) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { projectRoot, platformProjectRoot } = config.modRequest;
      const resPath = resolve(platformProjectRoot, 'app', 'src', 'main', 'res');

      if (icon) {
        const iconSrc = resolve(projectRoot, icon);
        await Promise.all(
          Object.entries(DENSITY_SCALES).map(async ([density, scale]) => {
            const sizePx = ICON_BASELINE_PX * scale;
            const resized = await generateImageAsync(
              { projectRoot, cacheType: 'android-notification' },
              {
                src: iconSrc,
                width: sizePx,
                height: sizePx,
                resizeMode: 'cover',
                backgroundColor: 'transparent',
              },
            );
            const dir = resolve(resPath, `drawable-${density}`);
            mkdirSync(dir, { recursive: true });
            writeFileSync(resolve(dir, `${ICON_RESOURCE_NAME}.png`), resized.source);
          }),
        );
      }

      for (const sound of sounds) {
        const rawDir = resolve(resPath, 'raw');
        mkdirSync(rawDir, { recursive: true });
        copyFileSync(resolve(projectRoot, sound), resolve(rawDir, basename(sound)));
      }

      return config;
    },
  ]);
}

module.exports = withNotificationAssets;
