jsc64
=====

jsc64 is a Commodore 64 emulator written in JavaScript by Tim de Koning. It's a port of the FC64, the Commodore 64 emulator written in Actionscript by Darron Schall and Claus Wahlers. More information about the Actionscript version can be found here.

This emulator is meant as a 'proof of concept' and uses the HTML5 Canvas-element to render the Commodore 64 screen layout. This means it will work on all modern browsers, being the lastest version of Firefox, Google Chrome and Safari. Rendering on Internet Explorer should be possible with some minor fixes in the 'Renderer class', but I'm afraid performance will be appalling.

The canvas rendering nor the javascript engine isn't as efficient as the Flashplayer so please be patient ;-) or bring a big computer. Like the fc64-version, joystick controls are mapped to the numpad of your keyboard. The space bar can be used as the fire button. Comments are appreciated, please contact me via Twitter.

How do i use this?
------------------

Download the package from github and upload it into a folder on your web server
Include jQuery 1.12.4+, the classes (still need a nice auto-loading mechanism...) and the plug-in in your source like
<script type="text/javascript" src="js/jquery/jquery-1.12.4.min.js"></script>
<script type="text/javascript" src="js/jquery.jsc64classes.js"></script>
<script type="text/javascript" src="js/jquery.jsc64.js"></script>
            
Fix the configuration set up in jquery.jsc64classes.js. Make sure JSC64_BASEPATH is set to folder on your web server containing the plug-in files.
Use Jquery to target something as your c64 container, like
```
<script type="text/javascript">

$(document).ready(function() {
  var jsc64 = $('#container').jsc64();
});

</script>
```
            
Once booted, load a .prg file in your c64 with some javascript, like:
```
<script type="text/javascript">
  $('#container').loadPrg(pathToPrgFile)
</script>
```

This can also be done automatically after booting by adding some event listeners to the jsc64 instance. This option will be documented shortly.
Optionally scale your c64 using CSS. Just set a height and width to canvas elements in the c64 container, like
```
  #container canvas{ width: 806px; height: 568px; }
```
			
Jquery plug-in documentation
----------------------------

For ease of use, the C64 emulator can be loaded and used as a Jquery plug-in. The following options are available
```
$(selector).jsc64([event listener])
```

This will make a jsc64 of the selected block-level elements. If an event listener is passed as a parameter, this object will be used to listen to keystrokes. this may come in handy when working with more than one instance, and for example different inputs should control different jsc64 instances.
```
$(selector).loadPrg(pathToPrgFile);
```

this method can be called upon an instantiated jsc64 instance and will load the assigned rom into the jsc64 instance. Please keep the browsers cross-domain policy in mind.

Source
------

This program is free software, released under the terms of the GNU General Public License as published by the Free Software Foundation version 2
