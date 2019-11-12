'use strict'

const line = require('@line/bot-sdk');
const express = require('express');

const defaultAccessToken = 'Upq28CGaamhChqJ9l/+F1EU3TccKCzsTMhbRP7/EqXch4nQgqsALQtdUmwA0h0DcwMk79lXWBxui3A8keQXADD1IT7XWuLF1QnEzjYwhADZu7CspRiNfJ7LWxcViJCXIbytMSNqfAkGO4U1mIJkG1gdB04t89/1O/w1cDnyilFU=';
const defaultSecret = 'c9c27ba18352f53ef13f2430c3d7b9db';

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
    channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

let baseURL = process.env.BASE_URL;

const client = new line.Client(config);
const app = express();


app.get("/", function (req, res) {
    res.send("Hello Word");
});

app.post("/webhook", line.middleware(config), function (req, res) {
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
    if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
        return console.log("Test hook recieved: " + JSON.stringify(event.message));
    }

    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken, event.source);
                default:
                    throw new Error(`Unknown message: ${JSON.stringify(message)}`);
            }

            case 'follow':
                return replyText(event.replyToken, 'Got followed event');

            case 'unfollow':
                return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

            case 'join':
                return replyText(event.replyToken, `Joined ${event.source.type}`);

            case 'leave':
                return console.log(`Left: ${JSON.stringify(event)}`);

            case 'postback':
                let data = event.postback.data;
                if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
                    data += `(${JSON.stringify(event.postback.params)})`;
                }
                return replyText(event.replyToken, `Got postback: ${data}`);

            case 'beacon':
                return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

            default:
                throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
}

function handleText(message, replyToken, source) {
    const buttonsImageURL = `${baseURL}1040.jpg`;

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
                return replyText(replyToken, 'Bot can\'t use profile API without user ID');
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
            case 'carousel':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Carousel alt text',
                        template: {
                            type: 'carousel',
                            columns: [{
                                    thumbnailImageUrl: buttonsImageURL,
                                    title: 'hoge',
                                    text: 'fuga',
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
                                    ],
                                },
                                {
                                    thumbnailImageUrl: buttonsImageURL,
                                    title: 'hoge',
                                    text: 'fuga',
                                    actions: [{
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
                            ],
                        },
                    }
                );
            case 'image carousel':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Image carousel alt text',
                        template: {
                            type: 'image_carousel',
                            columns: [{
                                    imageUrl: buttonsImageURL,
                                    action: {
                                        label: 'Go to LINE',
                                        type: 'uri',
                                        uri: 'https://line.me'
                                    },
                                },
                                {
                                    imageUrl: buttonsImageURL,
                                    action: {
                                        label: 'Say hello1',
                                        type: 'postback',
                                        data: 'hello こんにちは'
                                    },
                                },
                                {
                                    imageUrl: buttonsImageURL,
                                    action: {
                                        label: 'Say message',
                                        type: 'message',
                                        text: 'Rice=米'
                                    },
                                },
                                {
                                    imageUrl: buttonsImageURL,
                                    action: {
                                        label: 'datetime',
                                        type: 'datetimepicker',
                                        data: 'DATETIME',
                                        mode: 'datetime',
                                    },
                                },
                            ]
                        },
                    }
                );
            case 'datetime':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Datetime pickers alt text',
                        template: {
                            type: 'buttons',
                            text: 'Select date / time !',
                            actions: [{
                                    type: 'datetimepicker',
                                    label: 'date',
                                    data: 'DATE',
                                    mode: 'date'
                                },
                                {
                                    type: 'datetimepicker',
                                    label: 'time',
                                    data: 'TIME',
                                    mode: 'time'
                                },
                                {
                                    type: 'datetimepicker',
                                    label: 'datetime',
                                    data: 'DATETIME',
                                    mode: 'datetime'
                                },
                            ],
                        },
                    }
                );
            case 'imagemap':
                return client.replyMessage(
                    replyToken, {
                        type: 'imagemap',
                        baseUrl: `${baseURL}/static/rich`,
                        altText: 'Imagemap alt text',
                        baseSize: {
                            width: 1040,
                            height: 1040
                        },
                        actions: [{
                                area: {
                                    x: 0,
                                    y: 0,
                                    width: 520,
                                    height: 520
                                },
                                type: 'uri',
                                linkUri: 'https://store.line.me/family/manga/en'
                            },
                            {
                                area: {
                                    x: 520,
                                    y: 0,
                                    width: 520,
                                    height: 520
                                },
                                type: 'uri',
                                linkUri: 'https://store.line.me/family/music/en'
                            },
                            {
                                area: {
                                    x: 0,
                                    y: 520,
                                    width: 520,
                                    height: 520
                                },
                                type: 'uri',
                                linkUri: 'https://store.line.me/family/play/en'
                            },
                            {
                                area: {
                                    x: 520,
                                    y: 520,
                                    width: 520,
                                    height: 520
                                },
                                type: 'message',
                                text: 'URANAI!'
                            },
                        ],
                        video: {
                            originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
                            previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
                            area: {
                                x: 280,
                                y: 385,
                                width: 480,
                                height: 270,
                            },
                            externalLink: {
                                linkUri: 'https://line.me',
                                label: 'LINE'
                            }
                        },
                    }
                );
            case 'bye':
                switch (source.type) {
                    case 'user':
                        return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
                    case 'group':
                        return replyText(replyToken, 'Leaving group')
                            .then(() => client.leaveGroup(source.groupId));
                    case 'room':
                        return replyText(replyToken, 'Leaving room')
                            .then(() => client.leaveRoom(source.roomId));
                }
                default:
                    console.log(`Echo message to ${replyToken}: ${message.text}`);
                    return replyText(replyToken, message.text);
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});