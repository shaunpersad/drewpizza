"use strict";
var express = require('express');
var app = express();
var token = process.env.SLACK_BOT_TOKEN || '';
var channelName = 'nyc-office';
var sucker = 'drewpnyc';
var suckerName = 'Drew';

var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var rtm = new RtmClient(token);

var currentlyTrackingDate = null;
var pizzaCounter = 0;

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {

    var channels = rtmStartData.channels || [];
    var channelId = null;
    
    channels.forEach(function(channel) {
        if (channel.name === channelName) {
            channelId = channel.id;
        }
    });

    var logPizza = function() {

        var now = new Date();
        var date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

        if (date !== currentlyTrackingDate) {
            currentlyTrackingDate = date;
            pizzaCounter = 0;
        }

        pizzaCounter++;

        if (pizzaCounter === 15) {

            rtm.sendMessage(`OK, you guys need to calm down RIGHT NOW.`, channelId);

        } else if (pizzaCounter === 10) {

            rtm.sendMessage(`<@${sucker}|${suckerName}>, I hope you ordered that pizza.`, channelId);

        } else if (pizzaCounter === 5) {

            rtm.sendMessage(`<@${sucker}|${suckerName}>, pizza?`, channelId);
        }
    };


    rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {

        if (message.channel === channelId &&
            message.type === 'message' &&
            !message.subtype) {

            var text = message.text || '';

            if (text.indexOf(':pizza:') !== -1) {

                logPizza();
            }
        }
    });

    rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReaction(message) {

        if (message.item.channel === channelId &&
            message.type === 'reaction_added') {

            var reaction = message.reaction || '';

            if (reaction === 'pizza') {

                logPizza();
            }
        }
    });

});

app.get('/', function (req, res) {
    res.send('Drew. Pizza. Bot.');
});

app.listen(process.env.PORT, function() {
    rtm.start();
});