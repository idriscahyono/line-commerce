module.exports = {
    getMenuBuble: function (replyToken) {
        return {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'horizontal',
                contents: [{
                        type: 'text',
                        text: 'Hello,'
                    },
                    {
                        type: 'text',
                        text: 'World!'
                    }
                ]
            }
        }
    }
}