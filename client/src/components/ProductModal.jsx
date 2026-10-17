
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Camera,
  Images,
  Link as LinkIcon,
  Upload,
  Trash2,
  ImagePlus,
  RotateCcw
} from "lucide-react";

const MAX_IMAGE_SIZE = 700 * 1024;

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Could not read this image. Please try another."));
      image.src = objectUrl;
    });

    const maxDimension = 1200;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Image processing is not supported in this browser.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.8;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    while (dataUrl.length > MAX_IMAGE_SIZE && quality > 0.25) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > MAX_IMAGE_SIZE) {
      throw new Error(
        "This image is too large. Please choose a smaller photo."
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ProductModal({
  editing,
  productForm,
  setProductForm,
  categories,
  saveProduct,
  setShowProduct
}) {
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [imageMode, setImageMode] = useState(
    productForm.image ? "url" : "upload"
  );
  const [preview, setPreview] = useState(productForm.image || "");
  const [imageError, setImageError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");

  useEffect(() => {
    if (!showCamera || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch(() => {
      setCameraErrorMessage(
        "Camera preview could not start. Please try again."
      );
    });
  }, [showCamera, cameraFacing]);

  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function updateField(field, value) {
    setProductForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  async function handleImageSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImageError("");
    setProcessing(true);

    try {
      const compressedImage = await compressImage(file);
      updateField("image", compressedImage);
      setPreview(compressedImage);
      setImageMode("upload");
    } catch (error) {
      setImageError(error.message || "Unable to process this image.");
    } finally {
      setProcessing(false);
    }
  }

  async function openCamera(facing = cameraFacing) {
    setImageError("");
    setCameraError("");
    setCameraLoading(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError(
        "Camera access is unavailable. Use localhost or HTTPS and try again."
      );
      return;
    }

    try {
      // Stop any existing camera stream before opening another.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      setCameraFacing(facing);
      setShowCamera(true);
      setImageMode("upload");
    } catch (error) {
      let message = "Could not open the camera. Please try again.";

      if (error.name === "NotAllowedError") {
        message =
          "Camera permission was denied. Allow camera access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        message =
          "No camera was found. Connect a webcam or try another device.";
      } else if (error.name === "NotReadableError") {
        message =
          "The camera may already be in use by another application. Close it and try again.";
      } else if (
        error.name === "SecurityError" ||
        !window.isSecureContext
      ) {
        message =
          "Camera access requires HTTPS or localhost.";
      }

      setCameraError(message);
    } finally {
      setCameraLoading(false);
    }
  }

  function setCameraErrorMessage(message) {
    setCameraError(message);
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraLoading(false);
  }

  async function capturePhoto() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Please wait for the camera preview to become ready.");
      return;
    }

    setProcessing(true);
    setImageError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture the photo. Please try again.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.85);
      });

      if (!blob) {
        throw new Error("Could not capture the photo. Please try again.");
      }

      const file = new File([blob], "produce-photo.jpg", {
        type: "image/jpeg"
      });

      closeCamera();
      await handleImageSelect({
        target: {
          files: [file],
          value: ""
        }
      });
    } catch (error) {
      setImageError(error.message || "Could not capture this photo.");
      setProcessing(false);
    }
  }

  function handleImageUrlChange(value) {
    updateField("image", value);
    setPreview(value);
    setImageError("");
  }

  function clearImage() {
    updateField("image", "");
    setPreview("");
    setImageError("");
  }

  function handlePreviewError() {
    setImageError(
      "Image preview unavailable. Check the URL or select another photo."
    );
  }

  function closeModal() {
    closeCamera();
    setShowProduct(false);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !processing) {
          closeModal();
        }
      }}
    >
      <form
        className="modal-card product-modal"
        onSubmit={saveProduct}
      >
        <button
          type="button"
          className="modal-close"
          onClick={closeModal}
          aria-label="Close form"
        >
          <X size={18} />
        </button>

        <span className="eyebrow green">FARMER WORKSPACE</span>
        <h2>{editing ? "Edit produce" : "List new produce"}</h2>

        <label>
          Product name
          <input
            required
            maxLength={100}
            value={productForm.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
          />
        </label>

        <div className="form-two">
          <label>
            Category
            <select
              value={productForm.category}
              onChange={(event) =>
                updateField("category", event.target.value)
              }
            >
              {categories
                .filter((category) => category !== "All")
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Unit
            <select
              value={productForm.unit}
              onChange={(event) =>
                updateField("unit", event.target.value)
              }
            >
              {["kg", "bunch", "piece", "dozen", "litre"].map(
                (unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="form-two">
          <label>
            Price
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={productForm.price}
              onChange={(event) =>
                updateField("price", event.target.value)
              }
            />
          </label>

          <label>
            Quantity
            <input
              required
              type="number"
              min="0"
              step="any"
              value={productForm.quantity}
              onChange={(event) =>
                updateField("quantity", event.target.value)
              }
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows="3"
            maxLength={1000}
            value={productForm.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
          />
        </label>

        <div className="farmer-image-section">
          <div className="farmer-image-heading">
            <ImagePlus size={19} />
            <div>
              <strong>Product photo</strong>
              <p>Add a photo of your fresh produce</p>
            </div>
          </div>

          <div className="farmer-image-options">
            <button
              type="button"
              className={`farmer-image-option ${
                imageMode === "url" ? "active" : ""
              }`}
              onClick={() => {
                setImageMode("url");
                setImageError("");
                closeCamera();
              }}
            >
              <LinkIcon size={19} />
              <span>Image URL</span>
            </button>

            <button
              type="button"
              className={`farmer-image-option ${
                imageMode === "upload" && !showCamera ? "active" : ""
              }`}
              onClick={() => {
                setImageMode("upload");
                setImageError("");
                closeCamera();
                galleryRef.current?.click();
              }}
            >
              <Images size={19} />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              className={`farmer-image-option ${
                showCamera ? "active" : ""
              }`}
              onClick={() => openCamera()}
              disabled={cameraLoading || processing}
            >
              <Camera size={19} />
              <span>{cameraLoading ? "Opening..." : "Camera"}</span>
            </button>
          </div>

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageSelect}
          />

          {showCamera && (
            <div className="farmer-camera-panel">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="farmer-camera-video"
              />

              <div className="farmer-camera-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={capturePhoto}
                  disabled={processing || cameraLoading}
                >
                  <Camera size={17} />
                  Capture photo
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    openCamera(
                      cameraFacing === "environment"
                        ? "user"
                        : "environment"
                    )
                  }
                  disabled={cameraLoading}
                >
                  <RotateCcw size={17} />
                  Switch camera
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={closeCamera}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="farmer-image-error" role="alert">
              {cameraError}
            </p>
          )}

          {imageMode === "url" && (
            <label className="farmer-image-url">
              Image URL
              <input
                type="url"
                value={
                  productForm.image.startsWith("data:")
                    ? ""
                    : productForm.image
                }
                onChange={(event) =>
                  handleImageUrlChange(event.target.value)
                }
                placeholder="Paste an image URL"
              />
            </label>
          )}

          {imageMode === "upload" && !showCamera && (
            <button
              type="button"
              className="farmer-gallery-button"
              onClick={() => galleryRef.current?.click()}
            >
              <Upload size={18} />
              Choose photo from gallery
            </button>
          )}

          {processing && (
            <p className="farmer-image-status">
              Processing and compressing your photo...
            </p>
          )}

          {preview && (
            <div className="farmer-image-preview">
              <img
                src={preview}
                alt="Selected produce preview"
                onError={handlePreviewError}
              />

              <div className="farmer-image-preview-info">
                <strong>Image preview</strong>
                <span>
                  {productForm.image.startsWith("data:")
                    ? "Photo ready to save"
                    : "Image URL"}
                </span>
              </div>

              <button
                type="button"
                className="farmer-remove-image"
                onClick={clearImage}
                aria-label="Remove selected image"
                title="Remove image"
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}

          {imageError && (
            <p className="farmer-image-error" role="alert">
              {imageError}
            </p>
          )}

          <p className="farmer-image-hint">
            Choose a URL, select a photo, or take a picture with
            your camera. Photos are compressed before saving.
          </p>
        </div>

        <button
          className="btn btn-primary full"
          type="submit"
          disabled={processing || showCamera || cameraLoading}
        >
          {processing
            ? "Preparing photo..."
            : editing
              ? "Save changes"
              : "Add produce"}
        </button>
      </form>
    </div>
  );
}
