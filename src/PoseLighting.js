import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';


const PoseDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  let frameCount = 0;
  const startTimeRef = useRef(0);
  const inputResolution = useMemo(() => ({ width: 640, height: 480 }), []);

  useEffect(() => {
    const runPoseDetection = async () => {
      tf.setBackend('webgl'); // or 'wasm' or 'cpu'

      const architecture = 'MobileNetV2'; // Specify the architecture (MobileNetV1 or ResNet50)
      const outputStride = 16; // Specify the output stride (8, 16, or 32)

      const multiplier = 0.75; // Specify the multiplier (1.0, 0.75, or 0.50)
      const quantBytes = 4; // Specify the quantization bytes (4, 2, or 1)
    
      const modelConfig = {
        modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        architecture,
        outputStride,
        inputResolution,
        multiplier,
        quantBytes,
      };
    
      const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, modelConfig);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      startTimeRef.current = performance.now();

      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              video.play();
              detectPose(detector, video, ctx);
            };
          })
          .catch((error) => {
            console.error('Error accessing the webcam: ', error);
          });
      }
    };

    const detectPose = async (detector, video, ctx) => {
        while (true) {
          const poses = await detector.estimatePoses(video);
          const pose = poses[0]; // Assuming only one pose is detected
          drawPose(pose, ctx);
          frameCount++;
      
          if (frameCount % 10 === 0) {
            const currentTime = performance.now();
            const elapsedTime = currentTime - startTimeRef.current;
            const currentFps = Math.round((frameCount / elapsedTime) * 1000);
            setFps(currentFps);
          }
      
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
    };

    const drawPose = (pose, ctx) => {
        // Clear the canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
        // Check if pose is defined and has keypoints property
        if (pose && pose.keypoints) {
          // Draw the keypoints
          //console.log(pose.keypoints);
          pose.keypoints.forEach((keypoint) => {
            if (keypoint.score >= 0.4) {
                //console.log(keypoint);

              // Draw a circle at the keypoint position relative to the video element
              const videoElement = videoRef.current;
              const videoWidth = videoElement.videoWidth;
              const videoHeight = videoElement.videoHeight;
              const canvasWidth = videoElement.offsetWidth;
              const canvasHeight = videoElement.offsetHeight;
      
              const scaleX = canvasWidth / videoWidth;
              const scaleY = canvasHeight / videoHeight;
      
              const scaledX = keypoint.x * scaleX;
              const scaledY = keypoint.y * scaleY;
      
              ctx.beginPath();
              ctx.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'red';
              ctx.fill();
            }
          });
        }
      };

    runPoseDetection();
  }, [frameCount, inputResolution]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} width={inputResolution.width} height={inputResolution.height} autoPlay style={{ transform: 'scale(1)' }}></video>
        <canvas ref={canvasRef} width={inputResolution.width} height={inputResolution.height} style={{  transform: 'scale(1)', position: 'absolute', top: 0, left: 0 }}></canvas>
        <div>fps: {fps}</div>
      </div>
    </div>
  );
};

export default PoseDetection;