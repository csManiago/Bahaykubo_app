import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, X, Aperture, ChevronDown } from "lucide-react";
import detectionStyles from "./Detection.module.css";
import nutritionData from "../../nutrition.json"; 

function DetectionModal({ onClose, onDetect }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [isMobile, setIsMobile] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(null);

  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };
    checkIsMobile();
  }, []);

  const runDetection = async (fileToDetect) => {
    if (!fileToDetect) {
      setError("No file provided for detection.");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileToDetect);
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const response = await fetch(
        "https://bahaykubo-api.onrender.com/detect",
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      if (!data.image) throw new Error("No image returned from API");

      let processedData = { image: data.image, detections: [] };
      if (data.class_names) {
        let classNames = Array.isArray(data.class_names)
          ? data.class_names
          : typeof data.class_names === "string"
          ? data.class_names.split(",").map((c) => c.trim())
          : [data.class_names];
        // Remove duplicates while preserving order
        const uniqueClassNames = [...new Set(classNames.filter((c) => c))];
        processedData.detections = uniqueClassNames.map((className) => ({
          class_name: className,
        }));
      }
      setResult(processedData);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          "Request timeout: API server may be overloaded. Please try again."
        );
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
      setUseCamera(false);
      runDetection(selectedFile);
    }
  };

  const handleCameraCapture = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
      setUseCamera(false);
      runDetection(selectedFile);
    }
  };

  const toggleCameraCapture = () => {
    if (isMobile) {
      cameraInputRef.current?.click();
    } else {
      setUseCamera(!useCamera);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const newFile = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        setFile(newFile);
        setPreview(imageSrc);
        setResult(null);
        setError(null);
        runDetection(newFile);
      })
      .catch((err) => {
        console.error("Error converting image:", err);
        setError("Error capturing photo");
      });
  };

  const toggleCamera = () => {
    setUseCamera(!useCamera);
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  const getNutritionInfo = (className) => {
    return nutritionData.find(
      (item) => item.class_name.toLowerCase() === className.toLowerCase()
    );
  };


  return (
    // 1. The Outer Backdrop
    <div className={detectionStyles.dialogBackdrop} onClick={onClose}>
      {/* 2. The Modal Content Box */}
      <div
        className={detectionStyles.dialogContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={detectionStyles.dialogTitle}>Detect Vegetable</h2>

        <div className={detectionStyles.container}>
          {!useCamera ? (
            <div className={detectionStyles.form}>
              <div
                className={detectionStyles.fileInputWrapper}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={detectionStyles.fileInput}
                />
                <label
                  htmlFor="file-input"
                  className={detectionStyles.fileLabel}
                >
                  {file ? `📁 ${file.name}` : "📂 Choose Image"}
                </label>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                onChange={handleCameraCapture}
                className={detectionStyles.fileInput}
                capture="environment"
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={toggleCameraCapture}
                className={detectionStyles.cameraBtn}
              >
                <Camera size={20} /> Open Camera
              </button>

              {preview && !result && (
                <div className={detectionStyles.previewContainer}>
                  {loading && (
                    <div className={detectionStyles.loadingIndicator}>
                      ⏳ Processing...
                    </div>
                  )}
                  <img
                    src={preview}
                    alt="Preview"
                    className={detectionStyles.previewImage}
                    style={{ opacity: loading ? 0.5 : 1 }}
                  />
                </div>
              )}
              {result && result.image && (
                <div className={detectionStyles.previewContainer}>
                  <img
                    src={result.image}
                    alt="Annotated"
                    className={detectionStyles.previewImage}
                  />
                </div>
              )}
              {result && result.detections && result.detections.length > 0 && (
                <div className={detectionStyles.vegetableInfo}>
                  <label>
                    Detected Vegetables ({result.detections.length}):
                  </label>
                  <div className={detectionStyles.vegetableList}>
                    {result.detections.map((detection, index) => {
                      const nutrition = getNutritionInfo(detection.class_name);
                      const isExpanded = expandedNutrition === index;
                      return (
                        <div key={index}>
                          <div className={detectionStyles.vegetableItem}>
                            <p>
                              <strong>{detection.class_name}</strong>
                            </p>
                            {nutrition && (
                              <button
                                onClick={() =>
                                  setExpandedNutrition(isExpanded ? null : index)
                                }
                                className={detectionStyles.nutritionToggleBtn}
                                title="View nutrition facts"
                              >
                                <ChevronDown
                                  size={18}
                                  style={{
                                    transform: isExpanded
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                  }}
                                />
                              </button>
                            )}
                          </div>
                          {isExpanded && nutrition && (
                            <div className={detectionStyles.nutritionDropdown}>
                              <div className={detectionStyles.nutritionContent}>
                                <h4>{nutrition.class_name} - Nutrition Facts</h4>
                                <p className={detectionStyles.servingSize}>
                                  {nutrition.info.serving}
                                </p>
                                <div className={detectionStyles.nutritionGrid}>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Calories:</span>
                                    <span>{nutrition.info.calories}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Carbs:</span>
                                    <span>{nutrition.info.carbs}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Fiber:</span>
                                    <span>{nutrition.info.fiber}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Protein:</span>
                                    <span>{nutrition.info.protein}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Fat:</span>
                                    <span>{nutrition.info.fat}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Potassium:</span>
                                    <span>{nutrition.info.potassium}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Folate:</span>
                                    <span>{nutrition.info.folate}</span>
                                  </div>
                                </div>
                                {Object.keys(nutrition.info.vitamins).length > 0 && (
                                  <div className={detectionStyles.vitaminSection}>
                                    <h5>Vitamins</h5>
                                    {Object.entries(
                                      nutrition.info.vitamins
                                    ).map(([name, value]) => (
                                      <div
                                        key={name}
                                        className={
                                          detectionStyles.nutritionRow
                                        }
                                      >
                                        <span>Vitamin {name}:</span>
                                        <span>{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {nutrition.info.details && (
                                  <p className={detectionStyles.nutritionDetails}>
                                    {nutrition.info.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {result &&
                (!result.detections || result.detections.length === 0) && (
                  <div
                    className={detectionStyles.vegetableInfo}
                    style={{
                      color: "#666",
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <p>No vegetables detected.</p>
                  </div>
                )}
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setPreview(null);
                    setError(null);
                    setExpandedNutrition(null);
                  }}
                  className={detectionStyles.resetBtn}
                >
                  New Detection
                </button>
              )}
            </div>
          ) : (
            <div className={detectionStyles.cameraContainer}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }}
                className={detectionStyles.webcam}
                mirrored={facingMode === "user"}
                onUserMediaError={() => {
                  setError("Camera access denied.");
                  setUseCamera(false);
                }}
              />
              <div className={detectionStyles.cameraControls}>
                <button
                  onClick={capturePhoto}
                  className={detectionStyles.captureBtn}
                  disabled={loading}
                  title="Capture Photo"
                >
                  <Aperture size={32} color="#333" />
                </button>
                <button
                  onClick={switchCamera}
                  className={detectionStyles.switchBtn}
                  disabled={loading}
                  title="Switch Camera"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={toggleCamera}
                  className={detectionStyles.closeCameraBtn}
                  disabled={loading}
                  title="Close Camera"
                >
                  <X size={24} />
                </button>
              </div>
              {preview && !result && (
                <div className={detectionStyles.previewContainer}>
                  {loading && (
                    <div className={detectionStyles.loadingIndicator}>
                      ⏳ Processing...
                    </div>
                  )}
                  <img
                    src={preview}
                    alt="Captured"
                    className={detectionStyles.previewImage}
                    style={{ opacity: loading ? 0.5 : 1 }}
                  />
                </div>
              )}
              {result && result.image && (
                <div className={detectionStyles.previewContainer}>
                  <img
                    src={result.image}
                    alt="Annotated"
                    className={detectionStyles.previewImage}
                  />
                </div>
              )}
              {result && result.detections && result.detections.length > 0 && (
                <div className={detectionStyles.vegetableInfo}>
                  <label>
                    Detected Vegetables ({result.detections.length}):
                  </label>
                  <div className={detectionStyles.vegetableList}>
                    {result.detections.map((detection, index) => {
                      const nutrition = getNutritionInfo(detection.class_name);
                      const isExpanded = expandedNutrition === index;
                      return (
                        <div key={index}>
                          <div className={detectionStyles.vegetableItem}>
                            <p>
                              <strong>{detection.class_name}</strong>
                            </p>
                            {nutrition && (
                              <button
                                onClick={() =>
                                  setExpandedNutrition(isExpanded ? null : index)
                                }
                                className={detectionStyles.nutritionToggleBtn}
                                title="View nutrition facts"
                              >
                                <ChevronDown
                                  size={18}
                                  style={{
                                    transform: isExpanded
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                  }}
                                />
                              </button>
                            )}
                          </div>
                          {isExpanded && nutrition && (
                            <div className={detectionStyles.nutritionDropdown}>
                              <div className={detectionStyles.nutritionContent}>
                                <h4>{nutrition.class_name} - Nutrition Facts</h4>
                                <p className={detectionStyles.servingSize}>
                                  {nutrition.info.serving}
                                </p>
                                <div className={detectionStyles.nutritionGrid}>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Calories:</span>
                                    <span>{nutrition.info.calories}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Carbs:</span>
                                    <span>{nutrition.info.carbs}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Fiber:</span>
                                    <span>{nutrition.info.fiber}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Protein:</span>
                                    <span>{nutrition.info.protein}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Fat:</span>
                                    <span>{nutrition.info.fat}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Potassium:</span>
                                    <span>{nutrition.info.potassium}</span>
                                  </div>
                                  <div className={detectionStyles.nutritionRow}>
                                    <span>Folate:</span>
                                    <span>{nutrition.info.folate}</span>
                                  </div>
                                </div>
                                {Object.keys(nutrition.info.vitamins).length > 0 && (
                                  <div className={detectionStyles.vitaminSection}>
                                    <h5>Vitamins</h5>
                                    {Object.entries(
                                      nutrition.info.vitamins
                                    ).map(([name, value]) => (
                                      <div
                                        key={name}
                                        className={
                                          detectionStyles.nutritionRow
                                        }
                                      >
                                        <span>Vitamin {name}:</span>
                                        <span>{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {nutrition.info.details && (
                                  <p className={detectionStyles.nutritionDetails}>
                                    {nutrition.info.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {result &&
                (!result.detections || result.detections.length === 0) && (
                  <div
                    className={detectionStyles.vegetableInfo}
                    style={{
                      color: "#666",
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <p>No vegetables detected.</p>
                  </div>
                )}
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setPreview(null);
                    setError(null);
                  }}
                  className={detectionStyles.resetBtn}
                >
                  New Detection
                </button>
              )}
            </div>
          )}
          {error && (
            <div className={detectionStyles.errorMessage}>⚠️ {error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetectionModal;
