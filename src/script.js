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
   * Imagepicker box to receive the drag and drop action.
   * In pixels
   */
  const PREVIEW_IMAGE_WIDTH = 220;

  /**
   * The aspect ratio for preview image follows the aspect ratio of the rendered
   * image. PREVIEW_IMAGE_HEIGHT will be equal to RENDERED_IMAGE_HEIGHT
   * multplied by the ratio: PREVIEW_IMAGE_WIDTH / RENDERED_IMAGE_WIDTH.
   * In pixels.
   */
  const PREVIEW_IMAGE_HEIGHT  = RENDERED_IMAGE_HEIGHT * PREVIEW_IMAGE_WIDTH / RENDERED_IMAGE_WIDTH;

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
  var _canvasWidth       = PREVIEW_IMAGE_WIDTH;
  var _canvasHeight      = PREVIEW_IMAGE_HEIGHT;

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

    document.getElementById('file-submit').className = '__hide';
    document.getElementById('file-clear').className = '__hide';
    document.getElementById('file-select').className = '';

    // Clear the value of the file input HTML element
    let filePath = document.getElementById('file-select-input');
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
   * @param  {Array} tryFiles
   */
  function onChange(tryFiles){
    _setSizeAlert();

    if (!tryFiles || tryFiles.length < 1) return;

    let file = tryFiles[0];

    document.getElementById('file-select').className = '__hide';
    document.getElementById('file-submit').className = '';
    document.getElementById('file-clear').className = '';

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

  /**
   * Present an error message when the picked image size fails to meet the
   * desired minimum size, based on config settings.
   *
   * @param {bool} showAlert  Arg is true to show the image, false to hide it.
   */
  function setSizeAlert(showAlert){
    let classes = showAlert ? '__warning' : '__warning __hide';
    let alertText = document.getElementById('px-warning');
    alertText.textContent = `Image needs to be at least ${RENDERED_IMAGE_WIDTH}px by ${RENDERED_IMAGE_HEIGHT}px`;
    alertText.className = classes;
  }

  /**
   * Draw a canvas overlay, showing the user a box over the picked image, with
   * an aspect ratio based on the desired final rendered image from the config
   * settings. Canvas overlay is updated with the movement of the user's mouse
   * or touch.
   * @param  {object} event Mouse or touch events inside the drop zone container.
   */
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


  /**
   * Render the final image, with cropping based on the user input from the
   * overlay selection. Save final image data to var _croppedImageData.
   */
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

  /**
   * Evaluates the pixel size of an image and returns an object. Currently works
   * for JPEG and PNG file types.
   *
   * @param  {arrayBuffer} arrayBuffer  Raw image data.
   * @param  {string} imageType         File type, expects "image/png" or "image/jpeg"
   *
   * @return {object}  An object with properties for pixel dimensions of the image:
   *                        width: {number}
   *                        height: {number}
   *                   Will return null if the evaluation fails.
   */
  function getImageSize(arrayBuffer, imageType){

    const MARKER_PREFIX           = 255;
    const EXIF_APP1_MARKER        = 225;
    const EXIF_APP1_CONFIRMATION  = 1165519206;
    const EXIF_SUB_IFD            = 34665;
    const START_OF_SCAN_MARKER    = 218;
    const INTEL_BYTE              = 73;
    const MOTOROLA_BYTE           = 77;

    const EXIF_IMAGE_WIDTH        = 256;
    const EXIF_IMAGE_HEIGHT       = 257;
    // EXIF_ORIENTATION = 274
    // EXIF_ORIENTATION = 112

    const EXIF_SUB_IFD_WIDTH      = 40962;
    const EXIF_SUB_IFD_HEIGHT     = 40963;

    let rawWidth = rawHeight = 0;

    const dataV = new DataView(arrayBuffer);

    function startOfFrame(tag) {
      if(
        (tag >= 192 && tag <= 195) ||
        (tag >= 197 && tag <= 199) ||
        (tag >= 201 && tag <= 203) ||
        (tag >= 205 && tag <= 207)
      ) return true;
    }

    function subIFD(startByte, offsetToFirstIFD, i, isIntelAlign){
      let IFDWidth = IFDHeight = 0;
      let subOffset = dataV.getUint16(startByte + 9 + offsetToFirstIFD + 2 + (i * 12) + (isIntelAlign ? 8 : 10), isIntelAlign);

      if (subOffset === 0) return false;
      let fullSubOffset = startByte + 9 + subOffset;
      let numOfSubs = dataV.getUint16(fullSubOffset, isIntelAlign);

      // Bitmask to exit the loop if width and height are found;
      let widthFlag = 1, heightFlag = 2, flags = 0;
      for (let n = 0; n < numOfSubs; n++){

        let entryItem = dataV.getUint16(fullSubOffset + 2 + (n * 12), isIntelAlign);

        if (entryItem === EXIF_SUB_IFD_WIDTH){
          IFDWidth = dataV.getUint32(fullSubOffset + 2 + (n * 12) + 8, isIntelAlign);
          if (flags & heightFlag) return {width: IFDWidth, height: IFDHeight};
          flags |= widthFlag;
        }

        if (entryItem === EXIF_SUB_IFD_HEIGHT){
          IFDHeight = dataV.getUint32(fullSubOffset + 2 + (n * 12) + 8, isIntelAlign);
          if (flags & widthFlag) return {width: IFDWidth, height: IFDHeight};
          flags |= heightFlag;
        }
      }
    }

    if (imageType === 'image/png'){
      rawWidth = dataV.getUint32(16);
      rawHeight = dataV.getUint32(20);
      return { width: rawWidth, height: rawHeight };

    }else if (imageType === 'image/jpeg'){
      // While(! start of scan marker){...  could be used in place of a for loop,
      // but the for loop will guard against a corrupt file that lacks a start
      // of scan marker.
      for(let x = 0; x < 40000; x++){
        if (dataV.getUint8(x) === MARKER_PREFIX){
          let byte = x + 1;

          // APP1 Marker (EXIF)
          if (dataV.getUint8(byte) === EXIF_APP1_MARKER){
            // Check if EXIF header marker or APP1 Marker was false positive
            if (dataV.getUint32(byte + 3) !== EXIF_APP1_CONFIRMATION) continue;

            // 73 73: Intel byte align uses little endian
            // 77 77: Motorola byte align uses big endian
            let isIntelAlign = false;
            if (dataV.getUint8(byte + 9) === INTEL_BYTE && dataV.getUint8(byte + 10) === INTEL_BYTE) isIntelAlign = true;

            // Offset to the first IFD
            const offsetToFirstIFD = dataV.getUint32(byte + 13, isIntelAlign)
            const entryCount = dataV.getUint16(byte + 9 + offsetToFirstIFD, isIntelAlign);
            // Each entry is 12 bytes:
            //   2 bytes for tag number
            //   2 bytes for data type
            //   4 bytes for number of components
            //   4 bytes for data (or offset to data)
            for (let i = 0; i < entryCount; i++){
              let tagNum = dataV.getUint16(byte + 9 + offsetToFirstIFD + 2 + (i * 12), isIntelAlign);

              // Found Image Width (however for some files this is thumbnail width)
              if (tagNum === EXIF_IMAGE_WIDTH){
                let actualWidth = dataV.getUint16(byte + 9 + offsetToFirstIFD + 2 + (i * 12) + 8, isIntelAlign);
                if (!rawWidth) rawWidth = actualWidth;
              }

              // Found Image Height (however for some files this is thumbnail height)
              if (tagNum === EXIF_IMAGE_HEIGHT){
                let actualHeight = dataV.getUint16(byte + 9 + offsetToFirstIFD + 2 + (i * 12) + 8, isIntelAlign);
                if (!rawHeight) rawHeight = actualHeight;
              }

              // EXIF SubIFD marker
              // EXIF SubIFD is authoritative. If height and width properties
              // exist here, they take precedence and can be trusted to be
              // definitive.
              if (tagNum === EXIF_SUB_IFD){
                const IFDResult = subIFD(byte, offsetToFirstIFD, i, isIntelAlign);
                if (!IFDResult) continue;
                if (!IFDResult.width || !IFDResult.height) return null;
                return IFDResult;
              }
            }
          }

          // Start-Of-Frame marker
          if (startOfFrame(dataV.getUint8(byte))){
            if (!rawHeight) rawHeight = dataV.getUint16(byte + 4);
            if (!rawWidth) rawWidth = dataV.getUint16(byte + 6);
          }

          // Start-Of-Scan marker, stop looking for markers
          if (dataV.getUint8(byte) === START_OF_SCAN_MARKER) {
            break;
          }
        }
      }
      // Return dimensions if valid
      if (rawWidth && rawHeight) return { width: rawWidth, height: rawHeight };

      // Failed to find dimensions
      return null;

    }else{
      // Unrecognized image type
      return null;
    }
  }

}(window))
