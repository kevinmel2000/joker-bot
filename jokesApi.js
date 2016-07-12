"use strict";

var jokes = [];
var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('jokes.csv')
});

lineReader.on('line', function (line) {
    jokes.push(line.toString());
}).on('close', ()=>{
    console.log("we have the next count of text jokes", jokes.length);
});

exports.getJoke = function (callback) {
    var index = Math.floor(Math.random() * jokes.length);
    var randomQuote = jokes[index];
    callback(randomQuote.replace("\\n", '\n'));
};

//-------------------
// image jokes

var imageJokes = [];
var lineReader2 = require('readline').createInterface({
    input: require('fs').createReadStream('jokes_images.csv')
});

lineReader2.on('line', function (line) {
    imageJokes.push(line.toString());
}).on('close', ()=>{
    console.log("we have the next count of image jokes", imageJokes.length);
});

exports.getImageJoke = function (callback) {
    var index = Math.floor(Math.random() * imageJokes.length);
    var randomImage = imageJokes[index];
    callback(randomImage);
};

