module.exports = {
    getMenu: function (replyToken) {
        return {
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
    },

    getRecipe: function (replyToken) {
        return {
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
    }
}