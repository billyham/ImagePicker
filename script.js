(function(module){

  // ================================ Config ================================ //
  /**
   * Use RENDERED_IMAGE_WIDTH and RENDERED_IMAGE_HEIGHT to set the target pixel
   * dimensions for the file that is rendered and ready for upload to a
   * database, etc. These values also define the minimum size, imagePicker will
   * respond with an error message if the chosen file has a width or height less
   * than the following values.
   * In pixels.
   */
  const RENDERED_IMAGE_WIDTH = 440;
  const RENDERED_IMAGE_HEIGHT = 440;

  /**
   * Use PREVIEW_IMAGE_WIDTH to set the onscreen pixel dimensions of the
   * Imagepicker box to receive the drag and drop action. PREVIEW_IMAGE_HEIGHT
   * will be equal to RENDERED_IMAGE_HEIGHT multplied by the ratio:
   * PREVIEW_IMAGE_WIDTH / RENDERED_IMAGE_WIDTH
   * In pixels
   */
  const PREVIEW_IMAGE_WIDTH = 220;

  // =========================== Event Handlers ============================= //
  // Drag events
  module.onDrop             = onDrop;

  // Mouse & Touch events
  module.interactionStart   = interactionStart;
  module.interactionMove    = interactionMove;
  module.interactionEnd     = interactionEnd;
  module.interactionCancel  = interactionCancel;

  // Input & Button events
  module.clearImage         = clearImage;
  module.onChange           = onChange;
  module.submitRequest      = submitRequest;

  // =========================== Helper Functions =========================== //
  const _applyImage         = applyImage;
  const _setSize            = setSize;
  const _setSizeAlert       = setSizeAlert
  const _drawOverlay        = drawOverlay;
  const _drawCroppedCanvas  = drawCroppedCanvas;
  const _getImageSize       = getImageSize;

  // ================================= Init ================================= //
  const PREVIEW_IMAGE_HEIGHT  = RENDERED_IMAGE_HEIGHT * PREVIEW_IMAGE_WIDTH / RENDERED_IMAGE_WIDTH;
  var _canvasWidth            = PREVIEW_IMAGE_WIDTH;
  var _canvasHeight           = PREVIEW_IMAGE_HEIGHT;

  var _isEditing         = false;
  var _overlayOriginX    = 0;
  var _overlayOriginY    = 0;
  var _resizeRatio       = 1;
  var _rawWidth          = 0;

  var _rawHeight         = 0;
  var _initialPointerX   = 0;
  var _initialPointerY   = 0;
  var _currentX          = 0;
  var _currentY          = 0;

  var _previousX         = 0;
  var _previousY         = 0;
  var _imageData         = null;
  var _croppedImageData  = null;
  var _imageType         = '';

  // Alter size of HTML elements to config settings
  _setSize(PREVIEW_IMAGE_WIDTH, PREVIEW_IMAGE_HEIGHT);

  // ========================= Function Definitions ========================= //
  /**
   * Event handler for receiving drop events. Invokes the onChange event
   * associated with the <input> form item for selecting files, passing along
   * the dragged & dropped files.
   *
   * @param  {event} evnt
   */
  function onDrop(evnt) {
    evnt.stopPropagation();
    evnt.preventDefault();
    if (evnt.dataTransfer.files.length < 1) return;

    // TODO: Do something with the file name
    // evnt.dataTransfer.files[0].name;
    _imageType = evnt.dataTransfer.files[0].type;

    onChange(evnt.dataTransfer.files);
  };

  /**
   * Handler for both mouse and touch actions that initiate an interaction:
   * onMouseDown and onTouchStart.
   *
   * @param  {event} event
   */
  function interactionStart(event){
    _isEditing = true;
    _initialPointerX = event.pageX;
    _initialPointerY = event.pageY;

    // Accommodate touch events
    if (event.touches && event.touches.length > 0){
      _initialPointerX = event.touches.item(0).pageX;
      _initialPointerY = event.touches.item(0).pageY;
    }

    _drawOverlay(event);
  }

  /**
   * Handler for both mouse the touch events that move a pointer across the
   * screen: onMouseMove and onTouchMove
   *
   * @param  {event} event
   */
  function interactionMove(event){
    if (!_isEditing) return;
    _drawOverlay(event);
  }

  /**
   * Handler for both mouse and touch events that end an interaction: onMouseUp
   * and onTouchEnd.
   */
  function interactionEnd(){
    if (_isEditing) _drawCroppedCanvas();
    _isEditing = false;
    _previousX = _currentX;
    _previousY = _currentY;
  }

  /**
   * Handler for both mouse and touch events that cancel an interaction:
   * onMouseLeave and onTouchCancel
   */
  function interactionCancel(){
    if (_isEditing) _drawCroppedCanvas();
    _isEditing = false;
    _previousX = _currentX;
    _previousY = _currentY;
  }

  /**
   * Button action to remove the currently selected image and reset to the
   * initial state.
   */
  function clearImage(){
    _imageData = null;
    _imageType = '';
    _setSizeAlert(false);

    // Clear the value of the file input HTML element
    let filePath = document.getElementById('123');
    filePath.value = '';
    _applyImage();

    // Clear Proof of Concept div
    const targetNode = document.getElementById('target');
    const children = targetNode.childNodes;
    for (let i = children.length; i > 0; i--){
      targetNode.removeChild(targetNode.childNodes.item(i - 1));
    }

    // Show image drop zone
    const dropZone = document.getElementById('image-drop-zone');
    dropZone.className = 'drop-zone l-position-absolute';
  }

  /**
   * Handler initiated by change to the file type <input> and for drop actions
   * on the image drop zone. Files identified by either action are loaded and
   * converted to arrayBuffer objects. On successfully loading the file,
   * continues to update UI by calling _applyImage().
   *
   * @fires _applyImage
   *
   * @param  {Array} tryFiles
   */
  function onChange(tryFiles){
    _setSizeAlert();

    if (!tryFiles || tryFiles.length < 1) return;

    let file = tryFiles[0];

    // TODO: guard against non-image Content-Types
    _imageType = file.type;

    var fileReader = new FileReader();
    fileReader.onloadend = element => {
      _imageData = element.target.result;
      _applyImage();
    };
    fileReader.readAsArrayBuffer(file);
  };

  /**
   * Button action to render a final image. As a proof of concept, it draws
   * the image as full resolution below the imagePicker div.
   *
   * @todo Replace this code with work that is relevant to you.
   */
  function submitRequest(){
    if (!_croppedImageData) return;

    // Proof of concept: render image to the screen at full size
    const targetNode = document.getElementById('target');
    const children = targetNode.childNodes;
    for (let i = children.length; i > 0; i--){
      targetNode.removeChild(targetNode.childNodes.item(i - 1));
    }
    // Add full size image
    const imageForPoC = new Image();  // RENDERED_IMAGE_WIDTH, RENDERED_IMAGE_HEIGHT
    const blobForPoC = new Blob([_croppedImageData], { type: 'image/png' });
    imageForPoC.src = window.URL.createObjectURL(blobForPoC);
    imageForPoC.onload = function(){
      // Draw the image canvas
      targetNode.appendChild(imageForPoC);
      window.URL.revokeObjectURL(imageForPoC.src);
    };
  }

  /**
   * Evaluates the aspect ration and pixel dimensions of a selected image file.
   * Launches methods to draw the image onto the canvas element and draw a crop
   * frame in the overlay canvas.
   *
   * @fires _setSize
   * @fires _drawOverlay
   * @fires _drawCroppedCanvas
   */
  function applyImage() {
    _setSize(PREVIEW_IMAGE_WIDTH, PREVIEW_IMAGE_HEIGHT);
    _rawWidth = _rawHeight = 0;

    if (!_imageData) return;

    // __hide image drop zone
    const imageDropZone = document.getElementById('image-drop-zone');
    imageDropZone.className = '__hide';

    const canvas = document.getElementById('canvas-image');
    var ctx = canvas.getContext('2d');

    const widthAndHeight = _getImageSize(_imageData, _imageType);

    if (!widthAndHeight) return console.log('Failed to find image dimensions');

    _rawWidth = widthAndHeight.width;
    _rawHeight = widthAndHeight.height;

    // Guard against images that are too small
    if (_rawWidth === 0 && _rawHeight === 0) console.log('failed to read image dimensions');
    if (_rawWidth < RENDERED_IMAGE_WIDTH || _rawHeight < RENDERED_IMAGE_HEIGHT){
      clearImage();
      _setSizeAlert(true);
      return;
    }

    // Identify the resize-ratio and aspect ratio
    const initialAspectRatio = PREVIEW_IMAGE_WIDTH / PREVIEW_IMAGE_HEIGHT;

    let aspectRatio = 1;

    // let landscape = _rawWidth >= _rawHeight;
    let landscape = _rawWidth / _rawHeight >= PREVIEW_IMAGE_WIDTH / PREVIEW_IMAGE_HEIGHT;

    const big = landscape ? _rawWidth : _rawHeight;
    const small = landscape ? _rawHeight : _rawWidth;
    aspectRatio = big / small;

    _resizeRatio = landscape ? _rawHeight / RENDERED_IMAGE_HEIGHT : _rawWidth / RENDERED_IMAGE_WIDTH;

    // TODO: change _canvasWidth to PREVIEW_IMAGE_WIDTH, etc
    const finalWidth = landscape ? _canvasWidth * aspectRatio / initialAspectRatio : _canvasWidth;
    const finalHeight = landscape ? _canvasHeight : _canvasHeight * aspectRatio * initialAspectRatio;

    // Adjust HTML elements to new size
    _setSize(finalWidth, finalHeight);

    const imageForDraw = new Image(finalWidth, finalHeight);
    const blobForDraw = new Blob([_imageData], { type: _imageType });
    imageForDraw.src = window.URL.createObjectURL(blobForDraw);
    imageForDraw.onload = function(){
      // Draw the image canvas
      ctx.drawImage(imageForDraw, 0, 0, finalWidth, finalHeight);
    };

    // Draw an initial overlay
    _drawOverlay();
    // Create an initial cropped image
    _drawCroppedCanvas();
  };

  /**
   * Set size of image canvas and container elements based on raw image size.
   *
   * @param {number} setWidth
   * @param {number} setHeight
   */
  function setSize(setWidth, setHeight){

    const collectionOfElements = document.getElementsByClassName('variable-size');
    for (let n = 0; n < collectionOfElements.length; n++) {
      collectionOfElements[n].style.width = `${setWidth}px`;
      collectionOfElements[n].style.height = `${setHeight}px`;
    }

    const canvas = document.getElementById('canvas-image');
    _canvasWidth = canvas.width = setWidth;
    _canvasHeight = canvas.height = setHeight;

    // Remove any lingering crop overlays
    const overlayCanvas = document.getElementById('canvas-overlay');
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  function setSizeAlert(showAlert){
    let classes = showAlert ? '__warning' : '__warning __hide';
    let alertText = document.getElementById('px-warning');
    alertText.textContent = `Image needs to be at least ${RENDERED_IMAGE_WIDTH}px by ${RENDERED_IMAGE_HEIGHT}px`;
    alertText.className = classes;
  }

  // Crop overlay canvas
  function drawOverlay(event){
    // The crop box size
    const cropSize = { width: PREVIEW_IMAGE_WIDTH, height: PREVIEW_IMAGE_HEIGHT };
    const cropHalf = { width: cropSize.width / 2, height: cropSize.height / 2 };

    const canvas = document.getElementById('canvas-overlay');
    canvas.width = _canvasWidth;
    canvas.height = _canvasHeight;

    // If no event was provided, create an initial overlay, centered
    if (!event){
      _previousX = _currentX = _canvasWidth / 2;
      _previousY = _currentY = _canvasHeight / 2;
    }else{
      _currentX = _previousX + (event.pageX - _initialPointerX);
      _currentY = _previousY + (event.pageY - _initialPointerY);

      // Accommodate touch events
      if (event.touches && event.touches.length > 0){
        _currentX = _previousX + (event.touches.item(0).pageX - _initialPointerX);
        _currentY = _previousY + (event.touches.item(0).pageY - _initialPointerY);
      }
    }

    // Keep overlay rect in the frame
    if (_currentX < cropHalf.width) _currentX = cropHalf.width;
    if (_currentX > _canvasWidth - cropHalf.width) _currentX = _canvasWidth - cropHalf.width;
    if (_currentY < cropHalf.height) _currentY = cropHalf.height;
    if (_currentY > _canvasHeight - cropHalf.height) _currentY = _canvasHeight - cropHalf.height;

    // Draw cropping frame
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(_currentX - cropHalf.width, _currentY - cropHalf.height, cropSize.width, cropSize.height);
    // Draw semi-transparent overlay outside the crop rect
    let landscape = _rawWidth >= _rawHeight;
    ctx.fillStyle = 'hsla(1, 1%, 1%, 0.4)';
    ctx.fillRect(0, 0, landscape ? _currentX - cropHalf.width : _canvasWidth, landscape ? _canvasHeight : _currentY - cropHalf.height);
    ctx.fillRect(landscape ? _currentX + cropHalf.width : 0, landscape ? 0 : _currentY + cropHalf.height, canvas.width, canvas.height);

    // Save original at full size resolution
    _overlayOriginX = (_currentX - cropHalf.width) * (RENDERED_IMAGE_WIDTH / PREVIEW_IMAGE_WIDTH);
    _overlayOriginY = (_currentY - cropHalf.height) * (RENDERED_IMAGE_HEIGHT / PREVIEW_IMAGE_HEIGHT);
  }

  function drawCroppedCanvas(){
    const croppedCanvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    croppedCanvas.width = RENDERED_IMAGE_WIDTH;
    croppedCanvas.height = RENDERED_IMAGE_HEIGHT;

    const imageForDraw = new Image();
    const blobForDraw = new Blob([_imageData], { type: _imageType });
    imageForDraw.src = window.URL.createObjectURL(blobForDraw);
    imageForDraw.onload = () => {

      const cropCtx = croppedCanvas.getContext('2d');
      cropCtx.drawImage(
        imageForDraw,
        _overlayOriginX * _resizeRatio,
        _overlayOriginY * _resizeRatio,
        RENDERED_IMAGE_WIDTH * _resizeRatio,
        RENDERED_IMAGE_HEIGHT * _resizeRatio,
        0,
        0,
        RENDERED_IMAGE_WIDTH,
        RENDERED_IMAGE_HEIGHT
      );
      // Convert Canvas -> Blob -> ArrayBuffer
      // toBlob() is NOT available in Safari / WebKit.  Polyfill courtesy of:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
      if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
          value: function (callback, type, quality) {

            var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
              len = binStr.length,
              arr = new Uint8Array(len);

            for (var i=0; i<len; i++ ) {
              arr[i] = binStr.charCodeAt(i);
            }

            callback( new Blob( [arr], {type: type || 'image/png'} ) );
          }
        });
      }

      croppedCanvas.toBlob( blob => {
        var fileReader = new FileReader();
        fileReader.onloadend = element => {
          _croppedImageData = element.target.result;
          // Revoke ObjectURLs after use
          window.URL.revokeObjectURL(imageForDraw.src);
        };
        fileReader.readAsArrayBuffer(blob);
      }, 'image/png');
    };
  }

  function getImageSize(arrayBuffer, imageType){

    let rawWidth = rawHeight = 0;

    const dataV = new DataView(arrayBuffer);

    if (imageType === 'image/png'){
      rawWidth = dataV.getUint32(16);
      rawHeight = dataV.getUint32(20);
      return { width: rawWidth, height: rawHeight };

    }else if (imageType === 'image/jpeg'){
      for(let x = 0; x < 40000; x++){
        if (dataV.getUint8(x) === 255){

          // APP1 Marker (EXIF)
          if (dataV.getUint8(x+1) === 225){
            // Check if EXIF header marker or APP1 Marker was false positive
            if (dataV.getUint32(x+4) !== 1165519206) continue;

            // 73 73: Intel byte align uses little endian
            // 77 77: Motorola byte align uses big endian
            let isIntelAlign = false;
            if (dataV.getUint8(x+10) === 73 && dataV.getUint8(x+11) === 73) isIntelAlign = true;

            // Offset to the first IFD
            const offsetToFirstIFD = dataV.getUint32(x+14, isIntelAlign)
            const entryCount = dataV.getUint16(x + 10 + offsetToFirstIFD, isIntelAlign);
            // Each entry is 12 bytes:
            //   2 bytes for tag number
            //   2 bytes for data type
            //   4 bytes for number of components
            //   4 bytes for data (or offset to data)
            for (let i = 0; i < entryCount; i++){
              let tagNum = dataV.getUint16(x + 10 + offsetToFirstIFD + 2 + (i * 12), isIntelAlign)
              // 274 is orientation
              // 112 is orientation

              // Found Image Width (however for some files this is thumbnail width)
              if (tagNum === 256){
                let actualWidth = dataV.getUint16(x + 10 + offsetToFirstIFD + 2 + (i * 12) + 8, isIntelAlign);
                if (!rawWidth) rawWidth = actualWidth;
              }

              // Found Image Height (however for some files this is thumbnail height)
              if (tagNum === 257){
                let actualHeight = dataV.getUint16(x + 10 + offsetToFirstIFD + 2 + (i * 12) + 8, isIntelAlign);
                if (!rawHeight) rawHeight = actualHeight;
              }

              // Found EXIF SubIFD
              if (tagNum === 34665){
                let subOffset = dataV.getUint16(x + 10 + offsetToFirstIFD + 2 + (i * 12) + (isIntelAlign ? 8 : 10), isIntelAlign);
                if (subOffset === 0) continue;
                let fullSubOffset = x+10+subOffset;
                let numOfSubs = dataV.getUint16(fullSubOffset, isIntelAlign);

                // Bitmask to exit the loop if width and height are found;
                let widthFlag = 1, heightFlag = 2, flags = 0;
                for (let n = 0; n < numOfSubs; n++){

                  let entryItem = dataV.getUint16(fullSubOffset + 2 + (n * 12), isIntelAlign);

                  if (entryItem === 40962){
                    rawWidth = dataV.getUint32(fullSubOffset + 2 + (n * 12) + 8, isIntelAlign);
                    if (flags & heightFlag) return {width: rawWidth, height: rawHeight};
                    flags |= widthFlag;
                  }

                  if (entryItem === 40963){
                    rawHeight = dataV.getUint32(fullSubOffset + 2 + (n * 12) + 8, isIntelAlign);
                    if (flags & widthFlag) return {width: rawWidth, height: rawHeight};
                    flags |= heightFlag;
                  }
                }
              }
            }
          }

          // Start-Of-Frame marker
          if (
            ((dataV.getUint8(x+1) >= 192) && (dataV.getUint8(x+1) <= 195)) ||
            ((dataV.getUint8(x+1) >= 197) && (dataV.getUint8(x+1) <= 199)) ||
            ((dataV.getUint8(x+1) >= 201) && (dataV.getUint8(x+1) <= 203)) ||
            ((dataV.getUint8(x+1) >= 205) && (dataV.getUint8(x+1) <= 207))
          ){
            if (!rawHeight) rawHeight = dataV.getUint16(x + 5);
            if (!rawWidth) rawWidth = dataV.getUint16(x + 7);
          }

          //Start-Of-Scan marker (stop looking for markers)
          if (dataV.getUint8(x+1) === 218) {
            break;
          }
        }
      }
      // Return dimensions if valid
      if (rawWidth && rawHeight) return { width: rawWidth, height: rawHeight };

    }else{
      // Unrecognized image type
      return null;
    }
  }

}(window))
