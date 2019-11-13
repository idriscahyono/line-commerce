'use strict'

const line = require('@line/bot-sdk');
const express = require('express');
const menu = require('./menu');

const defaultAccessToken = 'Upq28CGaamhChqJ9l/+F1EU3TccKCzsTMhbRP7/EqXch4nQgqsALQtdUmwA0h0DcwMk79lXWBxui3A8keQXADD1IT7XWuLF1QnEzjYwhADZu7CspRiNfJ7LWxcViJCXIbytMSNqfAkGO4U1mIJkG1gdB04t89/1O/w1cDnyilFU=';
const defaultSecret = 'c9c27ba18352f53ef13f2430c3d7b9db';

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
    channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

const client = new line.Client(config);
const app = express();


app.get("/", function (req, res) {
    res.send("Hello Word");
});

app.post("/webhook", line.middleware(config), function (req, res) {
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

const replyText = (token, texts) => {
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
        token,
        texts.map((text) => ({
            type: 'text',
            text
        }))
    );
};

function handleEvent(event) {

    console.log(event);
    var userId = event.source.userId;
    var replyToken = event.replyToken;
    if (!userId) {
        return menu.sendTextMessage(userId, replyToken, 'Eror : NO_USER_ID');
    }
    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken, event.source);
                    // if (['Menu'].indexOf(message.text) > -1) {
                    //     return handleCommand(message, replyToken, event.source);
                    // } else {
                    //     return menu.sendMenuMessage(userId, replyToken);
                    // }
                    // default:
                    //     return menu.sendTextMessage(userId, replyToken, 'Masih Coba Gan')
            }
            case 'follow':
                return menu.sendMenuMessage(userId, replyToken);
    }
    // if (event.message.text == "hai") {
    //     const echo = {
    //         type: 'text',
    //         text: "Halo"
    //     };
    //     return client.replyMessage(event.replyToken, echo);
    // }

    // if (event.message.text == "mana") {
    //     const echo = {
    //         type: 'bubble',
    //         body: {
    //             type: 'box',
    //             layout: 'horizontal',
    //             contents: [{
    //                     type: 'text',
    //                     text: 'Hello,'
    //                 },
    //                 {
    //                     type: 'text',
    //                     text: 'World!'
    //                 }
    //             ]
    //         }
    //     };
    //     return client.replyMessage(event.replyToken, echo);
    // }

    // if (event.message.text == "menu") {
    //     return client.replyMessage(event.replyToken, JSON.stringify({
    //         "type": "bubble",
    //         "body": {
    //             "type": "box",
    //             "layout": "horizontal",
    //             "contents": [{
    //                     "type": "text",
    //                     "text": "Hello,"
    //                 },
    //                 {
    //                     "type": "text",
    //                     "text": "World!"
    //                 }
    //             ]
    //         }
    //     }))
    // }


    // const echo = {
    //     type: 'text',
    //     text: "Siapa Ya?"
    // };
    // return client.replyMessage(event.replyToken, echo);
}

function handleText(message, replyToken, source) {
    switch (message.text) {
        case 'profile':
            if (source.userId) {
                return client.getProfile(source.userId)
                    .then((profile) => replyText(
                        replyToken,
                        [
                            `Display name: ${profile.displayName}`,
                            `Status message: ${profile.statusMessage}`,
                        ]
                    ));
            } else {
                return replyText(replyToken, 'Bot cant use profile API without user ID');
            }
            case 'buttons':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Buttons alt text',
                        template: {
                            type: 'buttons',
                            thumbnailImageUrl: buttonsImageURL,
                            title: 'My button sample',
                            text: 'Hello, my button',
                            actions: [{
                                    label: 'Go to line.me',
                                    type: 'uri',
                                    uri: 'https://line.me'
                                },
                                {
                                    label: 'Say hello1',
                                    type: 'postback',
                                    data: 'hello こんにちは'
                                },
                                {
                                    label: '言 hello2',
                                    type: 'postback',
                                    data: 'hello こんにちは',
                                    text: 'hello こんにちは'
                                },
                                {
                                    label: 'Say message',
                                    type: 'message',
                                    text: 'Rice=米'
                                },
                            ],
                        },
                    }
                );
            case 'confirm':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Confirm alt text',
                        template: {
                            type: 'confirm',
                            text: 'Do it?',
                            actions: [{
                                    label: 'Yes',
                                    type: 'message',
                                    text: 'Yes!'
                                },
                                {
                                    label: 'No',
                                    type: 'message',
                                    text: 'No!'
                                },
                            ],
                        },
                    }
                )
            default:
                console.log(`Echo message to ${replyToken}: ${message.text}`);
                return replyText(replyToken, message.text);
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});