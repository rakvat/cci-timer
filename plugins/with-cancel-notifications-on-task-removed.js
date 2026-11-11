const { withMainActivity } = require('@expo/config-plugins');

const METHOD_MARKER = 'override fun onTaskRemoved';
const NOTIFICATION_EVENT_ACTION = 'expo.modules.notifications.NOTIFICATION_EVENT';

function withCancelNotificationsOnTaskRemoved(config) {
  return withMainActivity(config, (config) => {
    const { language, contents } = config.modResults;

    if (language !== 'kt') {
      throw new Error(
        'with-cancel-notifications-on-task-removed currently supports Kotlin MainActivity files only.',
      );
    }
    if (contents.includes(METHOD_MARKER)) return config;

    let updatedContents = contents;
    for (const imp of ['import android.content.ComponentName', 'import android.content.Intent']) {
      if (updatedContents.includes(imp)) continue;
      const packageLine = /^package [^\n]+\n/m;
      if (!packageLine.test(updatedContents)) {
        throw new Error('Could not find the package declaration in MainActivity.kt.');
      }
      updatedContents = updatedContents.replace(packageLine, (line) => `${line}\n${imp}\n`);
    }

    const method = `
  ${METHOD_MARKER}(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    val action = "${NOTIFICATION_EVENT_ACTION}"
    val removeAll = Intent(action).setPackage(packageName).apply {
      putExtra("type", "removeAll")
    }
    val receiver = packageManager
      .queryBroadcastReceivers(Intent(action).setPackage(packageName), 0)
      .firstOrNull()
    if (receiver != null) {
      removeAll.component = ComponentName(receiver.activityInfo.packageName, receiver.activityInfo.name)
    }
    sendBroadcast(removeAll)
  }
`;

    const lastBrace = updatedContents.lastIndexOf('}');
    if (lastBrace === -1) {
      throw new Error('Could not find the end of MainActivity.kt.');
    }

    updatedContents = updatedContents.slice(0, lastBrace) + method + updatedContents.slice(lastBrace);
    config.modResults.contents = updatedContents;
    return config;
  });
}

module.exports = withCancelNotificationsOnTaskRemoved;
