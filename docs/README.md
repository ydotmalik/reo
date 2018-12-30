# Setup

Include this in the ```head``` tag:
```
<script src='reo.min.js'></script>
```

# Retreiving content

```
<div
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'>
</div>
```

When the ```div``` is clicked, Reo will load the contents of ```loaded-content.html``` into the div.  For example if ```loaded-content.html``` contained
```<p>Reo framework test</p>```, the above ```div``` will contain:

```
<div
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'>

  <p>Reo framework test</p>

</div>
```

The request will be sent using Ajax.  The page is not reloaded.

```data-reo-event='click'``` notifies the Reo framework that clicking this element will load the content inside ```loaded-content.html``` inside
the ```div```.
All elements must have attribute ```data-reo-event``` in order for the framework to recognize it.  The element with ```data-reo-event``` is known
as the **triggered element**.

Other values of ```data-reo-event``` are:

* ```enter```: used when the enter key is pressed within the element.  This is a usually a text field
* ```scroll```: used when you scroll to the bottom or the of an element
* ```init```: used when you want to load content dynamically on page initialization.  For example, your base webpage could have static content along with content you want to load dynamically when the page first loads

A triggered element can also be the result of a software trigger (more on this later).

```data-reo-get-url``` can be any web resource, such as a Django view or static content.  For example, if you had the following view:

```
def my_view(request):
  return render(request, 'my_template.html', {'my_ctxt_var': 'using Reo'})
```

and template ```my_template.html``` as ```<p>I am {{ my_ctxt_var }}</p>``` and ```data-reo-get-url='{% url "my_view" %}'```, Reo will load the above ```div``` with
the response returned by the view.

If retreiving the content results in an error, such as if status code 404 is returned, Reo will not load any content.  You can add code
to handle the error (more on this below).

# Loading, appending, and prepending content anywhere

## data-reo-load-to

The content returned by ```data-reo-get-url``` can be loaded, appended, or prepended to any element.  For example:
```
<a
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'
  data-reo-load-to='elem-to-load'>Click me</a>

<div id='elem-to-load'></div>
```

The anchor tag is the triggerred element, and clicking it will load the content returned by ```loaded-content.html``` inside the above div.

```data-reo-load-to='<string>'``` refers to an element.  Reo resolves the element in the following order:
* it assumes ```string``` is an id and attempts to find the element based on the id.  You do not prepend '```#```'
* else it assumes ```string``` is a CSS selector
* else it assumes ```string``` is *contained* in an element with ```data-reo-name='<string>'```.  You could potenially have
  an element with ```data-reo-name='<string-a> <string-b>'```, therefore allowing it load content from different triggered elements.

## data-reo-append-to

This works similarly to ```data-reo-load-to``` except that it prepends the content returned by ```data-reo-get-url``` to the specified element.  For example:
```
<a data-reo-event='click' data-reo-get-url='appended-content.html' data-reo-append-to='elem-to-append'>Click me</a>

<div id='elem-to-append'>
  <p>Existing content</p>
</div>
```

If ```appended-content.html``` contained ```<p>Appended content</p>```, after clicking the anchor tag ```#elem-to-append``` will contain:
````
<div id='elem-to-append'>
  <p>Existing content</p>
  <p>Appended content</p>
</div>
````

## data-reo-prepend-to

This works similarly to ```data-reo-append-to``` except that it prepends the returned content.

# Animation

You can fade in the newly added content by setting ```data-reo-get-anim='true'``` in the triggered element.  For example:
```
<a
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'
  data-reo-load-to='elem-to-load'
  data-reo-get-anim='true'>Click me</a>

<div id='elem-to-load'></div>
```

The content in ```loaded-content.html``` will fade into the above div.

## Scrolling

Specify ```data-reo-append-to``` on the scrolled element.  In future, both ```data-reo-append-to``` (for scrolling to the bottom) and ```data-reo-prepend-to```
(for scrolling to the top) will be supported.

# Submitting form data

You can submit POST requests with Reo.  For example,
```
<a data-reo-event='click' data-reo-post-url='/my-form-handler/' data-reo-form='my-form' data-reo-load-to='returned-form-content'>Click me</a>

<div id='returned-form-content'>
  <p>Existing content</p>
</div>

<form id='my-form'>
  <input type='text' name='field1'/>
  <input type='text' name='field2'/>  
</form>
```

Clicking on the anchor tag will submit form ```#my-form``` to form handler ```/my-form-handler/```.  The response to the request will be
loaded in element ```#returned-form-content```.

```data-reo-form``` is the id of the form you want to submit, without ```#```.  ```data-reo-post-url``` is the URL of the form handler.
The POST request's response will be returned in the element specified by ```data-reo-load-to```.

You can use ```data-reo-append-to``` and ```data-reo-prepend-to``` with ```data-reo-post-url```, similar to ```data-reo-get-url```.

If you don't specify ```data-reo-post-url```, the framework will submit the form to the URL specified in the form's ```action``` attribute.

# Triggering a chain of events

A triggered element can also trigger a chain of events.  For example,
```
<div
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'
  data-reo-trigger='trigger-a'>
</div>

<div
  id='trigger-a'
  data-reo-event='click'
  data-reo-get-url='triggered-content.html'>
</div>
```

If a triggered element has the ```data-reo-trigger``` attribute, the element specified by ```data-reo-trigger``` is triggered as if it was
triggered through a click, enter, or scroll event.  Here after the content in ```loaded-content.html``` is loaded successfully, element
```#trigger-a``` is triggered.  Reo will attempt to load the
content in ```triggered-content.html``` into element ```trigger-a```.  In this example, the first ```div``` is known as the
**trigger source element**
and ```#trigger-a``` is known as the triggered element.
The element to trigger is resolved in the same fashion as what is used for ```data-reo-load-to```.

Triggering only happens if the content is retreived successfully from ```data-reo-get-url```.  To trigger the element always, set
```data-reo-trigger-always='true'``` in the trigger source element.

The trigger source element could also use ```data-reo-post-url```.

The triggered element can use the same attributes as any other elememt that was triggered by, for example, a click.  For example, the triggered
element could use ```data-reo-post-url``` and load the content elsewhere using ```data-reo-load-to```

Reo keeps track of the chain of trigger source elements (more on how this is used below).

# Handling errors

Reo prints an error message to the console if the response results in a error.  To do something different, set
```data-reo-error-func='<function name>'``` in the triggered element.  For example:
```
<a
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'
  data-reo-load-to='elem-to-load'
  data-reo-error-func='errorFunc'>Click me</a>

<script>
function errorFunc(sourceElem, response)
{...}
</script>
```

Where ```sourceElem``` is the triggered element DOM object (NOT Jquery element) and ```response``` is the returned errorred response.
If you don't pass a valid function to ```data-reo-error-func```, an ```alert()``` message will be displayed saying that an error occured.

# Loaders

You can display a loader while the response is being retreived.  Add ```data-reo-loader-elem=<loader_element>``` to the triggered element,
```loader_element``` is the element that contains the loader.  ```loader_element``` is a CSS selector.  Reo will display the loader before
the request is submitted and remove the loader
after the response has been received and loaded into the DOM.  For example:
```
<a
  data-reo-event='click'
  data-reo-load-to='elem-a'
  data-reo-loader-elem='#loader'>Click me</a>

<div id='elem-a'></div>

<div id='loader' style='visibility: hidden'>Loading</div>
```

Upon clicking the anchor tag, the loader element is displayed by Reo.  After the response is loaded into the DOM, the loader is hidden.

You are responsible for making sure the z-index of ```loader element``` is correct and that it was hidden before the first time it is displayed.

# Changing page title

You can change the page title when loading content:
```
<a
  data-reo-event='click'
  data-reo-get-url='your_endpoint'
  data-reo-load-to='your_div'
  data-reo-page-title='Your page title'>Click here</a>

```

After ```your_endpoint``` is loaded into ```#your_div```, the document's title will be updated to "Your page title".

# Changing page URL

You can change the page URL when loading content:
```
<a
  data-reo-event='click'
  data-reo-get-url='your_endpoint'
  data-reo-load-to='your_div'
  data-reo-page-url='new_div_page'>Click here</a>

```

After ```your_endpoint``` is loaded into ```#your_div```, the URL will be updated to ```new_div_page```.  When you click the back button or call
```window.history.back()```, the old URL will be restored.  Reo will also remove the content that was loaded into ```#your_div```.

If you use both ```data-reo-page-title``` and ```data-reo-page-url```, Reo will restore the old document title when you go back in history.

# Overriding default behavior

## Overriding where content is loaded

You may want
the server to override where the content is loaded.  For example, upon clicking a button, you may want to load content into a div.  However, if the
server may want the client to display a dialog in a different div if there's something wrong with the input.  Reo allows the server to specify
where the content should be loaded, therefore overriding any existing load directive on the client side.  To do so, add the following element to
the beginning of the response:
```
<data-reo-override>{
  "loadTo": "elemA",
  "appendTo": "elemB",
  "prependTo", "elemC"
  }
</data-reo-override>
```

Specify one of the keys above, not all three.

```loadTo```: will load content below ```data-reo-override``` into the element specified by ```elemA```.  ```elemA``` is resolved in the same fashion
as it is for ```data-reo-load-to```.

```appendTo```: will append the response to the specified element

```prependTo```: will prepend the response to the specified element

For example, suppose you had the following:
```
<a
  data-reo-event='click'
  data-reo-get-url='/some-conditional-content/'
  data-reo-load-to='div-a'>Click me</a>
  
<div id='div-a'></div>
<div id='div-b'></div>
```

And ```/some-conditional-content/``` returned the following:
```
<data-reo-override>{
  "loadTo": "div-b"
}
</data-reo-override>
...
```

The content after the ```data-reo-override``` tag will be loaded in element ```#div-b```, not ```#div-a```.


## Overriding response processing

Reo can use the values of HTTP headers to control how the response is processed.

```Reo-Redirect```: add this header to the response and set it to the URL you want to redirect to.  The browser is redirected to the specified URL, thus
overriding any further response processing.

```Reo-Post-Load```: add this header to control what to do after the response is loaded into the DOM.  Currently the only supported value is ```stop``` which 
indicates to Reo not do anything after the response is loaded.  This includes executing the ```data-reo-post-func``` function and hiding the loader.

Set status to 204: returning status 204 will indicate to Reo that nothing should be loaded.  If status is not 204 and you still send an empty response,
Reo will still load the response into the destination element, which will mean that element will contain nothing.

# Deleting an element after response

Add ```data-reo-delete=<element>``` to the triggered element delete ```element``` after the response is received.  ```element``` is resolved in the
  same fashion as what is used by ```data-reo-load-to```.

To fade out the deleted element, add ```data-reo-delete-anim='true'``` to the triggered element.

# Customizing behavior

Reo provides placeholders to specify functions to change the above behavior.  Note that Reo passes the DOM object to the function handler, not the
Jquery object.

## Pre function

After an element is triggered, either through a click or a trigger as a result of using ```data-reo-trigger```, you may need to do some checks before
attempting to send the request.  For example, you may want to do form validation before submitting a POST request.
To do so, add attribute ```data-reo-pre-func='<function name>'``` in the element that is
triggered. The function should return ```true``` if you want to send the request and false otherwise.  Reo will pass the following paramters to the
function, in this order:

1. ```element```: the triggered element
2. ```triggerSourceElements```: in the scenario where the element being triggered is a result of using ```data-reo-trigger```, this contains all the
trigger source elements that were in the trigger chain.  For example, suppose you had the following:

```
<div
  id='first-elem'
  data-reo-event='click'
  data-reo-get-url='loaded-content.html'
  data-reo-trigger='trigger-a'></div>

<div
  id='trigger-a'
  data-reo-event='click'
  data-reo-get-url='triggered-content.html'
  data-reo-trigger='trigger-b'></div>

<div
  id='trigger-b'
  data-reo-pre-func='preFunc'
  data-reo-event='click'
  data-reo-get-url='triggered-content-2.html'></div>

<script>
function preFunc(element, triggerSourceElements)
{
  ...
}
```

When the last element is triggered, ```preFunc``` is called before the request for ```triggered-content-2.html``` is sent.
```triggerSourceElements``` would contain ```['#first-elem', '#trigger-a']```.  The array contains DOM objects, not strings.  The request is not
sent if ```preFunc``` returns ```false```.

## Preload function

To post process the response before it is loaded by Reo, add the ```data-reo-pre-load-func='<function name>'``` attribute to the triggered element.
  The function takes these parameters in this order:
  1. ```element```: the triggered element
  2. ```responseDict```: a dictionary containing the response.  Key ```response``` contains the actual response string from the server.  You can
  change ```responstDict.response```, and Reo will load the changed value

## Post function

To do something after content is loaded by the framework, add the ```data-reo-post-load-func='<function name>'``` attribute to the triggered element.
  The following paramters are passed to the function:
  1. ```element```: the triggered element
  2. ```responseText```: the response string that was loaded
  3. ```triggerSourceElements```: all trigger source elements
  
Instead of specifying a function, you can also specify an expression, such as ```data-reo-post-load-func='$("#dialog").close()'```

## Specifying custom GET URL

To specify a function to return the GET URL that will be used for the response, add ```data-reo-get-url-func='<function name>'```.  The following
  parameters are passed to the function:
  1. ```element```: the triggered element
  3. ```triggerSourceElements```: all trigger source elements

For example:
```
<a
  data-reo-event='click'
  data-reo-get-url='getUrl'
  data-reo-load-to='elem-to-load'>Click me</a>

<div id='elem-to-load'></div>

<script>
function getUrl(element, triggerSourceElements)
{
  if($(element).attr('some-attr') == 'some_value')
    return '/some-url/';
  else
    return '/another-url/';
}
</script>
```

Reo will send the request to the returned value of function ```getUrl```. 

## Specifying custom POST URL

To specify a function to return the POST URL that will be used for the response, add ```data-reo-post-url-func='<function name>'``` to the
  triggered eleemnt.  The following parameters are passed to the function:
  1. ```element```: the triggered element
  3. ```triggerSourceElements```: all trigger source elements

## Loading content yourself

You can also load the response yourself instead of letting Reo load it.  Add ```data-reo-content-load-func='<function name>'```
  to the triggered element.  The following paramters are passed in this order:
  1. ```element```: element that was triggered
  2. ```responseText```: the response string that was loaded
  3. ```triggerSourceElements```: all trigger source elements

If in addition to ```data-reo-event``` you only specify ```data-reo-content-load-func```, Reo will call your function and do nothing else.

## Custom trigger function

Instead of triggering an element, you can call a function.  Add attribute ```data-reo-trigger-func='function name'``` to the trigger source element.
  Instead of triggering an element, Reo will instead call the function you specified instead of triggering any element.  The following parameter
  is passed to the function:
  1. ```triggerSourceElements```: all trigger source elements.  The current trigger source element will be the last element in the array.
  
You can also set ```data-reo-trigger-func``` to a JavaScript expression.

## Custom loader function

Instead of specifying the element that displays the loader in ```data-reo-loader-elem```, you can specify a function in
```data-reo-loader-show-func``` and ```data-reo-loader-hide-func```.  Both are called at the same point the loader would be displayed
or removed if you were to use ```data-reo-loader-elem```.

If you pass a function, Reo passes the triggered element at an argument.  You can also pass a JavaScript expression instead.

You can use both ```data-reo-loader-elem``` and a custom loader function.  For example:

```
<a
  data-reo-get-url='your_endpoint'
  data-reo-load-to='some-elem'
  data-reo-loader-elem='your-loader'
  data-reo-loader-hide-func='hideFunc'>Click here</a>
```

Before the content is loaded, element ```#loader``` is displayed.  After the content is retreived and displayed, function ```hideFunc```
is called.

## Custom page back function

When using ```data-reo-page-url```, Reo removes the loaded content when going back in history.  You can override this behavior
by specifying a function in ```data-reo-page-back-func```.  For example:

```
<a
  data-reo-event='click'
  data-reo-get-url='your_endpoint'
  data-reo-load-to='your_div'
  data-reo-page-url='new_div_page'
  data-reo-page-back-func='yourCustomFunc'>Click here</a>

<script>
function yourCustomFunc(triggeredElem, content)
{
...
}
</script>
```

After going back in history, instead of removing the loaded content, Reo will call ```yourCustomFunc``` with the triggered element and
the content that was returned by ```you_endpoint```.  The ```content``` parameter is a DOM object, not jQuery object.

You can also specify a JS expression for ```data-reo-page-back-func```.

# Miscellaneous

## data-reo-prevent-default

If you have ```data-reo-event``` attached to an anchor tag that has the ```href``` attribute, by default Reo does not jump to the link specified
in ```href```.  This is to prevent the case the scroll position from jumping to the top of the page when you click an anchor tag with
```href='#'```.  To take the default action, set ```data-reo-prevent-default='false'```.

## data-reo-reload

Set this to false on a triggered element to prevent the content loaded by the element from being fetched when the element is triggered again.  This is used when you want to fetch content that does not change after its been fetched and loaded into the DOM.
