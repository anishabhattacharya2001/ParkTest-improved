const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
//&& 0<landmarks[4].x<1 && 0<landmarks[4].y<1 && 0<landmarks[8].x<1 && 0<landmarks[8].y<1 && 0<landmarks[12].x<1 && 0<landmarks[12].y<1 && 0<landmarks[16].x<1 && 0<landmarks[16].y<1 && 0<landmarks[20].x<1 && 0<landmarks[20].y<1

var error_message = document.getElementById("error-message");

let camera_button = document.querySelector("#start-camera");
let video = document.querySelector("#video");
let start_button = document.querySelector("#start-record");
let stop_button = document.querySelector("#stop-record");
let download_link = document.querySelector("#download-video");



let camera_stream = null;
let media_recorder = null;
let blobs_recorded = [];

camera_button.addEventListener('click', async function() {
   	try {
    	camera_stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    catch(error) {
    	alert(error.message);
    	return;
    }

    video.srcObject = camera_stream;
    camera_button.style.display = 'none';
    video.style.display = 'block';
    start_button.style.display = 'block';
});

start_button.addEventListener('click', function() {
    media_recorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });

    media_recorder.addEventListener('dataavailable', function(e) {
    	blobs_recorded.push(e.data);
    });

    media_recorder.addEventListener('stop', function() {
    	let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
    	download_link.href = video_local;

        stop_button.style.display = 'none';
        download_link.style.display = 'block';
    });

    media_recorder.start(1000);

    start_button.style.display = 'none';
    stop_button.style.display = 'block';
});

stop_button.addEventListener('click', function() {
	media_recorder.stop(); 
    //call this method also when the video is bad
});

document.querySelector("#upload-button").addEventListener('click', async function() {
	let upload = await uploadFile();
	
	if(upload.error == 0)
		alert('File uploaded successful');
	else if(upload.error == 1)
		alert('File uploading failed - ' + upload.message);
});

// async function managing upload operation
async function uploadFile() {
	// function return value
	let return_data = { error: 0, message: '' };

	try {
		// no file selected
		if(document.querySelector("#file-to-upload").files.length == 0) {
			throw new Error('No file selected');
		}
		else {
			// formdata
			let data = new FormData();
			data.append('title', 'Sample Title');
			data.append('file', document.querySelector("#file-to-upload").files[0]);

			// send fetch along with cookies
			let response = await fetch('/upload.php', {
		        method: 'POST',
		        credentials: 'same-origin',
		        body: data
		    });

	    	// server responded with http response != 200
	    	if(response.status != 200)
	    		throw new Error('HTTP response code != 200');

	    	// read json response from server
	    	// success response example : {"error":0,"message":""}
	    	// error response example : {"error":1,"message":"File type not allowed"}
	    	let json_response = await response.json();
	        if(json_response.error == 1)
	           	throw new Error(json_response.message);	
		}
	}
	catch(e) {
		// catch rejected Promises and Error objects
    	return_data = { error: 1, message: e.message };
    }

	return return_data;
}



function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    if(results.multiHandLandmarks[0]){
        error_message.style.display="none";
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                        {color: '#00FF00', lineWidth: 5});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
              
        }     
    }
    else{
        console.log("hand is not in frame")
        error_message.style.display = "block";
        //alert("hand is not in frame") 
    }
  }

  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();

