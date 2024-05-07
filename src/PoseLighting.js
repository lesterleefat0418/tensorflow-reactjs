import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgpu';

const PoseDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const runPoseDetection = async () => {
      tf.setBackend('webgpu');

      const modelConfig = {
        modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };

      const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, modelConfig);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      startTimeRef.current = performance.now();

      const detectPose = async () => {
        const poses = await detector.estimatePoses(video);
        const pose = poses[0]; // Assuming only one pose is detected
        drawPose(pose, ctx);

        frameCountRef.current++;
        const frameCount = frameCountRef.current;

        if (frameCount % 10 === 0) {
          const currentTime = performance.now();
          const elapsedTime = currentTime - startTimeRef.current;
          const currentFps = Math.round((frameCount / elapsedTime) * 1000);
          setFps(currentFps);
        }

        requestAnimationFrame(detectPose);
      };

      detectPose();
    };

    const drawPose = (pose, ctx) => {
      // Clear the canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Check if pose is defined and has keypoints property
      if (pose && pose.keypoints) {
        // Draw the keypoints
        pose.keypoints.forEach((keypoint) => {
          if (keypoint.score >= 0.3) {

            console.log(keypoint);
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

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      } catch (error) {
        console.error('Error accessing the webcam: ', error);
      }
    };

    runPoseDetection();
    initializeCamera();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} width={320} height={240} autoPlay style={{ transform: 'scale(1)' }}></video>
        <canvas ref={canvasRef} width={320} height={240} style={{ transform: 'scale(1)', position: 'absolute', top: 0, left: 0 }}></canvas>
        <div>fps: {fps}</div>
      </div>
    </div>
  );
};

export default PoseDetection;