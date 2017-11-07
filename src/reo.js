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

  //if(style.styleSheet)
  //  style.styleSheet.cssText = newStyle;
  //else
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
  if(clickedElem instanceof jQuery)
    _reoManualLoad(clickedElem);
  else
    _reoManualLoad($(clickedElem));
}

function reoLoadContent(triggeredElem, content)
{
  var elem = _getElementToLoad(triggeredElem);

  if($(triggeredElem).attr('data-reo-get-anim') == 'true')
  {
    var newContent = $(content).hide();

    if(elem.children().length == 0)
    {
      elem.append(newContent);
      newContent.fadeIn();
    }
    else
      elem.children().fadeOut(function() {
        elem.empty();
        elem.append(newContent);
        newContent.fadeIn()
      });
  }
  else
  {
    elem.empty()
    elem.append(content);    
  }
}

function reoAppendContent(appendElem, content)
{
  var elem = _getElementToLoad(appendElem);

  if($(appendElem).attr('data-reo-get-anim') == 'true')
  {
    var newContent = $(content).hide();

    elem.append(newContent);
    newContent.fadeIn();
  }
  else
    elem.append(content);
}

function reoPrependContent(prependElem, content)
{
  var elem = _getElementToLoad(prependElem);

  if($(prependElem).attr('data-reo-get-anim') == 'true')
  {
    var newContent = $(content).hide();

    elem.prepend(newContent);
    newContent.fadeIn();
  }
  else
    elem.prepend(content);
}

function reoLoaderShow(elem)
{
  var count = 0;
  
  if($(elem).is('[data-reo-loader-use-count]'))
    count = parseInt($(elem).attr('data-reo-loader-use-count'));

  if(count == 0)
    $(elem).css('visibility', 'visible');
  
  // Keep track of how many times loader is called
  $(elem).attr('data-reo-loader-use-count', count + 1)  
}

function reoLoaderHide(elem)
{
  var count;

  if(!$(elem).is('[data-reo-loader-use-count]'))
    return;

  count = parseInt($(elem).attr('data-reo-loader-use-count'));

  if(count == 0)
    return;
  
  // Hide loader only when no one else is using it
  if(count == 1)
    $(elem).css('visibility', 'hidden');
 
  $(elem).attr('data-reo-loader-use-count', count - 1);
}

// Checks whether custom load function is specified
function _customLoadFunc(triggeredElem, triggerSourceElems, response)
{
  if(typeof response  === 'undefined')
    response = null;

  if(triggerSourceElems != null)
  {
    if(triggeredElem.is('[data-reo-trigger-load-func]'))
      window[triggeredElem.attr('data-reo-trigger-load-func')](triggeredElem[0], response, triggerSourceElems);
    else if(triggeredElem.is('[data-reo-content-load-func]'))
      window[triggeredElem.attr('data-reo-content-load-func')](triggeredElem[0], response);
    else
      return false;

    return true;
  }        
  else if(triggeredElem.is('[data-reo-content-load-func]'))
  {
    window[triggeredElem.attr('data-reo-content-load-func')](triggeredElem[0], response);

    return true;
  }
  else
    return false;
}

function _addTriggerSourceElem(triggerSource, triggerSourceElems)
{
  if(triggerSourceElems.tr == null)
    triggerSourceElems.tr = [triggerSource[0]];
  else
    triggerSourceElems.tr.push(triggerSource[0]);
}

// This function sends the triggers.  It does NOT handle them
// triggerSource is the element initiating the trigger
// If the trigger is manual, then triggeredElem is the CSS selector for the element
// that will be triggered
function _reoTrigger(selector, triggerSource, triggerSourceElems)
{
  var count = 0;

  if(typeof triggerSource == 'string')
  {
    $(selector.format(triggerSource)).each(function() {
      $(this).trigger('reo-trigger', [triggerSourceElems]);
      count++;
    });
  }
  else
  {
    // Trigger could also be a function
    if(triggerSource.is('[data-reo-trigger-func]'))
    {
      var fn = window[triggerSource.attr('data-reo-trigger-func')];

      _addTriggerSourceElem(triggerSource, tr = {tr: triggerSourceElems});

      if(typeof fn === 'function')
        fn(tr.tr);
      else
        eval(triggerSource.attr('data-reo-trigger-func'));

      // Specifying data-reo-trigger-next allows you to continue with another trigger
      // Next trigger should be an actual div that is triggered, not a function. Otherwise,
      // you might as well combine the two function
      //if(triggerSourceElem.is('[data-reo-trigger-next]'))
      //  _tryTriggering($(triggerSourceElem.attr('data-reo-trigger-next')));

      return 1;
    }
    else
    {
      $(selector.format(triggerSource.attr('data-reo-trigger'))).each(function() {
        if(count == 0)
          _addTriggerSourceElem(triggerSource, tr = {tr: triggerSourceElems});

        $(this).trigger('reo-trigger', [tr.tr]);

        count++;
      });
    }
  }

  return count;
}

// Try triggering all possible ways you can specify the trigger
function _tryTriggering(triggeredElem, triggerSourceElems)
{
  if(_reoTrigger('[data-reo-trigger-listen="{0}"]', triggeredElem, triggerSourceElems) == 0)
    if(_reoTrigger('{0}', triggeredElem, triggerSourceElems) == 0)
      if(_reoTrigger('#{0}', triggeredElem, triggerSourceElems) == 0)
        _reoTrigger('[data-reo-name~={0}]', triggeredElem, triggerSourceElems);
}

// Get the data for associated for a URL, whether it's from a form or custom data
function _urlData(triggeredElem, triggerSourceElems)
{
  if(triggeredElem.is('[data-reo-url-data-func]'))
    return window[triggeredElem.attr('data-reo-url-data-func')](triggeredElem[0], triggerSourceElems);
  else if(triggeredElem.is('[data-reo-form-data]'))
    return $('#' + $(triggeredElem).attr('data-reo-form-data')).serializeArray();
  else if(triggeredElem.is('[data-reo-form]'))
    return $('#' + $(triggeredElem).attr('data-reo-form')).serializeArray();
  else
    return null;
}

function _doGetRequest(url, formData)
{
  if(formData == null)
    return $.get(url);
  else
    return $.get(url, formData);
}

function _getRequest(triggeredElem, triggerSourceElems)
{
  var request;

  _loaderShow(triggeredElem);

  if(triggeredElem.is('[data-reo-get-url-func]'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var url;
    var data;
    var alreadyTriggered = false;

    url = window[triggeredElem.attr('data-reo-get-url-func')](triggeredElem[0], triggerSourceElems);

    request = _doGetRequest(url, formData);
  }
  else if(triggeredElem.is('[data-reo-get-url]'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);

    request = _doGetRequest(triggeredElem.attr('data-reo-get-url'), formData);
  }
  //else if(triggeredElem.is('[data-reo-page-url]'))
  //  r//equest = $.get(triggeredElem.attr('data-reo-page-url'))
  else if(triggeredElem.is('[data-reo-submit]'))
  {
   $('#' + triggeredElem.attr('data-reo-submit')).submit();

    return;
  }
  else if(triggeredElem.is('[data-reo-post-url-func]'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var url;

    request = $.post(window[triggeredElem.attr('data-reo-post-url-func')](triggeredElem[0], triggerSourceElems), formData);
  }
  else if(triggeredElem.is('[data-reo-post-url]'))
  {
    var formData  = _urlData(triggeredElem, triggerSourceElems);

    request = $.post($(triggeredElem).attr('data-reo-post-url'), formData);
  }
  else if(triggeredElem.is('[data-reo-form]'))
  {
    var formData = _urlData(triggeredElem, triggerSourceElems);
    var actionUrl = $('#' + triggeredElem.attr('data-reo-form')).attr('action');

    request = $.post(actionUrl, formData);
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

  request = _getRequest(triggeredElem, triggerSourceElems);

  if(request == undefined)
    return;

  if(triggeredElem.is('[data-reo-trigger]') && triggeredElem.is('[data-reo-trigger-always]'))
    _tryTriggering(triggeredElem);

  request.done(function(response, status, xhr) {
    if(xhr.getResponseHeader('Reo-Redirect') != null)
    {
      location.href = xhr.getResponseHeader('Reo-Redirect')
      return;
    }

    var responseWrap = {'response': response};

      // status=204 is no content
    if(xhr.status != 204 && !_customLoadFunc(triggeredElem, triggerSourceElems, response))
    {
      _preLoadFunc(triggeredElem, responseWrap);

      var content = $(responseWrap['response']);
      var firstTag = content.first();
      var firstTagName = firstTag.prop('tagName');

      if(firstTagName == 'DATA-REO-OVERRIDE')
      {
        var override = JSON.parse(firstTag.html());

        if(override.loadTo != undefined)
          reoLoadContent(override.loadTo, content.slice(1));
        else if(override.appendTo != undefined)
          reoAppendContent(override.appendTo, content.slice(1));
        else if(override.prependTo != undefined)
          reoPrependContent(override.prependTo, content.slice(1));
      }
      else
      {
        if(triggeredElem.is('[data-reo-load-to]'))
          reoLoadContent(triggeredElem, content);
        else if(triggeredElem.is('[data-reo-append-to]'))
          reoAppendContent(triggeredElem, content);
        else if(triggeredElem.is('[data-reo-prepend-to]'))
          reoPrependContent(triggeredElem, content);
        else
          reoLoadContent(triggeredElem, content);

        if(triggeredElem.is('[data-reo-page-title]'))
          document.title = triggeredElem.attr('data-reo-page-title');

        if(triggeredElem.is('[data-reo-page-url]'))
        {
          var stateObj;

          if(triggeredElem.is('[data-reo-page-back-func]'))
            stateObj = {
              action: 'self',
              content: content,
              func: triggeredElem.attr('data-reo-page-back-func'),
              triggeredElem: triggeredElem,
            };
          else
            stateObj = {
              action: 'auto',
              content: content
            };

          _stateStack.push(stateObj);
          history.pushState(triggeredElem.attr('data-reo-page-title'), 'nothing', triggeredElem.attr('data-reo-page-url'));
        }
      }
    }

    if(xhr.getResponseHeader('Reo-Post-Load') != 'stop')
    {
      _postFunc(triggeredElem, responseWrap['response'], triggerSourceElems);
      _loaderHide(triggeredElem);
      _deleteElem(triggeredElem);
  
      if((triggeredElem.is('[data-reo-trigger]') || triggeredElem.is('[data-reo-trigger-func]')) && !triggeredElem.is('[data-reo-trigger-always]'))
        _tryTriggering(triggeredElem, triggerSourceElems);
    }
  });

  request.fail(function(response) {
    _loaderHide(triggeredElem);
    _reoErrorFunc(triggeredElem, response);
  });
}

// @triggeredElem is the element with all elements related to loading desired content, not the
// where the content is actually loaded
function _reoManualLoad(triggeredElem, triggerSourceElems)
{
  var loadedElem;

  if(typeof triggerSourceElems === 'undefined')
    triggerSourceElems = null;

  if(!_preFuncCheck(triggeredElem, triggerSourceElems))
    return;   

  loadedElem = _getElementToLoad(triggeredElem);

  // Call the custom load function if get/post url not specified
  if(!triggeredElem.is('[data-reo-get-url]')
    && !triggeredElem.is('[data-reo-post-url]')
    /* && !triggeredElem.is('[data-reo-page-url]')*/
    && !triggeredElem.is('[data-reo-delete]')
    && !triggeredElem.is('[data-reo-custom-delete-func]')
    && !triggeredElem.is('[data-reo-get-url-func]')
    && !triggeredElem.is('[data-reo-post-url-func]')
    && !triggeredElem.is('[data-reo-submit]')
    && !triggeredElem.is('[data-reo-form]'))
  {
    if(!_customLoadFunc(triggeredElem, triggerSourceElems))
      console.log('Nothing to do');
  }
  else if(triggeredElem.is('[data-reo-get-url]')
    || triggeredElem.is('[data-reo-post-url]')
    /* || triggeredElem.is('[data-reo-page-url]')*/
    || triggeredElem.is('[data-reo-get-url-func]')
    || triggeredElem.is('[data-reo-post-url-func]')
    || triggeredElem.is('[data-reo-submit]')
    || triggeredElem.is('[data-reo-form]'))
    _urlLoadFunc(triggeredElem, triggerSourceElems);
  else if(triggeredElem.is('[data-reo-delete]')
    || triggeredElem.is('[data-reo-custom-delete-func]'))
    _deleteElem(triggeredElem);
}

function _getElementToLoadByStr(str)
{
  if($(str).length != 0)
    return $(str);
  else if($('#' + str).length != 0)
    return $('#' + str);
  else
    return $('[data-reo-name~="{0}"]'.format(str))
}

// When loading an element, first check if the element with the id exists
// Otherwise, use data-reo-name
// triggeredElem is the element where the content is being loaded or the element that has
// data-reo-*-to
function _getElementToLoad(triggeredElem)
{
  if(triggeredElem instanceof jQuery)
  {
    //if(triggeredElem.is('[data-reo-page-url]'))
    //  return $('body');
    if(triggeredElem.is('[data-reo-load-to]'))
      return _getElementToLoadByStr(triggeredElem.attr('data-reo-load-to'));
    else if(triggeredElem.is('[data-reo-append-to]'))
      return _getElementToLoadByStr(triggeredElem.attr('data-reo-append-to'));
    else if(triggeredElem.is('[data-reo-prepend-to]'))
      return _getElementToLoadByStr(triggeredElem.attr('data-reo-prepend-to'));
    else
      return triggeredElem;
  }
  else if(typeof triggeredElem == 'string')
    return _getElementToLoadByStr(triggeredElem);
  else
    throw 'Invalid element';
}

function _preFuncCheck(element, triggerSourceElems)
{
  if(element.is('[data-reo-pre-func]'))
  {
    var fn = window[element.attr('data-reo-pre-func')];
    var ret = fn(element[0], triggerSourceElems);

    return (typeof(ret) == 'undefined' ? true : ret)
  }

  return true;
}

function _preLoadFunc(element, retData)
{
  if(element.is('[data-reo-pre-load-func]'))
  {
    var func = window[element.attr('data-reo-pre-load-func')];

    if(func != null)
      func(element[0], retData);
    else
      eval(element.attr('data-reo-pre-load-func'));
  }
}

function _postFunc(element, retData, triggerSourceElems)
{
  if(element.is('[data-reo-post-func]'))
  {
    var func = window[element.attr('data-reo-post-func')];

    if(func != null)
      func(element[0], retData, triggerSourceElems);
    else
      eval(element.attr('data-reo-post-func'));
  }
}

function _getLoaderElem(element)
{
  var name = element.attr('data-reo-loader-elem');

  try
  {
    return $('#' + element.attr('data-reo-loader-elem'));
  }
  catch(e)
  {
    return $(element.attr('data-reo-loader-elem'));
  }
}

function _loaderShow(triggeredElem)
{
  if(triggeredElem.is('[data-reo-loader-show-func]'))
  {
    var fn = window[triggeredElem.attr('data-reo-loader-show-func')];
    var jsStr = window[triggeredElem.attr('data-reo-loader-show-func')];

    if(fn)
      jsStr = triggeredElem.attr('data-reo-loader-show-func') + '(triggeredElem[0])';

    eval(jsStr);
  }
  else if(triggeredElem.is('[data-reo-loader-elem]'))
  {
    var elem = _getLoaderElem(triggeredElem);;

    reoLoaderShow(elem);
  }
}

function _loaderHide(triggeredElem)
{
  if(triggeredElem.is('[data-reo-loader-hide-func]'))
  {
    var fn = window[triggeredElem.attr('data-reo-loader-hide-func')];
    var jsStr = window[triggeredElem.attr('data-reo-loader-hide-func')];

    if(fn)
      jsStr = triggeredElem.attr('data-reo-loader-hide-func') + '(triggeredElem[0])';

    eval(jsStr);
  }
  else if(triggeredElem.is('[data-reo-loader-elem]'))
  {
    var elem = _getLoaderElem(triggeredElem);

    reoLoaderHide(elem);
  }
}

function _reoErrorFunc(elem, msg)
{
  if(elem.is('[data-reo-error-func]'))
  {
    var func = window[elem.attr('data-reo-error-func')];

    if(func)
      func(elem[0], msg);
    else
      alert('An error has occurred');
  }
  else
    console.log('An error has occurred: ' + msg);
}

function _deleteElem(triggeredElem)
{
  if(triggeredElem.is('[data-reo-custom-delete-func]'))
    window[triggeredElem.attr('data-reo-custom-delete-func')](triggeredElem[0]);
  else if(triggeredElem.is('[data-reo-delete]'))
  {
    var deleteElems = _getElementToLoadByStr(triggeredElem.attr('data-reo-delete'));

    if(triggeredElem.attr('data-reo-delete-anim') == 'true')
      deleteElems.fadeOut(function() {
        $(this).remove();
      });
    else
      deleteElems.remove();
  }
}

$(document).ready(function(){
  history.pushState(document.title, null, window.location.pathname);

  // Loads data from specified URL
  $(document.body).on('click', '[data-reo-event="click"]', function(event){
 
    //if($(event.target).attr('data-reo-prevent-default') != 'false')
    if($(event.target).prop('tagName') == 'A' &&
      (!$(event.target).is('[data-reo-prevent-default]') || $(event.target).attr('data-reo-prevent-default') == 'false'))
      event.preventDefault();
    else if($(event.target).attr('data-reo-prevent-default') == 'true')
      event.preventDefault();
 
    _reoManualLoad($(this));
  });

  $(document.body).on('keypress', '[data-reo-event="enter"]', function(event) {
    if(event.keyCode == 13)
      _reoManualLoad($(this));
  });

  // YM TO DO: improve this.  Scrolling does not work inside of dynamically loaded elements
  $('[data-reo-event="scroll"]').bind('scroll', function(){
    _reoManualLoad($(this));
  });

  $(document.body).on('reo-trigger', function(event, sourceElems){
    _reoManualLoad($(event.target), sourceElems);
  });
});

window.addEventListener('popstate', function(event) {
  if(_stateStack.length == 0)
    return;

  var lastState = _stateStack.pop();

  document.title = event.state;

  if(lastState.action == 'auto')
    lastState.content.remove();
  else if(lastState.action == 'self')
  {
    var fn = window[lastState.func];
    var jsStr = lastState.func;

    if(fn)
      jsStr = lastState.func + '(lastState.triggeredElem[0], lastState.content[0])';

    eval(jsStr);
  }
}, false);
