const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    {video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
  document.getElementById('img2')
    .setAttribute(
        'src', "/images/bladerunner.jpg"
    );
  document.getElementById("name").innerHTML = "no faces detected"
  document.getElementById("film").innerHTML = " "
}

video.addEventListener('loadeddata', function(){
  document.getElementById("info").style.display = "block";
  document.getElementById("character").style.display = "block";
}, false)

async function getData(expressions) {

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(expressions)
  };

  const response = await fetch('/api', options);
  const data = await response.json();
  if (data.image) {
    if (data.image.length > 1) {
  document.getElementById('img2')
    .setAttribute(
        'src', data.image
    );
  document.getElementById("name").innerHTML = data.name + " as " + data.character + " in "
  document.getElementById("film").innerHTML = data.film
  }
  };
};

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.getElementById('canvasContainer').appendChild(canvas)
  const displaySize = {width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video,
    // new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceExpressions()
    new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()

    if (detections.length == 0) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      document.getElementById('img2').src = 'images/witch.png';
      document.getElementById("name").innerHTML = "no faces detected"
      document.getElementById("film").innerHTML = " "
      var exp = [1,1,1,1,1,1,1]
      getData(exp)
      return
    }

    var expressions = [
      detections[0].expressions.neutral.toFixed(2),
      detections[0].expressions.happy.toFixed(2),
      detections[0].expressions.sad.toFixed(2),
      detections[0].expressions.angry.toFixed(2),
      detections[0].expressions.fearful.toFixed(2),
      detections[0].expressions.disgusted.toFixed(2),
      detections[0].expressions.surprised.toFixed(2)
    ]

    getData(expressions);

    // search database for similar detections and retrieve image...
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 300)
  });
