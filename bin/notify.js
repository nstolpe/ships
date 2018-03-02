'use strict';

const Notifications = require('freedesktop-notifications');

const options = {
    summary: process.argv[2] != null ? process.argv[2] : 'Empty Notification Summary',
    body: process.argv[3] != null ? process.argv[3] : 'Empty notification body.',
    timeout: process.argv[4] != null ? parseInt(process.argv[4], 10) : 2000,
    icon: __dirname + '/icon.jpg',
}

const notification = Notifications.createNotification(options);
// notification.on('close', () => process.exit());
notification.push();
