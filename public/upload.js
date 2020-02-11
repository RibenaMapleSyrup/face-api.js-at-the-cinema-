Promise.all([
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')

]).then(startVideo)

function startVideo() {
console.log('loaded models');
}

async function detect(image) {
  let detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceExpressions()
  send(detections)
}

function send(detections) {
  const input = $('#uploaded');

      var post_url = $('#uploadForm').attr("action");
      var request_method = $('#uploadForm').attr("method");
  	  var form_data = new FormData(document.getElementById('uploadForm'));
      var expressions = [
        detections[0].expressions.neutral.toFixed(2),
        detections[0].expressions.happy.toFixed(2),
        detections[0].expressions.sad.toFixed(2),
        detections[0].expressions.angry.toFixed(2),
        detections[0].expressions.fearful.toFixed(2),
        detections[0].expressions.disgusted.toFixed(2),
        detections[0].expressions.surprised.toFixed(2)
      ]
      console.log('here')

      form_data.append('width', JSON.stringify(detections[0].landmarks.imageWidth));
      form_data.append('height', JSON.stringify(detections[0].landmarks.imageHeight));
      form_data.append('expressions', (expressions));

      $.ajax({
          url : post_url,
          type: request_method,
          data : form_data,
  		contentType: false,
  		cache: false,
  		processData:false
      }).done(function(response){ //
          $("#server-results").html(response);
      });
      
document.getElementById("uploadForm").reset();
return false

}

function run(input) {
var reader = new FileReader();
reader.onload = function(event) {
  src = event.target.result;
  var x = document.createElement("IMG");
    x.setAttribute("id", "img1")
    x.setAttribute("src", src)
    x.setAttribute("hidden", true )
    document.body.appendChild(x)
    image = document.getElementById('img1')
    detect(image)
};
reader.readAsDataURL(input)
}

function getResults() {
  const input = $('#uploaded');
  const name = $('#name')
  run(input[0].files[0]);
}

$("#uploadForm").submit(function (event){
  getResults()
  event.preventDefault();
});
