import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';

const PoseDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  let frameCount = 0;
  const startTimeRef = useRef(0);

  useEffect(() => {
    const runPoseDetection = async () => {
      tf.setBackend('webgl'); // or 'wasm' or 'cpu'
      const net = await posenet.load();
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
              detectPose(net, video, ctx);
            };
          })
          .catch((error) => {
            console.error('Error accessing the webcam: ', error);
          });
      }
    };

    const detectPose = async (net, video, ctx) => {
      while (true) {
        const pose = await net.estimateSinglePose(video);
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

      // Draw the keypoints
      pose.keypoints.forEach((keypoint) => {
        if (keypoint.score >= 0.5) {
          const { x, y } = keypoint.position;

          // Draw a circle at the keypoint position relative to the video element
          const videoElement = videoRef.current;
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;
          const canvasWidth = videoElement.offsetWidth;
          const canvasHeight = videoElement.offsetHeight;

          const scaleX = canvasWidth / videoWidth;
          const scaleY = canvasHeight / videoHeight;

          const scaledX = x * scaleX;
          const scaledY = y * scaleY;

          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      });
      
    };

    runPoseDetection();
  }, [frameCount]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} width="640" height="480" autoPlay style={{ transform: 'scale(1)' }}></video>
        <canvas ref={canvasRef} width="640" height="480" style={{  transform: 'scale(1)', position: 'absolute', top: 0, left: 0 }}></canvas>
        <div>fps: {fps}</div>
      </div>
    </div>
  );
};

export default PoseDetection;