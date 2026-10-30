const { withMainActivity } = require('@expo/config-plugins');

const MARKER = '// Set hardware volume keys to the notification stream while this activity is active.';

function withNotificationVolumeControl(config) {
  return withMainActivity(config, (config) => {
    const { language, contents } = config.modResults;

    if (language !== 'kt') {
      throw new Error('with-notification-volume-control currently supports Kotlin MainActivity files only.');
    }
    if (contents.includes(MARKER)) return config;

    const onCreateSuperCall = /(^[ \t]*)super\.onCreate\([^\n]*\)/m;
    if (!onCreateSuperCall.test(contents)) {
      throw new Error('Could not find the super.onCreate call in MainActivity.kt to configure volume controls.');
    }

    let updatedContents = contents;
    if (!updatedContents.includes('import android.media.AudioManager')) {
      const packageLine = /^package [^\n]+\n/m;
      if (!packageLine.test(updatedContents)) {
        throw new Error('Could not find the package declaration in MainActivity.kt.');
      }
      updatedContents = updatedContents.replace(packageLine, (line) => `${line}\nimport android.media.AudioManager\n`);
    }

    updatedContents = updatedContents.replace(onCreateSuperCall, (line) =>
      `${line}\n${line.match(/^[ \t]*/)[0]}${MARKER}\n${line.match(/^[ \t]*/)[0]}setVolumeControlStream(AudioManager.STREAM_NOTIFICATION)`,
    );

    config.modResults.contents = updatedContents;
    return config;
  });
}

module.exports = withNotificationVolumeControl;
