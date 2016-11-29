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

var firstThreshold = 5;
var secondThreshold = 10;
var thirdThreshold = 15;

var sentFirst = false;
var sentSecond = false;
var sentThird = false;

var firstResponses = [
    'pizza?',
    'is today pizza day?',
    'you are the pizza hero we deserve.',
    'the pizza whistle has blown.',
    'office trip to Chuck E. Cheese?'
];
var firstResponse = firstResponses[0];
var secondResponses = [
    'I hope you ordered that pizza.',
    "if you ordered it already, thanks!. If you haven't, heaven help you.",
    "don't come back here without pizza.",
    'the next time I see your face, there better be pizza near it.'
];
var secondResponse = secondResponses[0];
var thirdResponses = [
    'OMG, STAHP.',
    `${suckerName}'s just one man!`,
    'OK, you guys need to calm down RIGHT NOW.',
    "No one likes my jokes about about pizza. They're too cheesy.",
    'Pineapple is a perfectly acceptable pizza topping.',
    'In high school, Drew was known as Drew "Pizza Face" Papadeas.'
];
var thirdResponse = thirdResponses[0];

function getRandomResponse(responses, lastResponse) {

    var response = responses[Math.floor(Math.random()*responses.length)];
    if (response === lastResponse) {
       return getRandomResponse(responses, lastResponse);
    }
    return response;
}

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
            sentFirst = false;
            sentSecond = false;
            sentThird = false;
        }

        pizzaCounter++;

        if (pizzaCounter >= thirdThreshold && !sentThird) {

            thirdResponse = getRandomResponse(thirdResponses, thirdResponse);
            rtm.sendMessage(thirdResponse, channelId);
            sentThird = true;

        } else if (pizzaCounter >= secondThreshold && !sentSecond) {

            secondResponse = getRandomResponse(secondResponses, secondResponse);
            rtm.sendMessage(`<@${sucker}|${suckerName}>, ${secondResponse}`, channelId);
            sentSecond = true;

        } else if (pizzaCounter >= firstThreshold && !sentFirst) {

            firstResponse = getRandomResponse(firstResponses, firstResponse);
            rtm.sendMessage(`<@${sucker}|${suckerName}>, ${firstResponse}`, channelId);
            sentFirst = true;
        }
        console.log('pizza logged:', pizzaCounter);
    };


    rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {

        var text;
        if (
            message.channel === channelId &&
            message.type === 'message' &&
            !message.subtype
        ) {

            text = message.text || '';

            if (text.indexOf(':pizza:') !== -1) {

                logPizza();
            }
        } else if (
            message.channel === channelId &&
            message.type === 'message' &&
            message.subtype === 'message_deleted' &&
            message.previous_message
        ) {

            text = message.previous_message.text || '';

            if (text.indexOf(':pizza:') !== -1) {

                pizzaCounter--;
                console.log('removed pizza:', pizzaCounter);
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

    rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReaction(message) {

        if (message.item.channel === channelId &&
            message.type === 'reaction_removed') {

            var reaction = message.reaction || '';

            if (reaction === 'pizza') {

                pizzaCounter--;
                console.log('removed pizza:', pizzaCounter);
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