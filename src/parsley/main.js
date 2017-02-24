import $ from 'jquery';
import Utils from './utils';
import Defaults from './defaults';
import Base from './base';
import ValidatorRegistry from './validator_registry';
import ParsleyUI from './ui';
import ParsleyForm from './form';
import Field from './field';
import ParsleyMultiple from './multiple';
import ParsleyFactory from './factory';

var vernums = $.fn.jquery.split('.');
if (parseInt(vernums[0]) <= 1 && parseInt(vernums[1]) < 8) {
  throw "The loaded version of jQuery is too old. Please upgrade to 1.8.x or better.";
}
if (!vernums.forEach) {
  Utils.warn('Parsley requires ES5 to run properly. Please include https://github.com/es-shims/es5-shim');
}
// Inherit `on`, `off` & `trigger` to Parsley:
var Parsley = $.extend(new Base(), {
    $element: $(document),
    actualizeOptions: null,
    _resetOptions: null,
    Factory: ParsleyFactory,
    version: '@@version'
  });

// Supplement Field and Form with Base
// This way, the constructors will have access to those methods
$.extend(Field.prototype, ParsleyUI.Field, Base.prototype);
$.extend(ParsleyForm.prototype, ParsleyUI.Form, Base.prototype);
// Inherit actualizeOptions and _resetOptions:
$.extend(ParsleyFactory.prototype, Base.prototype);

// ### jQuery API
// `$('.elem').parsley(options)` or `$('.elem').psly(options)`
$.fn.parsley = $.fn.psly = function (options) {
  if (this.length > 1) {
    var instances = [];

    this.each(function () {
      instances.push($(this).parsley(options));
    });

    return instances;
  }

  // Return undefined if applied to non existing DOM element
  if (!$(this).length) {
    Utils.warn('You must bind Parsley on an existing element.');

    return;
  }

  return new ParsleyFactory(this, options);
};

// ### Field and ParsleyForm extension
// Ensure the extension is now defined if it wasn't previously
if ('undefined' === typeof window.ParsleyExtend)
  window.ParsleyExtend = {};

// ### Parsley config
// Inherit from ParsleyDefault, and copy over any existing values
Parsley.options = $.extend(Utils.objectCreate(Defaults), window.ParsleyConfig);
window.ParsleyConfig = Parsley.options; // Old way of accessing global options

// ### Globals
window.Parsley = window.psly = Parsley;
window.ParsleyUtils = Utils;

// ### Define methods that forward to the registry, and deprecate all access except through window.Parsley
var registry = window.Parsley._validatorRegistry = new ValidatorRegistry(window.ParsleyConfig.validators, window.ParsleyConfig.i18n);
window.ParsleyValidator = {};
$.each('setLocale addCatalog addMessage addMessages getErrorMessage formatMessage addValidator updateValidator removeValidator'.split(' '), function (i, method) {
  window.Parsley[method] = $.proxy(registry, method);
  window.ParsleyValidator[method] = function () {
    Utils.warnOnce(`Accessing the method '${method}' through Validator is deprecated. Simply call 'window.Parsley.${method}(...)'`);
    return window.Parsley[method](...arguments);
  };
});

// ### ParsleyUI
// Deprecated global object
window.Parsley.UI = ParsleyUI;
window.ParsleyUI = {
  removeError: function (instance, name, doNotUpdateClass) {
    var updateClass = true !== doNotUpdateClass;
    Utils.warnOnce(`Accessing ParsleyUI is deprecated. Call 'removeError' on the instance directly. Please comment in issue 1073 as to your need to call this method.`);
    return instance.removeError(name, {updateClass});
  },
  getErrorsMessages: function (instance) {
    Utils.warnOnce(`Accessing ParsleyUI is deprecated. Call 'getErrorsMessages' on the instance directly.`);
    return instance.getErrorsMessages();
  }
};
$.each('addError updateError'.split(' '), function (i, method) {
  window.ParsleyUI[method] = function (instance, name, message, assert, doNotUpdateClass) {
    var updateClass = true !== doNotUpdateClass;
    Utils.warnOnce(`Accessing ParsleyUI is deprecated. Call '${method}' on the instance directly. Please comment in issue 1073 as to your need to call this method.`);
    return instance[method](name, {message, assert, updateClass});
  };
});

// ### PARSLEY auto-binding
// Prevent it by setting `ParsleyConfig.autoBind` to `false`
if (false !== window.ParsleyConfig.autoBind) {
  $(function () {
    // Works only on `data-parsley-validate`.
    if ($('[data-parsley-validate]').length)
      $('[data-parsley-validate]').parsley();
  });
}

export default Parsley;
