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

          if ( route.params )
          {
               for ( var i = 0 ; i < route.params.length ; i++ )
               {
                    if ( parameters[route.params[i]] )
                    {
                         if ( fUrl.indexOf('?') == -1 )
                              fUrl += '?';
                         else
                              fUrl += '&';
                         fUrl += route.params[i] + '=' + parameters[route.params[i]]
                    }
               }
          }

          return fUrl;
     };

     Github.Utils.Get = function(url, parameters, callback){
          return $.getJSON(Github.Utils.TreatURL(url, parameters), function(response, status, jqxhr){
               var header = {};
               var headerText = jqxhr.getAllResponseHeaders();
               for ( var i = 0, headerItems = headerText.split('\n') ; i < headerItems.length ; i++ )
               {
                    var headerItem = headerItems[i].trim().split(': ');
                    if ( headerItem.length == 2 )
                    {
                         header[headerItem[0]] = headerItem[1];
                         var arrayItem = headerItem[1].split(', ');
                         if ( arrayItem.length > 1 )
                              header[headerItem[0]] = arrayItem;
                    }
               }

               callback(response, header);
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
          return Github.Utils.Get(Github.Users.Routes.GetWatchedReposBy, parameters, function(response, header){
               var link = header['Link'];
               var nextPage = null;
               var lastPage = null;
               if ( link )
               {
                    nextPage = parseInt(link[0].split('=')[1].split('>')[0]);
                    lastPage = parseInt(link[1].split('=')[1].split('>')[0]);
               }
               callback(response, nextPage, lastPage);
          });
     };

     Github.Users.GetUser = function(parameters, callback){
          return Github.Utils.Get(Github.Users.Routes.GetUser, parameters, function(response, header){
               response.id ? callback(response) : callback(null);
          });
     };

     window.Github = Github;

})();
