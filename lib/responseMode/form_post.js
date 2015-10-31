/**
* Authorization Response parameters are encoded as HTML form values that are auto-submitted in the User Agent, 
* and thus are transmitted via the HTTP POST method to the Client, with the result parameters being encoded in 
* the response body using the application/x-www-form-urlencoded format. The action attribute of the form MUST be 
* the Client's Redirection URI. The method of the form attribute MUST be POST.
* Any technique supported by the User Agent MAY be used to cause the submission of the form, and any form content 
* necessary to support this MAY be included, such as submit controls and client-side scripting commands. However, 
* the Client MUST be able to process the message without regard for the mechanism by which the form submission was 
* initiated. (http://openid.net/specs/oauth-v2-form-post-response-mode-1_0-01.html)
**/

var input = '<input type="hidden" name="{NAME}" value="{VALUE}"/>';
var html = '<html>' +
  '<head><title>Submit This Form</title></head>' +
  '<body onload="javascript:document.forms[0].submit()">' +
    '<form method="post" action="{ACTION}">' +
      '{INPUTS}' +
    '</form>' +
  '</body>' +
'</html>';

module.exports = function (res, redirectURI, params) {
  var inputs = [];
  
  Object.keys(params || {}).forEach(function (k) {
    inputs.push(input.replace('{NAME}', k).replace('{VALUE}', params[k]));
   });

  res.setHeader('Content-Type', 'text/html;charset=UTF-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  return res.end(html.replace('{ACTION}', redirectURI).replace('{INPUTS}', inputs.join('')));
};