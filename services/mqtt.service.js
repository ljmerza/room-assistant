'use strict';

const config = require('config');
const mqtt = require('mqtt');

module.exports = {
    name: 'mqtt',

    settings: {
        room: config.get('room'),
        discoveryEnabled: config.get('autoDiscovery'),

        url: config.get('mqtt.url'),
        options: {
            username: config.get('mqtt.username'),
            password: config.get('mqtt.password'),
            rejectUnauthorized: config.get('mqtt.rejectUnauthorized')
        }
    },

    events: {
        'sensor.started'(details) {
            if (this.settings.discoveryEnabled && details.discoverable) {
                const baseTopic = `homeassistant/${details.discoveryType}/${this.settings.room}/${details.channel}`;
                this.channelRegistry[details.channel] = `${baseTopic}/state`;

                this.client.publish(`${baseTopic}/config`, JSON.stringify(details.discoveryConfig), { retain: true });
            }
        },

        'data.found'(payload) {
            let subTopic = `${payload.channel}/${this.settings.room}`;

            if (this.channelRegistry.hasOwnProperty(payload.channel)) {
                subTopic = this.channelRegistry[payload.channel];
            }

            this.client.publish(subTopic, JSON.stringify(payload.data), payload.options);
        }
    },

    created() {
        this.channelRegistry = {};

        this.client = mqtt.connect(this.settings.url, this.settings.options);
        this.client.on('connect', () => {
            this.logger.info(`Connected to ${this.settings.url}`);
        });
    }
};
