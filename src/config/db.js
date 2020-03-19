const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://chatbot:chatbot@cluster0-oxc7u.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(function () {
    console.log('mongodb connected')
}).catch(function (e) {
    console.log(e)
})