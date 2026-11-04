/* NUGET: BEGIN LICENSE TEXT
*
* Microsoft grants you the right to use these script files for the sole
* purpose of either: (i) interacting through your browser with the Microsoft
* website or online service, subject to the applicable licensing or use
* terms; or (ii) using the files as included with a Microsoft product subject
* to that product's license terms. Microsoft reserves all other rights to the
* files not expressly granted by Microsoft, whether by implication, estoppel
* or otherwise. Insofar as a script file is dual licensed under GPL,
* Microsoft neither took the code under GPL nor distributes it thereunder but
* under the terms set out in this paragraph. All notices and licenses
* below are for informational purposes only.
*
* NUGET: END LICENSE TEXT */
/*!
** Unobtrusive validation support library for jQuery and jQuery Validate
** Copyright (C) Microsoft Corporation. All rights reserved.
*/
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false */
/*global document: false, jQuery: false */
(function ($) {
var $jQval = $.validator,
adapters,
data_validation = "unobtrusiveValidation";
function setValidationValues(options, ruleName, value) {
options.rules[ruleName] = value;
if (options.message) {
options.messages[ruleName] = options.message;
}
}
function splitAndTrim(value) {
return value.replace(/^\s+|\s+$/g, "").split(/\s*,\s*/g);
}
function escapeAttributeValue(value) {
// As mentioned on http://api.jquery.com/category/selectors/
return value.replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, "\\$1");
}
function getModelPrefix(fieldName) {
return fieldName.substr(0, fieldName.lastIndexOf(".") + 1);
}
function appendModelPrefix(value, prefix) {
if (value.indexOf("*.") === 0) {
value = value.replace("*.", prefix);
}
return value;
}
function onError(error, inputElement) {  // 'this' is the form element
var container = $(this).find("[data-valmsg-for='" + escapeAttributeValue(inputElement[0].name) + "']"),
replaceAttrValue = container.attr("data-valmsg-replace"),
replace = replaceAttrValue ? $.parseJSON(replaceAttrValue) !== false : null;
container.removeClass("field-validation-valid").addClass("field-validation-error");
error.data("unobtrusiveContainer", container);
if (replace) {
container.empty();
error.removeClass("input-validation-error").appendTo(container);
}
else {
error.hide();
}
}
function onErrors(event, validator) {  // 'this' is the form element
var container = $(this).find("[data-valmsg-summary=true]"),
list = container.find("ul");
if (list && list.length && validator.errorList.length) {
list.empty();
container.addClass("validation-summary-errors").removeClass("validation-summary-valid");
$.each(validator.errorList, function () {
$("<li />").html(this.message).appendTo(list);
});
}
}
function onSuccess(error) {  // 'this' is the form element
var container = error.data("unobtrusiveContainer"),
replaceAttrValue = container.attr("data-valmsg-replace"),
replace = replaceAttrValue ? $.parseJSON(replaceAttrValue) : null;
if (container) {
container.addClass("field-validation-valid").removeClass("field-validation-error");
error.removeData("unobtrusiveContainer");
if (replace) {
container.empty();
}
}
}
function onReset(event) {  // 'this' is the form element
var $form = $(this);
$form.data("validator").resetForm();
$form.find(".validation-summary-errors")
.addClass("validation-summary-valid")
.removeClass("validation-summary-errors");
$form.find(".field-validation-error")
.addClass("field-validation-valid")
.removeClass("field-validation-error")
.removeData("unobtrusiveContainer")
.find(">*")  // If we were using valmsg-replace, get the underlying error
.removeData("unobtrusiveContainer");
}
function validationInfo(form) {
var $form = $(form),
result = $form.data(data_validation),
onResetProxy = $.proxy(onReset, form);
if (!result) {
result = {
options: {  // options structure passed to jQuery Validate's validate() method
errorClass: "input-validation-error",
errorElement: "span",
errorPlacement: $.proxy(onError, form),
invalidHandler: $.proxy(onErrors, form),
messages: {},
rules: {},
success: $.proxy(onSuccess, form)
},
attachValidation: function () {
$form
.unbind("reset." + data_validation, onResetProxy)
.bind("reset." + data_validation, onResetProxy)
.validate(this.options);
},
validate: function () {  // a validation function that is called by unobtrusive Ajax
$form.validate();
return $form.valid();
}
};
$form.data(data_validation, result);
}
return result;
}
$jQval.unobtrusive = {
adapters: [],
parseElement: function (element, skipAttach) {
/// <summary>
/// Parses a single HTML element for unobtrusive validation attributes.
/// </summary>
/// <param name="element" domElement="true">The HTML element to be parsed.</param>
/// <param name="skipAttach" type="Boolean">[Optional] true to skip attaching the
/// validation to the form. If parsing just this single element, you should specify true.
/// If parsing several elements, you should specify false, and manually attach the validation
/// to the form when you are finished. The default is false.</param>
var $element = $(element),
form = $element.parents("form")[0],
valInfo, rules, messages;
if (!form) {  // Cannot do client-side validation without a form
return;
}
valInfo = validationInfo(form);
valInfo.options.rules[element.name] = rules = {};
valInfo.options.messages[element.name] = messages = {};
$.each(this.adapters, function () {
var prefix = "data-val-" + this.name,
message = $element.attr(prefix),
paramValues = {};
if (message !== undefined) {  // Compare against undefined, because an empty message is legal (and falsy)
prefix += "-";
$.each(this.params, function () {
paramValues[this] = $element.attr(prefix + this);
});
this.adapt({
element: element,
form: form,
message: message,
params: paramValues,
rules: rules,
messages: messages
});
}
});
$.extend(rules, { "__dummy__": true });
if (!skipAttach) {
valInfo.attachValidation();
}
},
parse: function (selector) {
/// <summary>
/// Parses all the HTML elements in the specified selector. It looks for input elements decorated
/// with the [data-val=true] attribute value and enables validation according to the data-val-*
/// attribute values.
/// </summary>
/// <param name="selector" type="String">Any valid jQuery selector.</param>
var $forms = $(selector)
.parents("form")
.andSelf()
.add($(selector).find("form"))
.filter("form");
// :input is a psuedoselector provided by jQuery which selects input and input-like elements
// combining :input with other selectors significantly decreases performance.
$(selector).find(":input").filter("[data-val=true]").each(function () {
$jQval.unobtrusive.parseElement(this, true);
});
$forms.each(function () {
var info = validationInfo(this);
if (info) {
info.attachValidation();
}
});
}
};
adapters = $jQval.unobtrusive.adapters;
adapters.add = function (adapterName, params, fn) {
/// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation.</summary>
/// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
/// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
/// <param name="params" type="Array" optional="true">[Optional] An array of parameter names (strings) that will
/// be extracted from the data-val-nnnn-mmmm HTML attributes (where nnnn is the adapter name, and
/// mmmm is the parameter name).</param>
/// <param name="fn" type="Function">The function to call, which adapts the values from the HTML
/// attributes into jQuery Validate rules and/or messages.</param>
/// <returns type="jQuery.validator.unobtrusive.adapters" />
if (!fn) {  // Called with no params, just a function
fn = params;
params = [];
}
this.push({ name: adapterName, params: params, adapt: fn });
return this;
};
adapters.addBool = function (adapterName, ruleName) {
/// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
/// the jQuery Validate validation rule has no parameter values.</summary>
/// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
/// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
/// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
/// of adapterName will be used instead.</param>
/// <returns type="jQuery.validator.unobtrusive.adapters" />
return this.add(adapterName, function (options) {
setValidationValues(options, ruleName || adapterName, true);
});
};
adapters.addMinMax = function (adapterName, minRuleName, maxRuleName, minMaxRuleName, minAttribute, maxAttribute) {
/// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
/// the jQuery Validate validation has three potential rules (one for min-only, one for max-only, and
/// one for min-and-max). The HTML parameters are expected to be named -min and -max.</summary>
/// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
/// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
/// <param name="minRuleName" type="String">The name of the jQuery Validate rule to be used when you only
/// have a minimum value.</param>
/// <param name="maxRuleName" type="String">The name of the jQuery Validate rule to be used when you only
/// have a maximum value.</param>
/// <param name="minMaxRuleName" type="String">The name of the jQuery Validate rule to be used when you
/// have both a minimum and maximum value.</param>
/// <param name="minAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
/// contains the minimum value. The default is "min".</param>
/// <param name="maxAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
/// contains the maximum value. The default is "max".</param>
/// <returns type="jQuery.validator.unobtrusive.adapters" />
return this.add(adapterName, [minAttribute || "min", maxAttribute || "max"], function (options) {
var min = options.params.min,
max = options.params.max;
if (min && max) {
setValidationValues(options, minMaxRuleName, [min, max]);
}
else if (min) {
setValidationValues(options, minRuleName, min);
}
else if (max) {
setValidationValues(options, maxRuleName, max);
}
});
};
adapters.addSingleVal = function (adapterName, attribute, ruleName) {
/// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
/// the jQuery Validate validation rule has a single value.</summary>
/// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
/// in the data-val-nnnn HTML attribute(where nnnn is the adapter name).</param>
/// <param name="attribute" type="String">[Optional] The name of the HTML attribute that contains the value.
/// The default is "val".</param>
/// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
/// of adapterName will be used instead.</param>
/// <returns type="jQuery.validator.unobtrusive.adapters" />
return this.add(adapterName, [attribute || "val"], function (options) {
setValidationValues(options, ruleName || adapterName, options.params[attribute]);
});
};
$jQval.addMethod("__dummy__", function (value, element, params) {
return true;
});
$jQval.addMethod("regex", function (value, element, params) {
var match;
if (this.optional(element)) {
return true;
}
match = new RegExp(params).exec(value);
return (match && (match.index === 0) && (match[0].length === value.length));
});
$jQval.addMethod("nonalphamin", function (value, element, nonalphamin) {
var match;
if (nonalphamin) {
match = value.match(/\W/g);
match = match && match.length >= nonalphamin;
}
return match;
});
if ($jQval.methods.extension) {
adapters.addSingleVal("accept", "mimtype");
adapters.addSingleVal("extension", "extension");
} else {
// for backward compatibility, when the 'extension' validation method does not exist, such as with versions
// of JQuery Validation plugin prior to 1.10, we should use the 'accept' method for
// validating the extension, and ignore mime-type validations as they are not supported.
adapters.addSingleVal("extension", "extension", "accept");
}
adapters.addSingleVal("regex", "pattern");
adapters.addBool("creditcard").addBool("date").addBool("digits").addBool("email").addBool("number").addBool("url");
adapters.addMinMax("length", "minlength", "maxlength", "rangelength").addMinMax("range", "min", "max", "range");
adapters.add("equalto", ["other"], function (options) {
var prefix = getModelPrefix(options.element.name),
other = options.params.other,
fullOtherName = appendModelPrefix(other, prefix),
element = $(options.form).find(":input").filter("[name='" + escapeAttributeValue(fullOtherName) + "']")[0];
setValidationValues(options, "equalTo", element);
});
adapters.add("required", function (options) {
// jQuery Validate equates "required" with "mandatory" for checkbox elements
if (options.element.tagName.toUpperCase() !== "INPUT" || options.element.type.toUpperCase() !== "CHECKBOX") {
setValidationValues(options, "required", true);
}
});
adapters.add("remote", ["url", "type", "additionalfields"], function (options) {
var value = {
url: options.params.url,
type: options.params.type || "GET",
data: {}
},
prefix = getModelPrefix(options.element.name);
$.each(splitAndTrim(options.params.additionalfields || options.element.name), function (i, fieldName) {
var paramName = appendModelPrefix(fieldName, prefix);
value.data[paramName] = function () {
return $(options.form).find(":input").filter("[name='" + escapeAttributeValue(paramName) + "']").val();
};
});
setValidationValues(options, "remote", value);
});
adapters.add("password", ["min", "nonalphamin", "regex"], function (options) {
if (options.params.min) {
setValidationValues(options, "minlength", options.params.min);
}
if (options.params.nonalphamin) {
setValidationValues(options, "nonalphamin", options.params.nonalphamin);
}
if (options.params.regex) {
setValidationValues(options, "regex", options.params.regex);
}
});
$(function () {
$jQval.unobtrusive.parse(document);
});
}(jQuery));

// SIG // Begin signature block
// SIG // MIInWwYJKoZIhvcNAQcCoIInTDCCJ0gCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // uN+x7CLKtUQrxuaCz7jFZvt+a6IMdI7wV86RPq+66E6g
// SIG // ggzPMIIGCjCCA/KgAwIBAgITMwAAAf7+iki1zsRg8QAA
// SIG // AAAB/jANBgkqhkiG9w0BAQsFADBXMQswCQYDVQQGEwJV
// SIG // UzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDI0MB4XDTI2MDQxNjE4NTg1MloXDTI3MDQx
// SIG // NTE4NTg1MlowgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAw
// SIG // BgNVBAMTKU1pY3Jvc29mdCAzcmQgUGFydHkgQXBwbGlj
// SIG // YXRpb24gQ29tcG9uZW50MIIBIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAQ8AMIIBCgKCAQEAv1RjgRSjfl8SE93CFRZLi4N7
// SIG // hmn0IkvQqsfJc1+80zFVHlZnA2HGF7IpvPeqinp4SBpe
// SIG // dfM69fqNJ+id+q8ZhHP6OsW2//iI3bQED00ekouNByvJ
// SIG // H2QcqJATkcgsxjOPVYj4SOqcfR16iGU3KMpNZvydzu/Z
// SIG // eOxbpZnfl0mcLmeqDdjexv5f0w8dieu9Jh26TIL1zv7o
// SIG // Sd0St8Y1eZFQCZeIce5m6jGgRdho0LoIHtdLfR3a9giZ
// SIG // KYzuHiLmOh3W6uu7kwf24wiRsdRtU0yp2QsjaWGgrdpX
// SIG // VRMwyzaKvi4OMNJENmSFzOCZcGMBQHen5QRXas4T2mx3
// SIG // EmZEByYdYQIDAQABo4IBmzCCAZcwDgYDVR0PAQH/BAQD
// SIG // AgeAMB8GA1UdJQQYMBYGCisGAQQBgjdMEQEGCCsGAQUF
// SIG // BwMDMB0GA1UdDgQWBBQmGTbv1kPrIUXGSzs97yJZtFaq
// SIG // FTBFBgNVHREEPjA8pDowODEeMBwGA1UECxMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMRYwFAYDVQQFEw0yMzE1MjIr
// SIG // NTA3NTMxMB8GA1UdIwQYMBaAFH9ZP1Qh2q1P7wXl5qPX
// SIG // LQaUEggxMGAGA1UdHwRZMFcwVaBToFGGT2h0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jv
// SIG // c29mdCUyMENvZGUlMjBTaWduaW5nJTIwUENBJTIwMjAy
// SIG // NC5jcmwwbQYIKwYBBQUHAQEEYTBfMF0GCCsGAQUFBzAC
// SIG // hlFodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NlcnRzL01pY3Jvc29mdCUyMENvZGUlMjBTaWduaW5n
// SIG // JTIwUENBJTIwMjAyNC5jcnQwDAYDVR0TAQH/BAIwADAN
// SIG // BgkqhkiG9w0BAQsFAAOCAgEAHOf/iJrPCpgPWpNTX6BF
// SIG // WYi9rR5/fn97/d+ZHac+/R/2bPc++JzQ4EfFVt6bM0Zb
// SIG // 4EphOAzJQI9B+yltQST/qG0oVMpAUIs8vJgBRbimu/r0
// SIG // OMhZZbRkWfYsKK31vac0B3PSRhkj/0pN/8gApEuATBsp
// SIG // NT6VPZB0SfQ4rg/U/sohdvtoRIYqrP1P+kBwWeQUthaM
// SIG // oOVl5nI8upWghZZMeCj6kx4OeXAPp6zzYlK5mEnoCW4J
// SIG // awcxoaqhFhtJTVaEWWDK5vkjGeBbNbvwkK4e3/16gGW+
// SIG // 8WklZtzg10KPhqX0jRV0bG4IiItEPUqUQyRj2aN2EACH
// SIG // FJeJBstrSc5BSp9vnmRcvdnrnnwGf2NSPiR1193Lx/0W
// SIG // LhlJkscqM7Qv2Dsu6feXS5xLLIPRUEKPCA0Y5xJq1+f7
// SIG // JXB1WxQxAxVKZq6tT1X28pe99xIGiyQYtiP1PSy0TqMJ
// SIG // ePWicHUEIYtWn9KifSvZKA/LrlKCqiG2Yg5zSeZ+Ezvi
// SIG // Q3bLHQy43Mog2KtfArR4R+ZertkNoDe7w9LNUjwPvV2H
// SIG // kYFY4FjXNFZBLLaDdECMu79XQVoC5ANGzb7VnTM1plM5
// SIG // rN1+suCJ8ygMo7rUa1/Vi2zRlYuyfZB7WnAZUknCAUI1
// SIG // kFEJexnmZXQYBV+dokvoirtl6k4/Uu5NDOuryxqYFZFc
// SIG // Nyswgga9MIIEpaADAgECAhMzAAAAOTu2Nxm/Bh1nAAAA
// SIG // AAA5MA0GCSqGSIb3DQEBDAUAMIGIMQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9vdCBD
// SIG // ZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMTAeFw0yNDA4
// SIG // MDgyMDU0MThaFw0zNjAzMjIyMjEzMDRaMFcxCzAJBgNV
// SIG // BAYTAlVTMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNp
// SIG // Z25pbmcgUENBIDIwMjQwggIiMA0GCSqGSIb3DQEBAQUA
// SIG // A4ICDwAwggIKAoICAQDYAZwe4zjHqpUWBzWtuub+CGPX
// SIG // x/EyoXph3zyDXtYKS2ld3YYN9uFsB9Oi3B26Z7AbpAgz
// SIG // Yra8qNHbUvxFuiP8hC/2y0mPISqW30LlrrAT6/ams2HA
// SIG // 8Qlv6p42+SbCNbPGzToN21QE70FS+LXH9N2k8nLM/EHg
// SIG // nTNJf8h0TmyfUKmszNa+lTxDieyy/rhBG+98OkArobPP
// SIG // Wtbr9c3qzmDJ7J3kUcAm6cltdSHIIFNHESgw6taY1Scy
// SIG // GyBevqIl120XjrIHiPM7tRckHytH1ZGsmvEplR0P7Tn9
// SIG // t5meFvZNEYttkFvad1IEguTlA5LSscXAphi+rVy3zhkl
// SIG // hyCFeGK0yU0+jzbcuURKIxybmRwK5BfVZx0xEVqE4wM3
// SIG // yN5D/uW+GpVHYYAGe7bTrtW1Z13x2qj2Jdqz7NtI4tNy
// SIG // zlVrIf62nYBNe3rOYS/repVdHlR61YbLLETlibs9jFzA
// SIG // re4sO5RTxvS1yho7JqJ59oKLRnRyLhIOSZyTCVZosXeS
// SIG // 0ZZJoGEWSs4cUgsMqBiKtD4WgO2PlT3LeaQh5Io3CCA5
// SIG // tJ5ZCvtCsnqaJXKhptE/xmEETIRyZRjjplUKKd+sFFVG
// SIG // JJVMvvrw1nhIBKOLO4cTepiG39jEiEP4iHzGYCcQuvaL
// SIG // pDFFwqzgt0pBP8SJIKX5dtjDNYrZGd+ZzV5DKJVNZQID
// SIG // AQABo4IBTjCCAUowDgYDVR0PAQH/BAQDAgGGMBAGCSsG
// SIG // AQQBgjcVAQQDAgEAMB0GA1UdDgQWBBR/WT9UIdqtT+8F
// SIG // 5eaj1y0GlBIIMTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBi
// SIG // AEMAQTAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQYMBaA
// SIG // FHItOgIxkEO5FAVO4eqnxzHRI4k0MFoGA1UdHwRTMFEw
// SIG // T6BNoEuGSWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9w
// SIG // a2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dDIwMTFf
// SIG // MjAxMV8wM18yMi5jcmwwXgYIKwYBBQUHAQEEUjBQME4G
// SIG // CCsGAQUFBzAChkJodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NlcnRzL01pY1Jvb0NlckF1dDIwMTFfMjAx
// SIG // MV8wM18yMi5jcnQwDQYJKoZIhvcNAQEMBQADggIBABSU
// SIG // HzgoT+6J5+nyyDCq0pTdVmCsAxYAHXcpjlDtxazPHewf
// SIG // 1v4kOg8V7A5+w+VuMDMGHi8rLXBKn5I8+DVEUYGs8jLu
// SIG // ckc0IeC6owOLUrU3CYdaKRMaO55+T7jwWJ27tPkx0rlR
// SIG // 03tFU0z1YYpcv6Yhaw6N2sUPT+AvjpecnrftoE33pCAk
// SIG // ucUvnGH0iL4J9CZLFQVTGFSOUBbv6oZy4bBBRFMxvH77
// SIG // 9IY4JDvpZKVfbcuhpDeL3Z3e8mukOmkfct+GojNapsWs
// SIG // QYujlJ8jZen5Lrp/3YkxZ2Ay06aTpK/5oOVknwog1TDQ
// SIG // sbY+MDyguTph5tQ0CLfzDaJG2x91BrBT9UG87C6HLkqi
// SIG // wrx9PSKN3wz05rHEfWO+RuKl+0U1/AHQT6NCOjhKI39/
// SIG // c7hWbdKjh5uuWFkBOvXGTNrnhNTAdOXTTYByvYExO8yr
// SIG // yv34PAdqo1vPDE/1heVebr2RramvRUi9kWswKwPqwz7n
// SIG // +iRmM+B6YDGRweEurM1kimAb9FYrAs38YHlPnarl1vW3
// SIG // dGrmJTgefAz3DmCnXN0nveIPsS+KXBIWweeCToAJMGE7
// SIG // v/XS3h9qQ6niWQAAVQ1kUAml3zuS4MisCgi2F6YoK2WA
// SIG // o1EgXK/lXvDxVjIVU0JdL+KvCfwFJkDeVuJ9dNXGNi+A
// SIG // Oxk0BtYd9hxwL30BElj9MYIZ5DCCGeACAQEwbjBXMQsw
// SIG // CQYDVQQGEwJVUzEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29k
// SIG // ZSBTaWduaW5nIFBDQSAyMDI0AhMzAAAB/v6KSLXOxGDx
// SIG // AAAAAAH+MA0GCWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3
// SIG // DQEJAzEMBgorBgEEAYI3AgEEMBwGCisGAQQBgjcCAQsx
// SIG // DjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3DQEJBDEiBCDz
// SIG // w5c1iWCWfLXINeZuaZDhCSqNJU/AtgybDLCksfLILzBC
// SIG // BgorBgEEAYI3AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMA
// SIG // bwBmAHShGoAYaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // MA0GCSqGSIb3DQEBAQUABIIBAFEmHlPW8A60JJBs2s1q
// SIG // 3fVlUvpz+b3MoEO7QTf0WKafS4rprQ/8AD2LykEX6sXC
// SIG // uFFNFzoA8KcLsIo0Pi/AEyav7UOobSJOS25xmgfY0uc6
// SIG // 6FrQYY0XZmUf3hRWvDEj0By07OwSkMV9LiSTowm0gqTT
// SIG // PmxDLSUQOwZAua0VIKb4Nqa/dOE6/OTyPjidGDobMW4t
// SIG // n2OCBIYWmXp4ODiRYakYHsMgnsDqwAIm9r6jMBsbJH66
// SIG // uw6PvfUEyRF+//gfEaOk9vKdqKOGLryTPEmHPJUzF3kh
// SIG // JeLWrhxlRqreEFZsXpgqoQYiCpApiIU2MoF4bBdwFBc0
// SIG // IVgCaZ6VX0+J/MqhgheWMIIXkgYKKwYBBAGCNwMDATGC
// SIG // F4Iwghd+BgkqhkiG9w0BBwKgghdvMIIXawIBAzEPMA0G
// SIG // CWCGSAFlAwQCAQUAMIIBUQYLKoZIhvcNAQkQAQSgggFA
// SIG // BIIBPDCCATgCAQEGCisGAQQBhFkKAwEwMTANBglghkgB
// SIG // ZQMEAgEFAAQggeB539Viea7yfdJwWANDiXepSg+8UVoI
// SIG // 7bxCNGyoRMYCBmpfggzUsRgSMjAyNjA3MzAxOTI2MzUu
// SIG // ODhaMASAAgH0oIHRpIHOMIHLMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBP
// SIG // cGVyYXRpb25zMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046RjAwMi0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghHtMIIHIDCC
// SIG // BQigAwIBAgITMwAAAiAk4ebgF7m0jgABAAACIDANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNjAyMTkxOTM5NTJaFw0yNzA1MTcxOTM5
// SIG // NTJaMIHLMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQL
// SIG // ExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMScw
// SIG // JQYDVQQLEx5uU2hpZWxkIFRTUyBFU046RjAwMi0wNUUw
// SIG // LUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3DQEBAQUAA4IC
// SIG // DwAwggIKAoICAQDRYY7yr7ijW6CR178uKveIMufutWOi
// SIG // cxgJwKOce/2GOQceus6ZWfX14i3jNg3JOP7MGJMkOAuc
// SIG // wWBwiA8URp+ZYkGjpVoVkGZsV27WjqLwpf2AwqBsJ/Tz
// SIG // qwE7JFFaxup3Ldxj8GjdJymDFRrdVN/pYHoBFrjD1IkI
// SIG // Du8b1CWn8tgomiKRSY+STvJq99mVkdphMBIUGOegQny8
// SIG // qRd24VME0xi8Oomks9Zq9EjDeKHGpvAbXUEQ6m3cROoE
// SIG // PhTE/miweQH9TqJt3IOsqPv3L8urojB747XBC2y0CDIH
// SIG // lKLcLl3ZG8D7JXKnWTFen3msMPJpcvrQ3zUBVJrH/mI3
// SIG // RxHmCh9ppDP0uG1+PJwk6H/x+sfoG9hW64xoXkpx6DEf
// SIG // NZNfcXdKbXF28XEXdLNnzo3SLNVymeQJhNqOSKhnU84Q
// SIG // nKmrjEk541JiurlDCkCWO9lUBUMb9x0nyfXUbNRPVLgP
// SIG // +PTMRdXOowJdYCzCQfN2ZqL0s4YI28F1Dbn7Bgw2E4P1
// SIG // E9unsvMzJHtzhS2Th3TpCfBbOGalIlF9x/DJZ/ssm/yy
// SIG // zT9YtIFeqmfNxBPTE3aOuh6HxmTICzfYAATvWNhBbo19
// SIG // QwsjPeA9JvhqTLC2KUNgrXroGy4eDZo0n7jFYjZkUih1
// SIG // Ty+8E6qEvV2Na6Z5gUyD5a+tHGDmq69CmUiHfwIDAQAB
// SIG // o4IBSTCCAUUwHQYDVR0OBBYEFNvInOCIhxGA8mY7l1g0
// SIG // 7UHvyNgzMB8GA1UdIwQYMBaAFJ+nFV0AXmJdg/Tl0mWn
// SIG // G1M1GelyMF8GA1UdHwRYMFYwVKBSoFCGTmh0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jv
// SIG // c29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEp
// SIG // LmNybDBsBggrBgEFBQcBAQRgMF4wXAYIKwYBBQUHMAKG
// SIG // UGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
// SIG // Y2VydHMvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBD
// SIG // QSUyMDIwMTAoMSkuY3J0MAwGA1UdEwEB/wQCMAAwFgYD
// SIG // VR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/BAQD
// SIG // AgeAMA0GCSqGSIb3DQEBCwUAA4ICAQCtKGBto1BSvm4W
// SIG // FI+J0NSyVhU1LHL7F3fbjZ2d7F5Kn/FCTBZXpzrDVl63
// SIG // FLRNcIFpnJy4/nlg43r7T5sJPdo4Ms8ADSHQEJnHSu3x
// SIG // 9UpjCzREBPi9+nHhvDgRx/1WmBD6gQUZJLOhcN2TxW4K
// SIG // JyhinMtiBFtkNRZ2vmZ1MAdNXTm5d0Lwk3wzj+/f7VCC
// SIG // TWCXJSoqNa3VU/6sACHI97Evbnzg8bd3hxrfz6CcCVuf
// SIG // 77egvRHinthJuwSRePP7aVmcevb1nWUIAICdBebHQOrz
// SIG // NIeWBIQwvcFaS3SFc+49rqrwQOMFDR4FYBzS7b0QeBVx
// SIG // FuLL2iVu4KAHMNUhLLSD4iKLDFBNTOtTzTlhGvMgG77A
// SIG // 1cjeQrDMHa6oReMDeUDqHUrxv8g7IRdIh+h0gDLkzN0x
// SIG // Iuzli0Bv7JtybGJbV6JxaDF4CzSCIMRpK59nI6iKo4Lg
// SIG // nbQBZJW7+6akYsKG/pXPlfxNv2InpD10tSCkCvw9kr6W
// SIG // 1+NRN+EuZczRgAwWlcK9XJZ3uu/v/oxHtO7/kmVIs51F
// SIG // 9qV6Y2QNXd6tU46YPrK98m2QDys+lvLNimK0e1xZ7Z1G
// SIG // awKohKGvlLALWDlZQqgHfJ31CB0LlIDI7iLyYTpd2iyK
// SIG // jqskbQiyMtICH+RmH/oCg7JOK0ZA3XIMba9aSWgBF3QZ
// SIG // 6pG3EGeQqjCCB3EwggVZoAMCAQICEzMAAAAVxedrngKb
// SIG // SZkAAAAAABUwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBS
// SIG // b290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDEwMB4X
// SIG // DTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4MzIyNVowfDEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwggIiMA0GCSqG
// SIG // SIb3DQEBAQUAA4ICDwAwggIKAoICAQDk4aZM57RyIQt5
// SIG // osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX9gF/bErg4r25
// SIG // PhdgM/9cT8dm95VTcVrifkpa/rg2Z4VGIwy1jRPPdzLA
// SIG // EBjoYH1qUoNEt6aORmsHFPPFdvWGUNzBRMhxXFExN6AK
// SIG // OG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2Nr41JmTamDu6
// SIG // GnszrYBbfowQHJ1S/rboYiXcag/PXfT+jlPP1uyFVk3v
// SIG // 3byNpOORj7I5LFGc6XBpDco2LXCOMcg1KL3jtIckw+DJ
// SIG // j361VI/c+gVVmG1oO5pGve2krnopN6zL64NF50ZuyjLV
// SIG // wIYwXE8s4mKyzbnijYjklqwBSru+cakXW2dg3viSkR4d
// SIG // Pf0gz3N9QZpGdc3EXzTdEonW/aUgfX782Z5F37ZyL9t9
// SIG // X4C626p+Nuw2TPYrbqgSUei/BQOj0XOmTTd0lBw0gg/w
// SIG // EPK3Rxjtp+iZfD9M269ewvPV2HM9Q07BMzlMjgK8Qmgu
// SIG // EOqEUUbi0b1qGFphAXPKZ6Je1yh2AuIzGHLXpyDwwvoS
// SIG // CtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ+QuJYfM2BjUY
// SIG // hEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AFemzFER1y7435
// SIG // UsSFF5PAPBXbGjfHCBUYP3irRbb1Hode2o+eFnJpxq57
// SIG // t7c+auIurQIDAQABo4IB3TCCAdkwEgYJKwYBBAGCNxUB
// SIG // BAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUKqdS/mTEmr6C
// SIG // kTxGNSnPEP8vBO4wHQYDVR0OBBYEFJ+nFV0AXmJdg/Tl
// SIG // 0mWnG1M1GelyMFwGA1UdIARVMFMwUQYMKwYBBAGCN0yD
// SIG // fQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5
// SIG // Lmh0bTATBgNVHSUEDDAKBggrBgEFBQcDCDAZBgkrBgEE
// SIG // AYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYw
// SIG // DwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV9lbL
// SIG // j+iiXGJo0T2UkFvXzpoYxDBWBgNVHR8ETzBNMEugSaBH
// SIG // hkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
// SIG // bC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0y
// SIG // My5jcmwwWgYIKwYBBQUHAQEETjBMMEoGCCsGAQUFBzAC
// SIG // hj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2Nl
// SIG // cnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNydDAN
// SIG // BgkqhkiG9w0BAQsFAAOCAgEAnVV9/Cqt4SwfZwExJFvh
// SIG // nnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U518JxNj/aZGx8
// SIG // 0HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN3Zi6th542DYu
// SIG // nKmCVgADsAW+iehp4LoJ7nvfam++Kctu2D9IdQHZGN5t
// SIG // ggz1bSNU5HhTdSRXud2f8449xvNo32X2pFaq95W2KFUn
// SIG // 0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnDvBewVIVCs/wM
// SIG // nosZiefwC2qBwoEZQhlSdYo2wh3DYXMuLGt7bj8sCXgU
// SIG // 6ZGyqVvfSaN0DLzskYDSPeZKPmY7T7uG+jIa2Zb0j/aR
// SIG // AfbOxnT99kxybxCrdTDFNLB62FD+CljdQDzHVG2dY3RI
// SIG // LLFORy3BFARxv2T5JL5zbcqOCb2zAVdJVGTZc9d/HltE
// SIG // AY5aGZFrDZ+kKNxnGSgkujhLmm77IVRrakURR6nxt67I
// SIG // 6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+CrvsQWY9af3L
// SIG // wUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8CwYKiexcdFYmN
// SIG // cP7ntdAoGokLjzbaukz5m/8K6TT4JDVnK+ANuOaMmdbh
// SIG // IurwJ0I9JZTmdHRbatGePu1+oDEzfbzL6Xu/OHBE0ZDx
// SIG // yKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZqELQdVTNYs6Fw
// SIG // ZvKhggNQMIICOAIBATCB+aGB0aSBzjCByzELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0IEFt
// SIG // ZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNoaWVs
// SIG // ZCBUU1MgRVNOOkYwMDItMDVFMC1EOTQ3MSUwIwYDVQQD
// SIG // ExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloiMK
// SIG // AQEwBwYFKw4DAhoDFQCTGA9vpsJ6glqCLmI0rggGx4YE
// SIG // EqCBgzCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwMA0GCSqGSIb3DQEBCwUAAgUA7hXcsjAiGA8yMDI2
// SIG // MDczMDE0MjI0MloYDzIwMjYwNzMxMTQyMjQyWjB3MD0G
// SIG // CisGAQQBhFkKBAExLzAtMAoCBQDuFdyyAgEAMAoCAQAC
// SIG // Ah/NAgH/MAcCAQACAhMbMAoCBQDuFy4yAgEAMDYGCisG
// SIG // AQQBhFkKBAIxKDAmMAwGCisGAQQBhFkKAwKgCjAIAgEA
// SIG // AgMHoSChCjAIAgEAAgMBhqAwDQYJKoZIhvcNAQELBQAD
// SIG // ggEBAChJAEDRwUkkrNoYIzCwaGzEitaZc+2QI9bo9z4w
// SIG // hCatBccLW2Nktsv7nm6raw5pcdtBndh6TqIkEngI6nqk
// SIG // psa8Dw0L2yvqdyKGPmeWb3Qr7l1zzCdysDzyV/NN3xS/
// SIG // pSjIGJFd6zHRRKAkBjOwzfZSbIbusFfbH+DhiOmuOoac
// SIG // hh/4o2zqD7xG8Ria8ZDE2PMDfut1wJElTjwBwUwv9IlW
// SIG // lsSre1KYNlPZRLhUthahsbvSSX8Ma98BcjikpKhUs2FT
// SIG // f01WVucTMemoqtopCDSEVRwucFvgZvvjEl0mIL4fwJsX
// SIG // VZdQ0F8cU2pIeUS/oJ1KOaIlaNmtdxrXqf8ccZ8xggQN
// SIG // MIIECQIBATCBkzB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMAITMwAAAiAk4ebgF7m0jgABAAACIDANBglghkgB
// SIG // ZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3
// SIG // DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCDVclOwt5ZuePKd
// SIG // pDvEYFYySWiColCh6YExYD/YMyiibTCB+gYLKoZIhvcN
// SIG // AQkQAi8xgeowgecwgeQwgb0EION7vyOlPA1VqlEp0QIV
// SIG // GlNd8S5YWBnKj97LuTWHSO2vMIGYMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAIgJOHm4Be5
// SIG // tI4AAQAAAiAwIgQg9RKPv01mf0RmnrcuUZ8MbJn4+2wo
// SIG // X7c38qMBdWjLob4wDQYJKoZIhvcNAQELBQAEggIAHCun
// SIG // PI5J6LmQNOkYPz1lgRDAlNohJZJzEtd34Pd/vVmYMWpn
// SIG // AfpMwhe8CaDz+uIpBrLRhSwZDE4ow8/0qitywP8u/ICk
// SIG // i6uO3n4AmYOhxIzw1VWShDPp5rcttrNxbdVbMn3rVFqp
// SIG // ADTMekDgqq4SqtUdG+YZJwRSluUZ2EJG6Ak/Fd///dCS
// SIG // FKn6OiscAPVIIn9Gm7m6RO//i+mTLLsWJde0uyifEkoL
// SIG // fIR4U6pRneeSWnZ6PBeit+2TQym6s+Avthr4CeXtl7Mj
// SIG // hCv/Nerb/T8UlbjPNIaNPYKw2RsxFNxFSkMcmK6qfHXC
// SIG // EZC1VvF7wozBCMGHGe/1OVSFt7eUtin0RAYjuKb6CkFn
// SIG // inIvdv4XiiuTtWi4loYfAwQM7B61sN2WGZpCjBgiIkK4
// SIG // 3gWXHYtSj4o+W4LHHIMcVqQJu1MyFyrUK8KUoqGa+DsS
// SIG // Rh+G0LCErRrbn5NhfgCNvui5Jrpm3N5Z746zpZe1vXN8
// SIG // uDHmK8pL4b3/b7hpdDuHjW65McWYFYevH4bbfysNO6bg
// SIG // DA29vTECaamWV9dtC4FteCB/QVkvqHBP16YU2pvCpHfQ
// SIG // BgSzllBc5JNWmi4g/a3XXpda3HAl5JSaCdp+l1MFVMSx
// SIG // aTheoP6xnwX/VMJ9ubDc4Ofrlzh8R14KAvKSOsbs06RN
// SIG // HNztMhT9NMv2vEZUL44=
// SIG // End signature block
