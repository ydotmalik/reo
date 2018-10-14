(function () {
  if ( typeof window.CustomEvent === "function" ) return false; //If not IE

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// Following namespace contains minimum DOM manipulation functionality from jQuery needed by Reo
(function( reoJ, reoJJ, undefined ) {
  var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );
  var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;
  var rcheckableType = ( /^(?:checkbox|radio)$/i );
  var rscriptType = ( /^$|\/(?:java|ecma)script/i );
  var rscriptTypeMasked = /^true\/(.*)/;
  var noCloneChecked = true;
  var checkClone = false;
  var
    rCRLF = /\r?\n/g,
    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
    rsubmittable = /^(?:input|select|textarea|keygen)/i,
    rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

  // We have to close these tags to support XHTML (#13200)
  var wrapMap = {

    // Support: IE <=9 only
    option: [ 1, "<select multiple='multiple'>", "</select>" ],

    // XHTML parsers do not magically insert elements in the
    // same way that tag soup parsers do. So we cannot shorten
    // this by omitting <tbody> or other required elements.
    thead: [ 1, "<table>", "</table>" ],
    col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
    tr: [ 2, "<table><tbody>", "</tbody></table>" ],
    td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

    _default: [ 0, "", "" ]
  };

  ( function() {
    var fragment = document.createDocumentFragment(),
      div = fragment.appendChild( document.createElement( "div" ) ),
      input = document.createElement( "input" );

    // Support: Android 4.0 - 4.3 only
    // Check state lost if the name is set (#11217)
    // Support: Windows Web Apps (WWA)
    // `name` and `type` must use .setAttribute for WWA (#14901)
    input.setAttribute( "type", "radio" );
    input.setAttribute( "checked", "checked" );
    input.setAttribute( "name", "t" );

    div.appendChild( input );

    // Support: Android <=4.1 only
    // Older WebKit doesn't clone checked state correctly in fragments
    checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

    // Support: IE <=11 only
    // Make sure textarea (and checkbox) defaultValue is properly cloned
    div.innerHTML = "<textarea>x</textarea>";
    noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
  } )();

  // Support: IE <=9 only
  wrapMap.optgroup = wrapMap.option;

  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;

  function _manipulationTarget( elem, content ) {
    if ( _nodeName( elem, "table" ) &&
      _nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

      var tbody = elem.querySelector('tbody');
      return tbody || elem;
   }

    return elem;
  }

  function _toType(obj)
  {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }

  function _map(collection, callback)
  {
    if(Array.isArray(collection))
      return collection.map(callback);
    else
    {
      var arr = [];

      for(var i = 0; i < collection.length; i++)
        arr.push(callback(collection[i]))

      return arr;
    }
  }

  function _merge(first, second)
  {
    var len = +second.length, j = 0, i = first.length;

    for (; j < len; j++)
      first[ i++ ] = second[ j ];

    first.length = i;

    return first;
  }

  function _htmlPrefilter( html )
  {
    return html.replace( rxhtmlTag, "<$1></$2>" );
  }

  function _inArray( elem, arr, i )
  {
    return arr == null ? -1 : indexOf.call( arr, elem, i );
  }

  function _nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  };

  function _getAll( context, tag ) {

    // Support: IE <=9 - 11 only
    // Use typeof to avoid zero-argument method invocation on host objects (#15151)
    var ret;

    if ( typeof context.getElementsByTagName !== "undefined" ) {
      ret = context.getElementsByTagName( tag || "*" );

    } else if ( typeof context.querySelectorAll !== "undefined" ) {
      ret = context.querySelectorAll( tag || "*" );

    } else {
      ret = [];
    }

    if ( tag === undefined || tag && _nodeName( context, tag ) ) {
      return _merge( [ context ], ret );
    }

    return ret;
  }

  function _buildFragment( elems, context, selection, ignored ) {
    var elem, tmp, tag, wrap, contains, j,
      fragment = context.createDocumentFragment(),
      nodes = [],
      i = 0,
      l = elems.length;

    for ( ; i < l; i++ ) {
      elem = elems[ i ];

      if ( elem || elem === 0 )
      {
        tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

        // Deserialize a standard representation
        tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
        wrap = wrapMap[ tag ] || wrapMap._default;
        tmp.innerHTML = wrap[ 1 ] + _htmlPrefilter( elem ) + wrap[ 2 ];

        // Descend through wrappers to the right content
        j = wrap[ 0 ];
        while ( j-- ) {
          tmp = tmp.lastChild;
        }

        // Support: Android <=4.0 only, PhantomJS 1 only
        // push.apply(_, arraylike) throws on ancient WebKit
        _merge( nodes, tmp.childNodes );

        // Remember the top-level container
        tmp = fragment.firstChild;

        // Ensure the created nodes are orphaned (#12392)
        tmp.textContent = "";
      }
    }

    // Remove wrapper from fragment
    fragment.textContent = "";

    i = 0;
    while ( ( elem = nodes[ i++ ] ) ) {

      // Skip elements already in the context collection (trac-4087)
      if ( selection && _inArray( elem, selection ) > -1 ) {
        if ( ignored ) {
          ignored.push( elem );
        }
        continue;
      }

      contains = _contains( elem.ownerDocument, elem );

      // Append to fragment
      tmp = _getAll( fragment.appendChild( elem ), "script" );
    }

    return fragment;
  }

  /*function _parseHTML( data, context )
  {
    var base, parsed;

    if ( !context ) {

      // Stop scripts or inline event handlers from being executed immediately
      // by using document.implementation
      if ( support.createHTMLDocument ) {
        context = document.implementation.createHTMLDocument( "" );

        // Set the base href for the created document
        // so any parsed elements with URLs
        // are based on the document's URL (gh-2965)
        base = context.createElement( "base" );
        base.href = document.location.href;
        context.head.appendChild( base );
      } else {
        context = document;
      }
    }

    parsed = rsingleTag.exec( data );

    // Single tag
    if ( parsed ) {
      return [ context.createElement( parsed[ 1 ] ) ];
    }

    parsed = _buildFragment( [ data ], context );

    return _merge( [], parsed.childNodes );
  };

  function _toDom(str)
  {
    return _merge([], _parseHTML(str, document));  
  }*/

  function _contains( a, b ) {
    var adown = a.nodeType === 9 ? a.documentElement : a,
      bup = b && b.parentNode;

    return a === bup || !!( bup && bup.nodeType === 1 && (
      adown.contains ?
        adown.contains( bup ) :
        a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
    ));

  };

  // Fix IE bugs, see support tests
  function _fixInput( src, dest ) {
    var nodeName = dest.nodeName.toLowerCase();

    // Fails to persist the checked state of a cloned checkbox or radio button.
    if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
      dest.checked = src.checked;

    // Fails to return the selected option to the default selected state when cloning options
    } else if ( nodeName === "input" || nodeName === "textarea" ) {
      dest.defaultValue = src.defaultValue;
    }
  }

  function _isXMLDoc( elem ) {
    // documentElement is verified for cases where it doesn't yet exist
    // (such as loading iframes in IE - #4833)
    var documentElement = elem && (elem.ownerDocument || elem).documentElement;
    return documentElement ? documentElement.nodeName !== "HTML" : false;
  };

  function _clone( elem, dataAndEvents, deepDataAndEvents )
  {
    var i, l, srcElements, destElements,
      clone = elem.cloneNode( true ),
      inPage = _contains( elem.ownerDocument, elem );

    // Fix IE cloning issues
    if ( !noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
        !_isXMLDoc( elem ) ) {

      // We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
      destElements = _getAll( clone );
      srcElements = _getAll( elem );

      for ( i = 0, l = srcElements.length; i < l; i++ ) {
        _fixInput( srcElements[ i ], destElements[ i ] );
      }
    }

    // Return the cloned set
    return clone;
  }

  function _setObjOpacity(obj, opacity)
  {
    if(_toType(obj) == 'documentfragment')
      for(var i = 0; i < obj.childElementCount; i++)
        obj.children[i].style.opacity = 0;
    else
      obj.style.opacity = 0;
  }

  function _fadeIn(el)
  {
    el.style.opacity = 0;

    var last = +new Date();
    var tick = function() {
      el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
      last = +new Date();

      if (+el.style.opacity < 1)
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    };

    tick();
  }

  function _fadeInElemArray(obj)
  {
    for(var i = 0; i < obj.length; i++)
      _fadeIn(obj[i]);
  }

  function _getAllElems(elem, arr)
  {
    if(_toType(elem) == 'documentfragment')
    {
      for(var i = 0; i < elem.childNodes.length; i++)
        arr.push(elem.childNodes[i]);
    }
    else
      arr.push(elem);
  }

  reoJ.fadeOut = function(el, removeWhenDone)
  {
    el.style.opacity = 1;

    var last = +new Date();
    var tick = function() {
      el.style.opacity = +el.style.opacity - (new Date() - last) / 400;
      last = +new Date();

      if (+el.style.opacity > 0)
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
      else
        el.parentNode.removeChild(el);
    };

    tick();
  }

  reoJ.serializeArray = function(form)
  {
    return _merge([], _merge([], form['elements']).filter( function(elem) {
      var type = elem.type;

      // Use .is( ":disabled" ) so that fieldset[disabled] works
      return elem.name && !elem.disabled &&
        rsubmittable.test( elem.nodeName ) && !rsubmitterTypes.test( type ) &&
        ( elem.checked || !rcheckableType.test( type ) );
    } )
    .map( function( elem, i ) {
      var val = elem.value;

      if ( val == null ) {
        return null;
      }

      if ( Array.isArray( val ) ) {
        return _map( val, function( val ) {
          return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
        } );
      }

      return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
    } ));
  }
  
  reoJ.append = function(collection, content, fadeIn)
  {
    var arr = [];

    _domManip( collection, [content], function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = _manipulationTarget( this, elem );

        if(fadeIn)
          _setObjOpacity(elem, 0);

        _getAllElems(elem, arr);

        target.appendChild( elem );
      }
    } );

    if(fadeIn)
      _fadeInElemArray(arr);
    
    return arr;
  }

  reoJ.prepend = function(collection, content, fadeIn)
  {
    var arr = [];

    _domManip( collection, [content], function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = _manipulationTarget( this, elem );

        if(fadeIn)
          _setObjOpacity(elem, 0);

        _getAllElems(elem, arr);

        target.insertBefore( elem, target.firstChild );
      }
    } );

    if(fadeIn)
      _fadeInElemArray(arr);

    return arr;
  }

  function _disableScript( elem )
  {
    elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
    return elem;
  }

  function _restoreScript( elem ) {
    var match = rscriptTypeMasked.exec( elem.type );

    if ( match ) {
      elem.type = match[ 1 ];
    } else {
      elem.removeAttribute( "type" );
    }

    return elem;
  }

  function _DOMEval( code, doc ) {
    doc = doc || document;

    var script = doc.createElement( "script" );

    script.text = code;
    doc.head.appendChild( script ).parentNode.removeChild( script );
  }

  // collection is dom element
  function _domManip( collection, content, callback, ignored ) {

    var fragment, first, scripts, hasScripts, node, doc,
      i = 0,
      l = collection.length,
      iNoClone = l - 1;

    if ( l ) {
      fragment = _buildFragment( content, collection[ 0 ].ownerDocument, false, collection, ignored );
      first = fragment.firstChild;

      if ( fragment.childNodes.length === 1 ) {
        fragment = first;
      }

      // Require either new content or an interest in ignored elements to invoke the callback
      if ( first || ignored ) {
        scripts = _map(_getAll( fragment, "script" ), _disableScript);
        hasScripts = scripts.length;

        // Use the original fragment for the last item
        // instead of the first because it can end up
        // being emptied incorrectly in certain situations (#8070).
        for ( ; i < l; i++ ) {
          node = fragment;

          if ( i !== iNoClone ) {
            node = _clone( node, true, true );

            // Keep references to cloned scripts for later restoration
            if ( hasScripts ) {

              // Support: Android <=4.0 only, PhantomJS 1 only
              // push.apply(_, arraylike) throws on ancient WebKit
              _merge( scripts, _getAll( node, "script" ) );
            }
          }

          callback.call( collection[ i ], node);
        }

        if ( hasScripts ) {
          doc = scripts[ scripts.length - 1 ].ownerDocument;

          // Reenable scripts
          _map( scripts, _restoreScript );

          // Evaluate executable scripts on first document insertion
          for ( i = 0; i < hasScripts; i++ ) {
            node = scripts[ i ];
            if ( rscriptType.test( node.type || "" ) &&
              _contains( doc, node ) ) {

              if ( node.src ) {

                // Optional AJAX dependency, but won't run scripts if not present
                // YM: Do something about this
                /*if ( jQuery._evalUrl ) {
                  jQuery._evalUrl( node.src );
                }*/
              } else {
                _DOMEval( node.textContent.replace( rcleanScript, "" ), doc );
              }
            }
          }
        }
      }
    }

    return collection;
  }
}( window.reoJ = window.reoJ || {} ));

// First, check if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

// Contains information on how to restore state after going back in history
var _stateStack = [];

// CBL: Add the rules statically in CSS?
// Or just slice out the element when loading it?
function _addReoTagHide(tag)
{
  var style=document.createElement('style');
  style.type='text/css';

  newStyle = tag + ' { display: none;}';

  style.appendChild(document.createTextNode(newStyle));

  document.getElementsByTagName('head')[0].appendChild(style);
}

// These elements are for the framework and are not meant to be displayed
_addReoTagHide('data-reo-override');

function reoManualTrigger(trigger, triggerSourceElems)
{
  if(typeof triggerSourceElems === 'undefined')
    triggerSourceElems = null;

  _tryTriggering(trigger, triggerSourceElems);
}

function reoManualLoad(clickedElem)
{
  if(typeof clickedElem == 'string')
    _reoManualLoad(document.querySelector(clickedElem));
  else
    _reoManualLoad(clickedElem);
}

function reoLoadContent(triggeredElem, content, overideLoadElem)
{
  if(overideLoadElem != undefined)
    var elem = _getElementToLoadByStr(overideLoadElem);
  else
    var elem = _getElementToLoad(triggeredElem);

  for(var i = 0; i < elem.length; i++)
    elem[i].innerHTML = '';

  if(triggeredElem.getAttribute('data-reo-get-anim') == 'true')
    return reoJ.append(elem, content, true);
  else
    return reoJ.append(elem, content);  
}

function reoAppendContent(triggeredElem, content, overideLoadElem)
{
  if(overideLoadElem != undefined)
    var elem = _getElementToLoadByStr(overideLoadElem);
  else
    var elem = _getElementToLoad(triggeredElem);

  if(triggeredElem.getAttribute('data-reo-get-anim') == 'true')
    return reoJ.append(elem, content, true);
  else
    return reoJ.append(elem, content);
}

function reoPrependContent(triggeredElem, content, overideLoadElem)
{
  if(overideLoadElem != undefined)
    var elem = _getElementToLoadByStr(overideLoadElem);
  else
    var elem = _getElementToLoad(triggeredElem);

  if(triggeredElem.getAttribute('data-reo-get-anim') == 'true')
    return reoJ.prepend(elem, content, true);
  else
    return reoJ.prepend(elem, content);
}

function reoLoaderShow(elem)
{
  var count = 0;
  
  if(elem.hasAttribute('data-reo-loader-use-count'))
    count = parseInt(elem.getAttribute('data-reo-loader-use-count'));

  if(count == 0)
    elem.style.visibility = 'visible';
  
  // Keep track of how many times loader is called
  elem.setAttribute('data-reo-loader-use-count', count + 1);
}

function reoLoaderHide(elem)
{
  var count;

  if(!elem.hasAttribute('data-reo-loader-use-count'))
    return;

  count = parseInt(elem.getAttribute('data-reo-loader-use-count'));

  if(count == 0)
    return;
  
  // Hide loader only when no one else is using it
  if(count == 1)
    elem.style.visibility = 'hidden';

  elem.setAttribute('data-reo-loader-use-count', count - 1);
}

// Checks whether custom load function is specified
function _customLoadFunc(triggeredElem, triggerSourceElems, response)
{
  if(typeof response  === 'undefined')
    response = null;

  if(triggerSourceElems != null)
  {
    if(triggeredElem.hasAttribute('data-reo-trigger-load-func'))
      window[triggeredElem.getAttribute('data-reo-trigger-load-func')](triggeredElem, response, triggerSourceElems);
    else if(triggeredElem.hasAttribute('data-reo-content-load-func'))
      window[triggeredElem.getAttribute('data-reo-content-load-func')](triggeredElem, response);
    else
      return false;

    return true;
  }        
  else if(triggeredElem.hasAttribute('data-reo-content-load-func'))
  {
    window[triggeredElem.getAttribute('data-reo-content-load-func')](triggeredElem, response);

    return true;
  }
  else
    return false;
}

// Add triggerSource to end of triggerSourceElems
function _addTriggerSourceElem(triggerSource, triggerSourceElems)
{
  if(triggerSourceElems.tr == null)
    triggerSourceElems.tr = [triggerSource];
  else
    triggerSourceElems.tr.push(triggerSource);
}

function _sendReoTrigger(elem, triggerSourceElems)
{
  if(window.CustomEvent)
    var event = new CustomEvent('reo-trigger', {detail: {triggerSourceElems: triggerSourceElems}, bubbles: true});
  else
  {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('reo-trigger', true, true, {triggerSourceElems: triggerSourceElems});
  }

  elem.dispatchEvent(event);  
}

// This function sends the triggers.  It does NOT handle them
// triggerSource is the element initiating the trigger
// If the trigger is manual, then triggeredElem is the CSS selector for the element
// that will be triggered
function _reoTrigger(selector, triggerSource, triggerSourceElems, isId)
{
  var count = 0;

  if(typeof triggerSource == 'string')
  {
    if(isId == true)
    {
      var elems = [document.getElementById(triggerSource)];
      
      if(elems[0] == null)
        elems = [];
    }
    else
      var elems = document.querySelectorAll(selector.format(triggerSource));

    for(var i = 0; i < elems.length; i++)
    {
      _sendReoTrigger(elems[i], [triggerSourceElems]);
      count++;
    }
  }
  else
  {
    // Trigger could also be a function
    if(triggerSource.hasAttribute('data-reo-trigger-func'))
    {
      var fn = window[triggerSource.getAttribute('data-reo-trigger-func')];

      _addTriggerSourceElem(triggerSource, tr = {tr: triggerSourceElems});

      if(typeof fn === 'function')
        fn(tr.tr);
      else
        eval(triggerSource.getAttribute('data-reo-trigger-func'));

      return 1;
    }
    else
    {
      if(isId == true)
      {
        var elems = [document.getElementById(triggerSource.getAttribute('data-reo-trigger'))];

        if(elems[0] == null)
          elems = [];
      }
      else
        var elems = document.querySelectorAll(selector.format(triggerSource.getAttribute('data-reo-trigger')));

      for(var i = 0; i < elems.length; i++)
      {
        if(count == 0)
          _addTriggerSourceElem(triggerSource, tr = {tr: triggerSourceElems});

        _sendReoTrigger(elems[i], tr.tr);
        count++;
      }
    }
  }

  return count;
}

// Try triggering all possible ways you can specify the trigger
function _tryTriggering(triggeredElem, triggerSourceElems)
{
  if(_reoTrigger('[data-reo-trigger-listen="{0}"]', triggeredElem, triggerSourceElems) == 0)
    if(_reoTrigger('{0}', triggeredElem, triggerSourceElems, true) == 0)
      if(_reoTrigger('{0}', triggeredElem, triggerSourceElems) == 0)
        _reoTrigger('[data-reo-name~={0}]', triggeredElem, triggerSourceElems);
}

// Get the data for associated for a URL, whether it's from a form or custom data
function _urlData(triggeredElem, triggerSourceElems)
{
  if(triggeredElem.hasAttribute('data-reo-url-data-func'))
    return window[triggeredElem.getAttribute('data-reo-url-data-func')](triggeredElem, triggerSourceElems);
  else if(triggeredElem.hasAttribute('data-reo-form-data'))
  {
    // Why doesn't FormData work?
    //return new FormData(document.getElementById(triggeredElem.getAttribute('data-reo-form-data')));

    var arr = reoJ.serializeArray(document.getElementById(triggeredElem.getAttribute('data-reo-form-data')));

    return arr.map(function(item, index) {return item.name + '=' + encodeURIComponent(item.value)}).join('&');
  }
  else if(triggeredElem.hasAttribute('data-reo-form'))
  {
    //return new FormData(document.getElementById(triggeredElem.getAttribute('data-reo-form')));
    var arr = reoJ.serializeArray(document.getElementById(triggeredElem.getAttribute('data-reo-form')));

    return arr.map(function(item, index) {return item.name + '=' + encodeURIComponent(item.value)}).join('&');
  }
  else
    return null;
}

function _doGetRequest(url, formData, triggeredElem, triggerSourceElems)
{
  var request = new XMLHttpRequest();
  
  if(formData == null)
    request.open('GET', url, true);
  else
    request.open('GET', url + '?' + formData);

  request.setRequestHeader('HTTP_X_REQUESTED_WITH', 'XMLHttpRequest');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

  //request.onload = _onRequestSuccess(triggeredElem, triggerSourceElems, request);
  request.onerror = _onRequestFail(triggeredElem, triggerSourceElems, request);
  request.onloadend = _onLoadEnd(triggeredElem, triggerSourceElems, request);
  request.send();
  
  return request;
}

function _doPostRequest(url, formData, triggeredElem, triggerSourceElems)
{
  var request = new XMLHttpRequest();
  
  request.open('POST', url, true);
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  request.setRequestHeader('HTTP_X_REQUESTED_WITH', 'XMLHttpRequest');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  //request.onload = _onRequestSuccess(triggeredElem, triggerSourceElems, request);
  request.onerror = _onRequestFail(triggeredElem, triggerSourceElems, request);
  request.onloadend = _onLoadEnd(triggeredElem, triggerSourceElems, request);
  request.send(formData);

  return request;
}

/*function _onLoadEnd(triggeredElem, triggerSourceElems, xhr)
{
  return function() {
    if(xhr.status == 404)
      return _onRequestFail(triggeredElem, triggerSourceElems, xhr)();
    else
      return true;
  }
}*/

//function _onRequestSuccess(triggeredElem, triggerSourceElems, xhr)
function _onLoadEnd(triggeredElem, triggerSourceElems, xhr)
{
  return function() {
    if(xhr.status > 300)
      return _onRequestFail(triggeredElem, triggerSourceElems, xhr)();

    var response = xhr.responseText;
    
    if(xhr.getResponseHeader('Reo-Redirect') != null)
    {
      location.href = xhr.getResponseHeader('Reo-Redirect')
      return;
    }

    var responseWrap = {'response': response};

    // status=204 is no content
    if(xhr.status != 204 && !_customLoadFunc(triggeredElem, triggerSourceElems, response)) // This should be responseWrap
    {
      _preLoadFunc(triggeredElem, responseWrap);

      if(responseWrap['response'].indexOf('<data-reo-override>') == 0)
      {
        var end = responseWrap['response'].indexOf('</data-reo-override>');
        var jsonStr = responseWrap['response'].substring('<data-reo-override>'.length, end);
        var restOfContent = responseWrap['response'].substring(end + '</data-reo-override>'.length);
        var override = JSON.parse(jsonStr);
        var elems;

        if(override.loadTo != undefined)
          elems = reoLoadContent(triggeredElem, restOfContent, override.loadTo);
        else if(override.appendTo != undefined)
          elems = reoAppendContent(triggeredElem, restOfContent, override.appendTo);
        else if(override.prependTo != undefined)
          elems = reoPrependContent(triggeredElem, restOfContent, override.prependTo);
      }
      else
      {
        if(triggeredElem.hasAttribute('data-reo-load-to'))
          elems = reoLoadContent(triggeredElem, responseWrap['response']);
        else if(triggeredElem.hasAttribute('data-reo-append-to'))
          elems = reoAppendContent(triggeredElem, responseWrap['response']);
        else if(triggeredElem.hasAttribute('data-reo-prepend-to'))
          elems = reoPrependContent(triggeredElem, responseWrap['response']);
        else
          elems = reoLoadContent(triggeredElem, responseWrap['response']);

        if(triggeredElem.hasAttribute('data-reo-page-title'))
          document.title = triggeredElem.getAttribute('data-reo-page-title');

        if(triggeredElem.hasAttribute('data-reo-page-url'))
        {
          var stateObj;

          if(triggeredElem.hasAttribute('data-reo-page-back-func'))
            stateObj = {
              action: 'self',
              content: elems,
              func: triggeredElem.getAttribute('data-reo-page-back-func'),
              triggeredElem: triggeredElem,
            };
          else
            stateObj = {
              action: 'auto',
              content: elems,
            };

          _stateStack.push(stateObj);
          history.pushState(triggeredElem.getAttribute('data-reo-page-title'), 'nothing', triggeredElem.getAttribute('data-reo-page-url'));
        }
      }
    }

    if(xhr.getResponseHeader('Reo-Post-Load') != 'stop')
    {
      _postFunc(triggeredElem, responseWrap['response'], triggerSourceElems);
      _loaderHide(triggeredElem);
      _deleteElem(triggeredElem);

      if((triggeredElem.hasAttribute('data-reo-trigger') || triggeredElem.hasAttribute('data-reo-trigger-func')) && !triggeredElem.hasAttribute('data-reo-trigger-always'))
        _tryTriggering(triggeredElem, triggerSourceElems);
    }  
  }
}

function _onRequestFail(triggeredElem, triggerSourceElems, xhr)
{
  return function() {
    _loaderHide(triggeredElem);
    _reoError(triggeredElem, xhr.responseText);
  }
}

function _doRequest(triggeredElem, triggerSourceElems)
{
  var request;

  _loaderShow(triggeredElem);

  if(triggeredElem.hasAttribute('data-reo-get-url-func'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var url;
    var data;
    var alreadyTriggered = false;

    url = window[triggeredElem.getAttribute('data-reo-get-url-func')](triggeredElem, triggerSourceElems);

    request = _doGetRequest(url, formData, triggeredElem, triggerSourceElems);
  }
  else if(triggeredElem.hasAttribute('data-reo-get-url'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);

    request = _doGetRequest(triggeredElem.getAttribute('data-reo-get-url'), formData, triggeredElem, triggerSourceElems);
  }
  else if(triggeredElem.hasAttribute('data-reo-submit'))
  {
    document.getElementById(triggeredElem.getAttribute('data-reo-submit')).submit();

    return;
  }
  else if(triggeredElem.hasAttribute('data-reo-post-url-func'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var url;

    request = _doPostRequest(window[triggeredElem.getAttribute('data-reo-post-url-func')](triggeredElem, triggerSourceElems), formData, triggeredElem, triggerSourceElems);
  }
  else if(triggeredElem.hasAttribute('data-reo-post-url'))
  {
    var formData  = _urlData(triggeredElem, triggerSourceElems);

    request = _doPostRequest(triggeredElem.getAttribute('data-reo-post-url'), formData, triggeredElem, triggerSourceElems);
  }
  else if(triggeredElem.hasAttribute('data-reo-form'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var actionUrl = document.getElementById(triggeredElem.getAttribute('data-reo-form')).getAttribute('action');

    request = _doPostRequest(actionUrl, formData, triggeredElem, triggerSourceElems);
  }
  else
  {
    console.log('Nothing to do');
    return;
  }

  return request;
}

// For a click event, triggeredElem is the element you clicked on.  triggerSourceElems is null
// For a trigger event, triggeredElem is the element that was triggered, and triggerSourceElems
// is a stack of all elements that were in the trigger chain
function _urlLoadFunc(triggeredElem, triggerSourceElems)
{
  var request;

  request = _doRequest(triggeredElem, triggerSourceElems);

  if(request == undefined)
    return;

  if(triggeredElem.hasAttribute('data-reo-trigger') && triggeredElem.hasAttribute('data-reo-trigger-always'))
    _tryTriggering(triggeredElem);
}

// @triggeredElem is the element with all elements related to loading desired content, not the
// where the content is actually loaded
function _reoManualLoad(triggeredElem, triggerSourceElems)
{
  if(typeof triggerSourceElems === 'undefined')
    triggerSourceElems = null;

  if(!_preFuncCheck(triggeredElem, triggerSourceElems))
    return;   

  // Call the custom load function if get/post url not specified
  if(!triggeredElem.hasAttribute('data-reo-get-url')
    && !triggeredElem.hasAttribute('data-reo-post-url')
    && !triggeredElem.hasAttribute('data-reo-delete')
    && !triggeredElem.hasAttribute('data-reo-custom-delete-func')
    && !triggeredElem.hasAttribute('data-reo-get-url-func')
    && !triggeredElem.hasAttribute('data-reo-post-url-func')
    && !triggeredElem.hasAttribute('data-reo-submit')
    && !triggeredElem.hasAttribute('data-reo-form'))
  {
    if(!_customLoadFunc(triggeredElem, triggerSourceElems))
      console.log('Nothing to do');
  }
  else if(triggeredElem.hasAttribute('data-reo-get-url')
    || triggeredElem.hasAttribute('data-reo-post-url')
    || triggeredElem.hasAttribute('data-reo-get-url-func')
    || triggeredElem.hasAttribute('data-reo-post-url-func')
    || triggeredElem.hasAttribute('data-reo-submit')
    || triggeredElem.hasAttribute('data-reo-form'))
    _urlLoadFunc(triggeredElem, triggerSourceElems);
  else if(triggeredElem.hasAttribute('data-reo-delete')
    || triggeredElem.hasAttribute('data-reo-custom-delete-func'))
    _deleteElem(triggeredElem);
}

function _getElementToLoadByStr(str)
{
  if(document.getElementById(str) != null)
    return [document.getElementById(str)];
  else if(document.querySelectorAll(str).length != 0)
    return document.querySelectorAll(str);
  else
    return document.querySelectorAll('[data-reo-name~="{0}"]'.format(str));
}

// When loading an element, first check if the element with the id exists
// Otherwise, use data-reo-name
// triggeredElem is the element where the content is being loaded or the element that has
// data-reo-*-to
function _getElementToLoad(triggeredElem)
{
  if(typeof triggeredElem == 'string')
    return _getElementToLoadByStr(triggeredElem);
  else
  {
    //if(triggeredElem.hasAttribute('data-reo-page-url'))
    //  return $('body');
    if(triggeredElem.hasAttribute('data-reo-load-to'))
      return _getElementToLoadByStr(triggeredElem.getAttribute('data-reo-load-to'));
    else if(triggeredElem.hasAttribute('data-reo-append-to'))
      return _getElementToLoadByStr(triggeredElem.getAttribute('data-reo-append-to'));
    else if(triggeredElem.hasAttribute('data-reo-prepend-to'))
      return _getElementToLoadByStr(triggeredElem.getAttribute('data-reo-prepend-to'));
    else
      return [triggeredElem];
  }
}

function _preFuncCheck(element, triggerSourceElems)
{
  if(element.hasAttribute('data-reo-pre-func'))
  {
    var fn = window[element.getAttribute('data-reo-pre-func')];
    var ret = fn(element, triggerSourceElems);

    return (typeof(ret) == 'undefined' ? true : ret)
  }

  return true;
}

function _preLoadFunc(element, retData)
{
  if(element.hasAttribute('data-reo-pre-load-func'))
  {
    var func = window[element.getAttribute('data-reo-pre-load-func')];

    if(func != null)
      func(element[0], retData);
    else
      eval(element.getAttribute('data-reo-pre-load-func'));
  }
}

function _postFunc(element, retData, triggerSourceElems)
{
  if(element.hasAttribute('data-reo-post-func'))
  {
    var func = window[element.getAttribute('data-reo-post-func')];

    if(func != null)
      func(element, retData, triggerSourceElems);
    else
      eval(element.getAttribute('data-reo-post-func'));
  }
}

function _getLoaderElem(element)
{
  var name = element.getAttribute('data-reo-loader-elem');

  var loaderElem = document.getElementById(name);
  
  if(loaderElem != null)
    return loaderElem;
  else
    return document.querySelector(name);
}

function _loaderShow(triggeredElem)
{
  if(triggeredElem.hasAttribute('data-reo-loader-show-func'))
  {
    var fn = window[triggeredElem.getAttribute('data-reo-loader-show-func')];
    var jsStr = window[triggeredElem.getAttribute('data-reo-loader-show-func')];

    if(fn)
      jsStr = triggeredElem.getAttribute('data-reo-loader-show-func') + '(triggeredElem[0])';

    eval(jsStr);
  }
  else if(triggeredElem.hasAttribute('data-reo-loader-elem'))
  {
    var elem = _getLoaderElem(triggeredElem);;

    reoLoaderShow(elem);
  }
}

function _loaderHide(triggeredElem)
{
  if(triggeredElem.hasAttribute('data-reo-loader-hide-func'))
  {
    var fn = window[triggeredElem.getAttribute('data-reo-loader-hide-func')];
    var jsStr = window[triggeredElem.getAttribute('data-reo-loader-hide-func')];

    if(fn)
      jsStr = triggeredElem.getAttribute('data-reo-loader-hide-func') + '(triggeredElem[0])';

    eval(jsStr);
  }
  else if(triggeredElem.hasAttribute('data-reo-loader-elem'))
  {
    var elem = _getLoaderElem(triggeredElem);

    reoLoaderHide(elem);
  }
}

function _reoError(elem, errorContent)
{
  if(elem.hasAttribute('data-reo-error-func'))
  {
    var func = window[elem.getAttribute('data-reo-error-func')];

    if(func)
      func(elem, errorContent);
    else
      alert('An error has occurred');
  }
  else if(elem.hasAttribute('data-reo-error-load-to'))
  {
    var elem = _getElementToLoadByStr(elem.getAttribute('data-reo-error-load-to'));

    reoJ.append(elem, errorContent);
  }
  else
    console.log('An error has occurred: ' + errorContent);
}

function _deleteElem(triggeredElem)
{
  if(triggeredElem.hasAttribute('data-reo-custom-delete-func'))
    window[triggeredElem.getAttribute('data-reo-custom-delete-func')](triggeredElem);
  else if(triggeredElem.hasAttribute('data-reo-delete'))
  {
    var deleteElems = _getElementToLoadByStr(triggeredElem.getAttribute('data-reo-delete'));

    if(triggeredElem.getAttribute('data-reo-delete-anim') == 'true')
      for(var i = 0; i < deleteElems.length; i++)
        reoJ.fadeOut(deleteElems[i], true);
    else
      for(var i = 0; i < deleteElems.length; i++)
        deleteElems[i].parentNode.removeChild(deleteElems[i]);
  }
}

document.addEventListener("DOMContentLoaded", function(event) {
  history.pushState(document.title, null, window.location.href);

  document.body.addEventListener('click', function(event) {

    if(!(event.target && event.target.getAttribute('data-reo-event') == 'click'))
      return;

    if(event.target.tagName == 'A' &&
      (!event.target.hasAttribute('data-reo-prevent-default') || event.target.getAttribute('data-reo-prevent-default') == 'false'))
      event.preventDefault();
    else if(event.target.getAttribute('data-reo-prevent-default') == 'true')
      event.preventDefault();

    _reoManualLoad(event.target);
  });

  document.body.addEventListener('reo-trigger', function(event) {
    _reoManualLoad(event.target, event.detail.triggerSourceElems);    
  });
  
  document.body.addEventListener('keypress', function(event) {
    if(event.keyCode == 13)
      _reoManualLoad(event.target);
  });
  
  document.addEventListener('scroll', function(event) {
    if(event.target.scrollTop + event.target.clientHeight == event.target.scrollHeight ||
      event.target.scrollTop == 0)
      _reoManualLoad(event.target);
  }, true);
});

window.addEventListener('popstate', function(event) {
  if(_stateStack.length == 0)
    return;

  var lastState = _stateStack.pop();

  document.title = event.state;

  if(lastState.action == 'auto')
  {
    for(var i = 0; i < lastState.content.length; i++)
      lastState.content[i].parentNode.removeChild(lastState.content[i]);
  }
  else if(lastState.action == 'self')
  {
    var fn = window[lastState.func];
    var jsStr = lastState.func;

    if(fn)
      jsStr = lastState.func + '(lastState.triggeredElem, lastState.content)';

    eval(jsStr);
  }
}, false);
