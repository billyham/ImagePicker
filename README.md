## A simple image picker with cropping.

A vanilla javascript implementation of a UI component for a user to select an
image from their file system for upload to a data store or rendering on a page.

![Image of HTML drop box](/demo_images/imagepicker3.png)

#### The Problem
In the process of designing a web app that includes an image upload function, I
needed to constrain the image dimensions to fit a predefined spec (in this case,
images need to be 440px by 440px). The user should be able to select an image, see the resulting composition based on the constrained aspect ratio, and make some adjustment to derive an preferred composition before submitting. On submission, the module should crop the image to the proportions the user specified and also resize it the predetermined size. With a selection that doesn't meet the size minimum, a warning should be displayed instead.

#### The Solution
HTML's fileReader object allows a user to select a file from their file system using the __input__ tab with type="file". But a more pleasing interaction will allow a user to drag and drop a file from their desktop. The module initially displays a drop zone, with a size and aspect ratio based on config settings in the JS file. The HTML5 Drag and drop API is used to access the user's dropped file.     

Canvas elements are implemented to both draw the chosen image on screen and to draw an overlay box on top of the image to demonstrate the final rendered image when the user taps the submit button. Image areas outside of the overlay are darkened to indicate the portion of the image that will be saved. The user can slide the overlay box either side to side or up and down to adjust the image cropping.

![Image of Medieval Man with Sword](/demo_images/imagepicker2.jpg)

The most sophisticated aspect of the module is a process that reads the raw binary data from a chosen to image to derive the image's pixel dimensions (currently limited to PNG and JPEG files). Whether the overlay moves up & down or side to side is determined by a function that evaluates the aspect ratio of the chose image to the aspect ratio of the final rendered image.

### Configuration

The values are in the "config" section define the final desired image size as
well as the size of the preview window displayed on the page. Change these to your
desired preferences.

```javascript
const RENDERED_IMAGE_WIDTH = 440;
const RENDERED_IMAGE_HEIGHT = 440;
const PREVIEW_IMAGE_WIDTH = 220;
```

The `submitRequest()` function should be rewritten to handle the final image data as needed. Currently it renders to the screen, presumably it should invoke an Ajax call to upload the image to a data store or some such thing.

---

The component is also available at [Codepen](http://codepen.io/billyham/pen/jVLaYP).

No additional libraries are required.
