'use strict';

// Getting started with Facebook Messaging Platform
// https://developers.facebook.com/docs/messenger-platform/quickstart

const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');

var jokesApi = require('./jokesApi');

let pageToken = process.env.APP_PAGE_TOKEN;
const verifyToken = process.env.APP_VERIFY_TOKEN;

const app = express();
app.set('port', (process.env.PORT || 3000));
app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === verifyToken) {
        return res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/webhook', (req, res) => {
    console.log('I received new message', new Date());

    const messagingEvents = req.body.entry[0].messaging;
    messagingEvents.forEach((event) => {
        const sender = event.sender.id;

        if (event.postback) {
            if (event.postback.payload === 'BORING') {
                sendTextMessage(sender, 'Sorry bad Comedian. Try this one.');
                sendRandomJoke(sender);
            } else {
                sendRandomJoke(sender);
            }
        } else if (event.message && event.message.text) {
            const text = event.message.text.trim().substring(0, 200).toLocaleLowerCase();
            if (text === "hi" || text === "hello") {
                getUserInfo(sender, (err, res)=> {
                    var user = JSON.parse(res.text);
                    sendTextMessage(sender, "Hello " + user.first_name + ", " + 'Why so serious?');
                    sendRandomJoke(sender);
                });

            } else if (text === "image") {
                sendImageJoke(sender);
            } else if (text === "text") {
                sendJoke(sender);
            } else if (text === "long") {
                sendTextMessage(sender, 'Q: What do you call it when Batman skips Church? \nA: Christian Bale.');

            } else if (text.includes('stop')) {
                sendTextMessage(sender, 'Don\'t be so serious. I will stop.');

            } else if (text.includes('bye')) {
                getUserInfo(sender, (err, res)=> {
                    var user = JSON.parse(res.text);
                    sendTextMessage(sender, 'No, ' + user.first_name + '! Don\'t leave me! PLEASE!. \nJust one joke.');
                    sendRandomJoke(sender);
                });

            } else {
                sendRandomJoke(sender);
            }
        }
    });

    res.sendStatus(200);
});

function sendRandomJoke(sender) {
    if(randomIntFromInterval(1,2) === 1){
        sendImageJoke(sender);
    } else {
        sendJoke(sender);
    }
}

function sendMessage(sender, message, callback) {
    request
        .post('https://graph.facebook.com/v2.6/me/messages')
        .query({access_token: pageToken})
        .send({
            recipient: {
                id: sender
            },
            message: message
        })
        .end((err, res) => {
            if (err) {
                console.log('Error sending message: ', err);
            } else if (res.body.error) {
                console.log('Error: ', res.body.error);
            }
            if (callback)
                callback();
        });
}

function sendTextMessage(sender, text) {
    sendMessage(sender, {
        text: text
    });
}

function sendGenericMessage(sender, text) {
    sendMessage(sender, {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": text,
                "buttons": [
                    {
                        "type": "postback",
                        "title": "funny :)",
                        "payload": "FUNNY"
                    },
                    {
                        "type": "postback",
                        "title": "boring (:",
                        "payload": "BORING"
                    }
                ]
            }
        }
    });
}

function sendImageMessage(sender, url) {
    sendMessage(sender, {
        "attachment": {
            "type": "image",
            "payload": {
                "url": url
            }
        }
    }, ()=> {
        sendMessage(sender, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "Do you think it's funny?",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "funny :)",
                            "payload": "FUNNY"
                        },
                        {
                            "type": "postback",
                            "title": "boring (:",
                            "payload": "BORING"
                        }
                    ]
                }
            }
        });
    });
}

function sendGenericImageMessage(sender, url) {
    sendMessage(sender, {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Do you think it is funny?",
                        "image_url": url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "funny :)",
                                "payload": "FUNNY"
                            },
                            {
                                "type": "postback",
                                "title": "boring (:",
                                "payload": "BORING"
                            }
                        ]
                    }
                ]
            }
        }
    });
}

function sendJoke(sender) {
    jokesApi.getJoke((joke)=> {
        sendGenericMessage(sender, joke)
    });
}

function sendImageJoke(sender) {
    jokesApi.getImageJoke((joke)=> {
        sendImageMessage(sender, joke)
    });
}

// https://developers.facebook.com/docs/messenger-platform/send-api-reference
function getUserInfo(userId, callback) {
    request
        .get('https://graph.facebook.com/v2.6/' + userId)
        .query({access_token: pageToken, fields: 'first_name,last_name,profile_pic,locale,timezone,gender'})
        .send()
        .end(callback);
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

// update and check page token for an existing app
// it's necessary because https://zeit.co/now generates new urls on every deploy
// but there's no way to update webhook url on facebook messenger platform
app.post('/token', (req, res) => {
    if (req.body.verifyToken === verifyToken) {
        pageToken = req.body.token;
        return res.sendStatus(200);
    }
    res.sendStatus(403);
});
app.get('/token', (req, res) => {
    if (req.body.verifyToken === verifyToken) {
        return res.send({token: pageToken});
    }
    res.sendStatus(403);
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
    console.log(pageToken);
    console.log(verifyToken);
});
