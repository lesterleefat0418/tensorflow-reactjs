import React, { useEffect, useRef } from 'react';
import { drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';

const UserPose = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkContainerRef = useRef(null);

  useEffect(() => {
    const onResults = (results) => {
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');
      const landmarkContainer = landmarkContainerRef.current;

      if (!results.poseLandmarks) {
        // Clear landmarks if poseLandmarks are not available
        while (landmarkContainer.firstChild) {
          landmarkContainer.firstChild.remove();
        }
        return;
      }

      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      canvasElement.width = videoWidth;
      canvasElement.height = videoHeight;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        radius: 1
      });
      canvasCtx.restore();

      // Update landmarkContainer with poseWorldLandmarks
      while (landmarkContainer.firstChild) {
        landmarkContainer.firstChild.remove();
      }
      for (const landmark of results.poseWorldLandmarks) {
        const landmarkElement = document.createElement('div');
        landmarkElement.classList.add('landmark');
        landmarkElement.style.left = `${landmark.x}px`;
        landmarkElement.style.top = `${landmark.y}px`;
        landmarkContainer.appendChild(landmarkElement);
      }
    };

    const runPoseEstimation = async () => {
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false, // Disable segmentation mask
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720
      });
      camera.start();
    };

    runPoseEstimation();
  }, []);

  return (
    <div className="App">
    <video
      ref={videoRef}
      className="input_video"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        position: 'absolute'
      }}
      autoPlay
      playsInline
      muted
    ></video>
    <canvas
      ref={canvasRef}
      className="output_canvas"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        position: 'relative'
      }}
    ></canvas>
    <div
      ref={landmarkContainerRef}
      className="landmark-grid-container"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        position: 'relative'
      }}
    ></div>
  </div>
  );
};

export default UserPose;