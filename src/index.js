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
                        // if (['Buy'].indexOf(message.text) > -1) {
                        //     return handleCommand(message, replyToken, event.source);
                        // } else {
                        //     return handleCommand(message, replyToken, event.source);
                        // }
                    default:
                        return menu.sendTextMessage(userId, replyToken, 'Masih Coba Gan')
                }

                case 'postback':
                    let postbackData = event.postback.data.split("_", 2);
                    let mode = postbackData[0];
                    switch (mode) {
                        case 'BUY':
                            return client.replyMessage(
                                // replyToken, {
                                //     type: 'template',
                                //     altText: 'Recipe',
                                //     template: {
                                //         type: 'confirm',
                                //         text: 'Do it?',
                                //         actions: [{
                                //                 label: 'Yes',
                                //                 type: 'message',
                                //                 text: 'Yes!'
                                //             },
                                //             {
                                //                 label: 'No',
                                //                 type: 'message',
                                //                 text: 'No!'
                                //             },
                                //         ],
                                //     },
                                // }
                                replyToken, {
                                    "type": "bubble",
                                    "styles": {
                                        "footer": {
                                            "separator": true
                                        }
                                    },
                                    "body": {
                                        "type": "box",
                                        "layout": "vertical",
                                        "contents": [{
                                                "type": "text",
                                                "text": "RECEIPT",
                                                "weight": "bold",
                                                "color": "#1DB446",
                                                "size": "sm"
                                            },
                                            {
                                                "type": "text",
                                                "text": "Brown Store",
                                                "weight": "bold",
                                                "size": "xxl",
                                                "margin": "md"
                                            },
                                            {
                                                "type": "text",
                                                "text": "Miraina Tower, 4-1-6 Shinjuku, Tokyo",
                                                "size": "xs",
                                                "color": "#aaaaaa",
                                                "wrap": true
                                            },
                                            {
                                                "type": "separator",
                                                "margin": "xxl"
                                            },
                                            {
                                                "type": "box",
                                                "layout": "vertical",
                                                "margin": "xxl",
                                                "spacing": "sm",
                                                "contents": [{
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "Energy Drink",
                                                                "size": "sm",
                                                                "color": "#555555",
                                                                "flex": 0
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$2.99",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "Chewing Gum",
                                                                "size": "sm",
                                                                "color": "#555555",
                                                                "flex": 0
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$0.99",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "Bottled Water",
                                                                "size": "sm",
                                                                "color": "#555555",
                                                                "flex": 0
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$3.33",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "separator",
                                                        "margin": "xxl"
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "margin": "xxl",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "ITEMS",
                                                                "size": "sm",
                                                                "color": "#555555"
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "3",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "TOTAL",
                                                                "size": "sm",
                                                                "color": "#555555"
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$7.31",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "CASH",
                                                                "size": "sm",
                                                                "color": "#555555"
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$8.0",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "box",
                                                        "layout": "horizontal",
                                                        "contents": [{
                                                                "type": "text",
                                                                "text": "CHANGE",
                                                                "size": "sm",
                                                                "color": "#555555"
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": "$0.69",
                                                                "size": "sm",
                                                                "color": "#111111",
                                                                "align": "end"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                "type": "separator",
                                                "margin": "xxl"
                                            },
                                            {
                                                "type": "box",
                                                "layout": "horizontal",
                                                "margin": "md",
                                                "contents": [{
                                                        "type": "text",
                                                        "text": "PAYMENT ID",
                                                        "size": "xs",
                                                        "color": "#aaaaaa",
                                                        "flex": 0
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": "#743289384279",
                                                        "color": "#aaaaaa",
                                                        "size": "xs",
                                                        "align": "end"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            )
                    }
                    default:
                        throw new Error(`Unknown event: ${JSON.stringify(event)}`);
        }
    }

    // function handleCommand(message, replyToken, source) {
    //     switch (message.text) {
    //         case 'Menu':
    //             return menu.sendMenuMessage(replyToken);
    //         case 'Buy':
    //             return menu.sendRecipe(source.userId, replyToken);
    //         default:
    //             return;
    //     }
    // }

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
                                        imageUrl: 'https://toko.sentratani.com/image/cache/catalog/produk/Benih-Panah-Merah-Melon-Gracia-F1-500-Butir-500x500.png',
                                        action: {
                                            type: 'postback',
                                            label: 'Buy',
                                            data: 'action=buy&itemid=111'
                                        }
                                    },
                                    {
                                        imageUrl: 'https://toko.sentratani.com/image/cache/catalog/Benih%20Cabe%20Rawit%20Hibrida%20F1%20SONAR%20-10%20Gr-500x500.png',
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
                                        title: 'Benih Melon',
                                        text: 'Berkualitas',
                                        defaultAction: {
                                            type: 'uri',
                                            label: 'View detail',
                                            uri: 'http://example.com/page/123'
                                        },
                                        actions: [{
                                                type: 'postback',
                                                label: 'Buy',
                                                data: 'BUY'
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
                                        title: 'Benih Cabai',
                                        text: 'Berkualitas',
                                        defaultAction: {
                                            type: 'uri',
                                            label: 'View detail',
                                            uri: 'http://example.com/page/123'
                                        },
                                        actions: [{
                                                type: 'postback',
                                                label: 'Buy',
                                                data: 'BUY'
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