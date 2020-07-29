// use const for require

const express = require('express');
const Datastore = require('nedb');
const math = require('mathjs')
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require("fs");
const database = new Datastore('database.db');
var threshold = 1;
var min = 5;

// Queue function for queuing inference results in a fixed length array
// to obtain average values for more stability.

function Queue() {
  this.data= [];
}

Queue.prototype.add = function(record) {
  this.data.unshift(record);
}
Queue.prototype.remove = function() {
  this.data.pop();
}

Queue.prototype.first = function() {
  return this.data[0];
}
Queue.prototype.last = function() {
  return this.data[this.data.length - 1];
}
Queue.prototype.size = function() {
  return this.data.length;
}

const q = new Queue(0)

while (q.size() < 10) {
  q.add(0,0,0,0,0,0,0)
  console.log('added')
  //response.json([])
};

// Use multer to store uploaded images within ./images folder

var storage = multer.diskStorage({

    destination: function(request, file, callback) {
      callback(null, './images');
    },
    filename: function (request, file, callback) {

      let path = request.body.film.replace(/\s+/g, '') + '.png'
      fs.access(("./images/" + path), fs.F_OK, (err) => {
        if(err) {
          console.error(err)
          callback(null, path)
          return
        }
      })
    }
});

var upload = multer({ storage : storage}).single('photo');

function getRandomInt(max){
  return Math.floor(Math.random()*Math.floor(max));
}

function getBase64(file) {
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = function () {
     console.log(reader.result);
     return reader.result
   };
   reader.onerror = function (error) {
     console.log('Error: ', error);
   };
}

// initiate NeDB database for storing uploaded image inference values and for
// querying to find images that matches webcam image the closest

database.loadDatabase();


app.listen(4002, () => console.log('listening at 4002'));
app.use(express.static('public'));
app.use(express.json())

app.post('/api', (request, response) => {
  const results = request.body.map(Number);
  var doc = [];
  var file

  q.remove();
  q.add(results)

  var q1 = math.add(q.data[0],q.data[1],q.data[2],q.data[3],q.data[4])
  var q2 = math.add(q.data[5],q.data[6],q.data[7],q.data[8],q.data[9])
  var diff = math.norm(math.subtract(q2,q1));

  diff /= q.size()/3

  // compare the average of the first and last 5 results within the Queue.
  // if there is a significant change ( < 4) then face expression has changed and
  // database should be queried for a new image to load. Otherwise keep the
  // current image displayed.

  if (diff < 1) {
    response.json([])
    return
  }

  database.find({}, (err, data) => {
    if (err) {
      console.log('database error')
    }

  // compare expression results with expressions of each image indexed in the
  // database. If comparrison is similar (norm < 1), store in an array of
  // similar images.
    for (item of data) {
      norm = math.norm(math.subtract(results, item.expressions))
      if (norm < threshold){
        doc.push([item.name, item.character, item.film, item.filename])
      }
    };

    if (doc.length > 0) {
      file = doc[getRandomInt(doc.length)]
    }
    else {
      console.log('no similar images found, try adding more images to database or increase threshold value')
      response.json([])
      return
    }

    for (var i = 0; i < q.size(); i++){
      q.remove();
      q.add(results)
    }

    let url = 'images/' + file[3];
    let b64 = getBase64(url)
    send = {
    "name": file[0],
    "character": file[1],
    "film": file[2],
    "image": b64};
    
    response.json(send);
  });
});


app.post('/upload_image',function(request,response){

    upload(request,response,function(err) {

      request.body["expressions"] = request.body["expressions"].split(',').map(Number)
      request.body["filename"] = request.file.filename
      database.insert(request.body)

        if(err) {
            return response.end("Error uploading file.");
        }
    });
});
