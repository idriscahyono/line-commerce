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
            case 'list':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'List Menu',
                        template: {
                            type: 'image_carousel',
                            columns: [{
                                    imageUrl: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png',
                                    action: {
                                        type: 'postback',
                                        label: 'Buy',
                                        data: 'action=buy&itemid=111'
                                    }
                                },
                                {
                                    imageUrl: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png',
                                    action: {
                                        type: 'postback',
                                        label: 'Buy',
                                        data: 'action=buy&itemid=111'
                                    }
                                },
                            ],
                        },
                    }
                )
            case 'hai':
                return client.replyMessage(
                    replyToken, {
                        type: 'template',
                        altText: 'Daftar Menu',
                        template: {
                            type: 'carousel',
                            columns: [{
                                    thumbnailImageUrl: 'https://toko.sentratani.com/image/cache/catalog/produk/Benih-Panah-Merah-Melon-Gracia-F1-500-Butir-500x500.png',
                                    imageBackgroundColor: '#FFFFFF',
                                    title: 'Benih Melon Hijau',
                                    text: 'Benih melon hijau berkualitas namun hemat untuk skala hobi',
                                    defaultAction: {
                                        type: 'uri',
                                        label: 'View detail',
                                        uri: 'http://example.com/page/123'
                                    },
                                    actions: [{
                                            type: 'postback',
                                            label: 'Buy',
                                            data: 'action=buy&itemid=111'
                                        },
                                        {
                                            type: 'postback',
                                            label: 'Add to cart',
                                            data: 'action=add&itemid=111'
                                        },
                                        {
                                            type: 'uri',
                                            label: 'View detail',
                                            uri: 'http://example.com/page/111'
                                        }
                                    ]
                                },
                                {
                                    thumbnailImageUrl: 'https://toko.sentratani.com/image/cache/catalog/Benih%20Cabe%20Rawit%20Hibrida%20F1%20SONAR%20-10%20Gr-500x500.png',
                                    imageBackgroundColor: '#FFFFFF',
                                    title: 'Benih Cabai Rawit',
                                    text: 'Benih Cabai Cabe Rawit berkualitas namun hemat untuk skala hobi',
                                    defaultAction: {
                                        type: 'uri',
                                        label: 'View detail',
                                        uri: 'http://example.com/page/123'
                                    },
                                    actions: [{
                                            type: 'postback',
                                            label: 'Buy',
                                            data: 'action=buy&itemid=111'
                                        },
                                        {
                                            type: 'postback',
                                            label: 'Add to cart',
                                            data: 'action=add&itemid=111'
                                        },
                                        {
                                            type: 'uri',
                                            label: 'View detail',
                                            uri: 'http://example.com/page/111'
                                        }
                                    ]
                                },
                            ],
                            imageAspectRatio: 'rectangle',
                            'imageSize': 'cover'
                        }
                    }
                )

            case 'menu':
                return client.replyMessage(
                    replyToken, {
                        type: 'carousel',
                        contents: [{
                            type: 'bubble',
                            hero: {
                                type: 'image',
                                size: 'full',
                                aspectRatio: '20:13',
                                aspectMode: 'cover',
                                url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png'
                            },
                            body: {
                                type: 'box',
                                layout: 'vertical',
                                spacing: 'sm',
                                contents: [{
                                        type: 'text',
                                        text: 'Arm Chair, White',
                                        wrap: true,
                                        weight: 'bold',
                                        size: 'xl'
                                    },
                                    {
                                        type: 'box',
                                        layout: 'baseline',
                                        contents: [{
                                                type: 'text',
                                                text: '$49',
                                                wrap: true,
                                                weight: 'bold',
                                                size: 'xl',
                                                flex: 0
                                            },
                                            {
                                                type: 'text',
                                                text: '.99',
                                                wrap: true,
                                                weight: 'bold',
                                                size: 'sm',
                                                flex: 0
                                            }
                                        ]
                                    }
                                ]
                            },
                            footer: {
                                type: 'box',
                                layout: 'vertical',
                                spacing: 'sm',
                                contents: [{
                                        type: 'button',
                                        style: 'primary',
                                        action: {
                                            type: 'uri',
                                            label: 'Add to Cart',
                                            uri: 'https://linecorp.com'
                                        }
                                    },
                                    {
                                        type: 'button',
                                        action: {
                                            type: 'uri',
                                            label: 'Add to wishlist',
                                            uri: 'https://linecorp.com'
                                        }
                                    }
                                ]
                            }
                        }]
                    }
                )
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