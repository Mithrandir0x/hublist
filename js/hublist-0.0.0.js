
(function($){
    
    var Hublist = function(){
        throw "Hublist cannot be instanced.";
    };

    var spinner = null;

    Hublist.Repositaires = null;

    Hublist.Initialize = function(){
        // Initialize spinner
        spinner = new Spinner({
            lines: 11, // The number of lines to draw
            length: 0, // The length of each line
            width: 5, // The line thickness
            radius: 18, // The radius of the inner circle
            rotate: 12, // The rotation offset
            color: '#000', // #rgb or #rrggbb
            speed: 1.5, // Rounds per second
            trail: 42, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'Spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: 'auto', // Top position relative to parent in px
            left: 'auto' // Left position relative to parent in px
        }).spin();
        $('.Header')[0].appendChild(spinner.el);
        $('.Spinner').hide();

        var githubUser = Hublist.GetStoredUser();

        $(window).on('debouncedresize', function(event){
            $('.GithubUser').remove();

            console.log('debouncing!')

            var user = Hublist.GetStoredUser();
            if ( user )
                Hublist.Render(user);
        });

        var content = $('.Content');
        $(window).on('resize', function(){
            content.height($(window).height() - 140);
        });

        console.log(githubUser);

        if ( githubUser )
        {
            Hublist.Render(githubUser);
        }
        else
        {
            Hublist.AskGithubAccount();
        }
    };

    Hublist.Render = function(user){
        console.log(Hublist.GetScreenMode());

        var repositaires = [];

        var content = $('.Content');

        var fetchingRepos = $.Deferred();

        $('.Spinner').show();

        var fetchAllRepos = function(parameters, lastIndex){
            if ( lastIndex == undefined )
                lastIndex = -Infinity;

            var promise = Github.Users.GetWatchedReposBy(parameters, function(data, next, last){
                var i = next;

                repositaires = repositaires.concat(data);
                if ( next && last >= lastIndex )
                {
                    parameters.page = next;
                    fetchAllRepos(parameters, last);
                }
                else
                {
                    fetchingRepos.resolve();
                }
            });

            promise.error(function(){
                fetchingRepos.reject("Couldn't contact with Github. Try reloading again... later... sometime :3");
            });
        };

        var comparator = function(a, b){
            var da = Date.parse(a.updated_at), db = Date.parse(b.updated_at);

            if ( da > db )
                return -1;
            if ( da < db )
                return 1;
            return 0;
        };

        fetchAllRepos({user: user.login, per_page: 100});

        var contentWrapper = $('#ContentWrapper');
        $('.Column').remove();

        var maxElementsPerColumn = Math.floor( ($(window).height() - 140) / 127 );

        fetchingRepos.done(function(){
            repositaires.sort(comparator);

            for ( var i = 0 ; i < repositaires.length ; i += maxElementsPerColumn )
            {
                var column = $.el.div({'class': 'Column'});
                for ( var j = i ; ( j - i ) < maxElementsPerColumn && j < repositaires.length ; j++ )
                {
                    var tag = $.el.div({'class': 'Repo'},
                        $.el.a(
                            {'class': 'Name', 'title': 'Go to github site', 'href': repositaires[j].html_url, 'target': 'blank'}, 
                            repositaires[j].name
                        ),
                        $.el.a({'class': 'Owner', 'href': 'http://github.com/' + repositaires[j].owner.login}, repositaires[j].owner.login)
                    );
                    var bottomBar = $.el.div({'class': 'BottomBar'}, 
                        $.el.div({'style': 'text-align: right; margin-bottom: 4px;'}, 
                            'Updated ' + Hublist.HumanizeDate(Date.parse(repositaires[j].updated_at) / 1000) + ' ago.')
                    );
                    var toolBar = $.el.div({'class': 'Toolbar'},
                        $.el.a({'href': repositaires[j].html_url, 'target': 'blank', 'title': 'Go to github site'}, 
                            $.el.span({'class': 'Github-Octicons Github-Octicons-Message'}))
                    );

                    bottomBar.appendChild(toolBar);
                    tag.appendChild(bottomBar);

                    column.appendChild(tag);
                }
                contentWrapper[0].appendChild(column);
            }

            var githubUserArea = $.el.div({'class': 'GithubUser clearFix'});

            var avatar = $.el.img({'style': 'width: 32px; height: 32px; float: right;', 'src': user.avatar_url});
            
            var closeUserButton = $.el.div({'style': 'float: left; color: #A5A5A5;', 'class': 'Github-Octicons Github-Octicons-Logout'});
            $(closeUserButton).click(function(){
                $('.GithubUser').remove();

                Hublist.DeleteStoredUser();
                Hublist.AskGithubAccount();
            });

            githubUserArea.appendChild(avatar);
            githubUserArea.appendChild(closeUserButton);
            $('body').append(githubUserArea);

            $('.Spinner').hide();
            contentWrapper.width((Math.ceil(repositaires.length / maxElementsPerColumn) * 247) + 135);
            content.height($(window).height() - 140).fadeIn('slow');
        });

        fetchingRepos.fail(function(error){
            console.error('Failed to load repos. Error:', error);

            $('.Spinner').hide();

            Hublist.DisplayError(error);
        });
    };

    Hublist.DisplayError = function(message){
        var messageBox = $.el.div({'class': 'MessageBox'},
            $.el.div({'class': 'Title'}, 'grey rectangle of fluffy death'),
            $.el.div({'class': 'Message'}, message)
        );

        $('body').append(messageBox);
    };

    Hublist.AskGithubAccount = function(){
        var form = $.el.div(
            {'class': 'GithubAccountNameForm'},
            $.el.div(
                $.el.span({'class': 'Github-Octicons Github-Octicons-Octocat Github-Octicons-hublistLogo'}),
                $.el.sup(
                    $.el.span({'class': 'Github-Octicons Github-Octicons-hublistLogo-Sup Github-Octicons-Public-Repo'})
                )
            )
        );

        var inputUser = $.el.input({
            'class': 'GithubAccountNameInput',
            'placeholder': 'Type your username here',
            'data-placeholder-text': 'Type your username here',
            'value': 'Type your username here'
        });
        $(inputUser).focus(function(){
            var thou = $(this);
            if ( thou.val() == thou.data('placeholder-text') )
                thou.val('');
        });
        $(inputUser).blur(function(){
            var thou = $(this);
            if ( thou.val() == '' )
                thou.val(thou.data('placeholder-text'));
        });
        $(inputUser).keypress(function(event){
            if ( event.keyCode == 13 )
            {
                var githubUser = $(this).val();
                // Validate input!
                if ( githubUser )
                {
                    //console.log('user ' + githubUser);
                    var params = { user: githubUser };
                    //console.log(params.user);
                    Github.Users.GetUser(params, function(data){
                        $('.GithubAccountNameForm').css('opacity', '0.0');

                        Hublist.StoreUser(data);
                        Hublist.Render(data);

                        setTimeout(function(){$('.GithubAccountNameForm').remove();}, 500);
                    }).error(function(response, status, jqxhr){
                        console.log(response);
                        console.log(response.getAllResponseHeaders());
                        Hublist.DisplayError("Couldn't fetch github user information.");
                    });
                }
            }
        });

        form.appendChild(inputUser);

        $('body').append(form);
    };

    Hublist.GetStoredUser = function(){
        var username = localStorage.getItem('gh-hl-username');
        var avatar = localStorage.getItem('gh-hl-avatar');

        if ( username && avatar )
        {
            return {
                login: username,
                avatar_url: avatar
            };
        }

        return null;
    };

    Hublist.StoreUser = function(user){
        localStorage.setItem('gh-hl-username', user.login);
        localStorage.setItem('gh-hl-avatar', user.avatar_url);
    };

    Hublist.DeleteStoredUser = function(){
        localStorage.clear();
    };

    // THIS IS NOT MINE, it's from github user "danielgwood"
    // Check the original gist here: https://gist.github.com/1510463
    // Time must be in seconds, do not forget ._.
    Hublist.HumanizeDate = function(time1, time2){
        // Check/sanitise vars
        time1 = Math.max(0, parseInt(time1));

        if(typeof time2 == "undefined") {
            var now = new Date();
            time2 = Math.floor(now.getTime() / 1000);
        }
        var period = Math.abs(time1 - time2);

        var timespan = 1;
        var format = 'seconds';
        if (period > 31556926) {
            // More than one year
            format = 'years';
            timespan = Math.floor(period / 31556926);
        }
        else if (period > 2629744) {
            // More than one month
            format = 'months';
            timespan = Math.floor(period / 2629744);
        }
        else if (period > 604800) {
            // More than one week
            format = 'weeks';
            timespan = Math.floor(period / 604800);
        }
        else if (period > 86400) {
            // More than one day
            format = 'days';
            timespan = Math.floor(period / 86400);
        }
        else if (period > 3600) {
            // More than one hour
            format = 'hours';
            timespan = Math.floor(period / 3600);
        }
        else if (period > 60) {
            // More than one minute
            format = 'minutes';
            timespan = Math.floor(period / 60);
        }

        // Remove the s
        if(timespan == 1) {
            format = format.substr(0, format.length - 1);
        }

        return timespan + ' ' + format;
    };

    // THIS IS NOT MINE, it's from "Jeremy Keith"
    // You will find more useful information, instead of this lousy rip off
    // at this web page: http://adactio.com/journal/5429/
    Hublist.GetScreenMode = function(){
        return window.getComputedStyle(document.body,':after').getPropertyValue('content');
    };

    $(document).ready(Hublist.Initialize);

})(jQuery);
