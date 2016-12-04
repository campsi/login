(function ($) {

    function getFormIds(options) {
        var t = options.translations;
        return {
            login: '#' + t.idPrefix,
            signin: '#' + t.idPrefix + '-' + t.signinId,
            signup: '#' + t.idPrefix + '-' + t.signupId,
            resetPassword: '#' + t.idPrefix + '-' + t.resetPasswordId
        };
    }

    function createLocalForms(options, localProvider) {
        var t = options.translations;
        var ids = getFormIds(options);

        function createForm(id, className) {
            return $('<form>').attr({
                id: id.substr(1),
                class: 'local ' + className,
                action: options.baseUrl + '/' + localProvider.name,
                method: 'POST'
            })
        }

        function createFormLinks(links) {
            return $('<div class="links">').append(links.map(function (link) {
                return $('<a>').attr('href', link.href).text(link.text);
            }));
        }

        function createSigninForm() {
            return createForm(ids.signin, 'signin').append([
                $('<h2>').text(t.signinTitle),
                $('<input>').attr({type: 'text', name: 'username', placeholder: t.usernamePH}),
                $('<input>').attr({type: 'password', name: 'password', placeholder: t.passwordPH}),
                $('<input>').attr({type: 'hidden', name: 'action', value: 'signin'}),
                $('<input>').attr({type: 'hidden', name: 'invitation', value: options.invitation}),
                $('<div class="submit">').append($('<button>').text(t.signinSubmitText)),
                createFormLinks([
                    {href: ids.resetPassword, text: t.resetPasswordLink},
                    {href: ids.signup, text: t.signupLink}
                ])
            ]);
        }

        function createSignUpForm() {
            return createForm(ids.signup, 'signup').append([
                $('<h2>').text(t.signupTitle),
                $('<input>').attr({type: 'text', name: 'displayName', placeholder: t.displayNamePH}),
                $('<input>').attr({type: 'email', name: 'email', placeholder: t.emailPH}),
                $('<input>').attr({type: 'text', name: 'username', placeholder: t.usernamePH}),
                $('<input>').attr({type: 'password', name: 'password', placeholder: t.passwordPH}),
                $('<input>').attr({type: 'password', name: 'password_verify', placeholder: t.passwordVerifyPH}),
                $('<input>').attr({type: 'hidden', name: 'action', value: 'signup'}),
                $('<input>').attr({type: 'hidden', name: 'invitation', value: options.invitation}),
                $('<div class="submit">').append($('<button>').text(t.signupSubmitText)),
                createFormLinks([{href: ids.signin, text: t.signinLink}])
            ]);
        }

        function createResetPasswordForm() {
            return createForm(ids.resetPassword, 'signup').append([
                $('<h2>').text(t.resetPasswordTitle),
                $('<input>').attr({type: 'email', name: 'email', placeholder: t.emailPH}),
                $('<input>').attr({type: 'hidden', name: 'action', value: 'reset-password'}),
                $('<div class="submit">').append($('<button>').text(t.resetPasswordSubmitText)),
                createFormLinks([{href: ids.signin, text: t.signinLink}])
            ]);
        }

        return [
            createSigninForm(),
            createResetPasswordForm(),
            createSignUpForm()
        ];
    }

    function createButton(settings, provider) {
        var $button = $('<a class="auth"></a>');
        var url = 'http://localhost:3000/auth/' + provider.name;
        if (settings.invitation) {
            url += '?invitation=' + encodeURIComponent(settings.invitation);
        }
        $button.addClass(provider.name);
        $button.attr({href: url});
        $button.text(provider.name);
        return $button;
    }

    function createMarkup(settings) {
        var $login = $('<div />')
            .addClass('campsi-login')
            .hide()
            .append('<div class="fx">')
            .append($('<a class="close"></a>'))
            .append('<div class="logo">')
            .append($('<h1>').html(settings.translations.title))
            .append('<div class="user"></div>')
            .append($('<div class="buttons">'));

        if (settings.logo) {
            $login.find('.logo')
                .append($('<img>').attr('src', settings.logo))
                .css(settings.logoStyle);
        }

        $(settings.providers).each(function () {
            if (this.name === 'local') {
                $login.append(createLocalForms(settings, this));
            } else {
                $login.find('.buttons').append(createButton(settings, this))
            }
        });
        return $login
    }


    function getProviders(options, onSuccess, onError) {
        onError = onError || function (response) {
                // todo return false and console.error
                // to avoid breaking the website
                var error = new Error('campsi/login could not retreive auth providers');
                error.response = response;
                throw error;
            };

        $.ajax({
            url: options.baseUrl + '/providers',
            dataType: 'json',
            error: onError
        }).done(onSuccess);
    }

    function addBearerToken(settings) {
        return function (xhr) {
            if (settings.token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + settings.token.value)
            }
        }
    }

    function authUser(options, onSuccess, onError) {
        $.ajax({
            url: options.baseUrl + '/me',
            beforeSend: addBearerToken(options),
            success: onSuccess,
            error: onError,
            dataType: 'json'
        });
    }

    function getQueryStringParam(paramName) {
        var qs = window.location.search,
            paramIndexInQs = qs.indexOf(paramName + '='),
            ampIndexInQs = qs.indexOf('&', paramIndexInQs);

        if (paramIndexInQs > -1) {
            paramIndexInQs +=  paramName.length + 1;
            return decodeURIComponent(qs.substring(paramIndexInQs, (ampIndexInQs === -1) ? qs.length : ampIndexInQs));
        }
    }

    function parseToken(options) {
        var decoded,
            stored,
            token = options.token || getQueryStringParam('token'),
            type = typeof token;

        if (type === 'object') {
            return options.token;
        }

        if (token && type === 'string') {
            try {
                decoded = JSON.parse(atob(token));
            } catch (err) {
                console.dir(token);
                console.warn('invalid token');
                console.warn(err);
            }
            return decoded;
        }


        stored = window.localStorage.getItem(options.localStorageKey);
        try {
            decoded = JSON.parse(stored);
        } catch (err) {
            console.warn('campsi/login could not parse stored token');
            console.warn(err);
        }
        return decoded;
    }

    function execute($this, command) {
        var settings = $this.data('campsi-login-settings');

        if (!settings) {
            console.error('campsi/login has not been instanciated. Please call $el.CampsiLogin({options}) first.');
            return;
        }
        switch (command) {
            case 'show':
                showLogin($this, settings);
                break;
            case 'hide':
                hideLogin($this);
                break;
            case 'logout':
                logout($this, settings);
                showLogin($this, settings);
                break;
            case 'displayUser':
                displayUser($this, settings);
                break;
            default:
                console.warn('campsi/login unknown command', command);
        }

        return $this;
    }

    function logout($this, settings) {
        $.ajax({
            url: settings.baseUrl + '/logout',
            dataType: 'json',
            beforeSend: addBearerToken(settings)
        }).done(function () {
            window.localStorage.removeItem(settings.localStorageKey);
            $this.find('.user').empty();
            $this.removeClass('userLoggedIn');
            updateFormsState($this, settings);
        });
    }

    function hideLogin($this) {
        $this.removeClass('visible').addClass('closed');
    }

    function showLogin($this) {
        $this.addClass('visible').removeClass('closed');
    }

    function getSettings(options) {
        var settings;

        if (typeof options !== 'object') {
            return;
        }

        if (options.translations) {
            options.translations = $.extend({},
                $.fn.CampsiLogin.defaults.translations,
                options.translations
            );
        }
        settings = $.extend({}, $.fn.CampsiLogin.defaults, options);
        settings.token = parseToken(settings);
        settings.invitation = settings.invitation || getQueryStringParam('invitation');
        // settings.state =
        if (!settings.baseUrl) {
            throw new Error('campsi/login missing baseUrl option');
        }
        return settings
    }

    function displayUser($this, settings) {
        var user = $this.data('campsi-login-user');
        var t = settings.translations;
        if (!user) {
            console.error('campsi/login displayUser was called, but no user found');
            return;
        }
        var $logout = $('<a href="#campsi-logout">').text(t.logoutText).on('click', function () {
            $this.CampsiLogin('logout');
        });
        $this.find('.user').empty()
            .append($('<div class="displayName">').text(user.displayName))
            .append($('<div class="pictureWrapper">').append($('<img>').attr('src', user.pictureUrl)))
            .append($logout);
    }

    function addEventListeners($this, settings) {
        $this.on('click', '.close', function () {
            $this.CampsiLogin('hide');
        });

        $(window).on('hashchange', function () {
            updateFormsState($this, settings);
        });
    }

    function updateFormsState($this, settings) {
        var ids = getFormIds(settings);
        var stateInHash = (location.hash.indexOf('#' + settings.translations.idPrefix) === 0) ? location.hash : null;
        var activeState = stateInHash || ids[settings.state] || ids.signin;
        $this.find('form').hide();
        $this.find(activeState).show();
    }

    $.fn.CampsiLogin = function (options) {
        var $this = this;
        var settings = getSettings(options);
        if (typeof options === 'string') {
            return execute($this, options);
        }

        if ($this.hasClass('campsi-login-wrapper')) {
            console.info('campsi/login has already been inited');
            return;
        }


        getProviders(settings, function (providers) {

            settings.providers = providers;

            $this.append(createMarkup(settings))
                .addClass('campsi-login-wrapper')
                .data('campsi-login-settings', settings);

            addEventListeners($this, settings);

            if (settings.token) {
                authUser(settings, function (userInfo) {
                    window.localStorage.setItem(settings.localStorageKey, JSON.stringify(userInfo.token));
                    $this.data('campsi-login-user', userInfo)
                        .CampsiLogin('displayUser')
                        .addClass('userLoggedIn')
                        .trigger('login', userInfo);
                    end();
                }, function () {
                    $this.trigger('loginError');
                    end();
                });
            } else {
                end();
            }
        });

        function end() {
            $this.find('.campsi-login').show();
            $(window).trigger('hashchange');
        }

        return $this;
    };

    $.fn.CampsiLogin.defaults = {
        autoShow: true,
        localStorageKey: 'campsi-login-token',
        logoStyle: {},
        translations: {
            title: 'Login',
            idPrefix: 'campsi-login',

            signinId: 'signin',
            signinSubmitText: 'Sign in',
            signinLink: 'I remember!',
            signinTitle: 'Sign in',

            signupId: 'signup',
            signupSubmitText: 'Sign up',
            signupLink: 'Sign up',
            signupTitle: 'Sign up',

            resetPasswordId: 'reset-password',
            resetPasswordSubmitText: 'Send me the link',
            resetPasswordLink: 'Forgot your password?',
            resetPasswordTitle: 'Reset password',

            displayNamePH: 'Display name',
            emailPH: 'Email address',
            usernamePH: 'Username',
            passwordPH: 'Password',
            passwordVerifyPH: 'Verify your password',

            logoutText: 'Log out'
        }
    };


})(window.jQuery);