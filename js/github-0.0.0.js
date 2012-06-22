
(function(){

     jQuery.support.cors = true;

     var Github = function(){
          throw "Github cannot be instanced";
     };

     Github.Utils = {};

     Github.Utils.TreatURL = function(route, parameters){
          var onReplaceKeyword = function(string, key){
               if ( parameters[key] )
                    return parameters[key];
               else
                    return key;
          };

          var fUrl = route.url.replace(/\{(\w+)\}/g, onReplaceKeyword);
          fUrl += '?callback=?';

          if ( route.params )
          {
               for ( var i = 0 ; i < route.params.length ; i++ )
               {
                    if ( parameters[route.params[i]] )
                    {
                         fUrl += '&' + route.params[i] + '=' + parameters[route.params[i]]
                    }
               }
          }

          return fUrl;
     };

     Github.Utils.ExtractUrlParameters = function(url){
          var params = url.split('?');
          var parameterMap = null;
          if ( params.length == 2 )
          {
               parameterMap = {};
               var lp = params[1].split('&');
               for ( var i = 0 ; i < lp.length ; i++ )
               {
                    var parameter = lp[i].split('=');
                    parameterMap[parameter[0]] = parameter[1];
               }
          }

          return parameterMap;
     }

     Github.Utils.Get = function(url, parameters, callback){
          return $.ajax({
               url: Github.Utils.TreatURL(url, parameters),
               type: 'GET',
               dataType: 'jsonp',
               cache: true,
               beforeSend: function(xhr){
                    xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
               },
               success: function(response, status, jqxhr){
                    callback(response.data, response.meta);
               }
          });
     };

     Github.Users = {
          Routes: {
               'GetWatchedReposBy': {
                    url: 'https://api.github.com/users/{user}/watched',
                    params: ['page','per_page']
               },
               'GetUser': { url: 'https://api.github.com/users/{user}' }
          }
     };

     Github.Users.GetWatchedReposBy = function(parameters, callback){
          return Github.Utils.Get(Github.Users.Routes.GetWatchedReposBy, parameters, function(response, meta){
               var nextPage = null;
               var lastPage = null;
               if ( meta.Link )
               {
                    nextPage = parseInt(Github.Utils.ExtractUrlParameters(meta.Link[0][0]).page);
                    lastPage = parseInt(Github.Utils.ExtractUrlParameters(meta.Link[1][0]).page);
               }

               callback(response, nextPage, lastPage);
          });
     };

     Github.Users.GetUser = function(parameters, callback){
          return Github.Utils.Get(Github.Users.Routes.GetUser, parameters, function(response){
               response.id ? callback(response) : callback(null);
          });
     };

     window.Github = Github;

})();
