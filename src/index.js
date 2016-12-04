/**
 * @name CampsiLoginOptions
 * @type Object
 * @property {String} baseUrl
 * @property {Object} [translations]
 * @property {String} [token]
 * @property {String} [invitation]
 */

/**
 * @name CampsiProvider
 * @type {Object}
 * @property {String} name
 * @property {Array} [scope]
 * @property {Object} [colors]
 */

/**
 * @name CampsiLocalProvider
 * @extends {CampsiProvider}
 * @type {Object}
 */

/**
 * @name CampsiLoginProviders
 * @type {Object<name,CampsiProvider>}
 * @property {CampsiLocalProvider} local
 */

/**
 *
 * @param {CampsiLoginOptions} options
 * @param {Object} providers
 * @returns {jQuery} the campsi/login markup
 */
/**
 * Usage
 * ```javascript
 $('#login').CampsiLogin({
    baseUrl: 'http://localhost:3000/auth',
    success: function (token) {

    },
    error: function (error) {

    },
    ready: function () {

    },
    translations: {}
});
 */


(function ($) {
    /**
     * @param {CampsiLoginOptions} options
     * @returns {{signin: string, signup: string, resetPassword: string}}
     */
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
        console.info('createLocalForms', options);
        var t = options.translations;
        var ids = getFormIds(options);

        function createForm(id) {
            return $('<form>').attr({
                id: id,
                class: 'local',
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
            return createForm('campsi-login-signin').append([
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
            return createForm('campsi-login-signup').append([
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
            return createForm('campsi-login-reset-password').append([
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

    function createMarkup(options) {
        var $login = $('<div />')
            .addClass('campsi-login')
            .append('<div class="fx">')
            .append($('<a class="close"></a>'))
            .append('<div class="logo">')
            .append($('<h1>').html(options.translations.title))
            .append('<div class="user"></div>')
            .append($('<div class="buttons">'));

        if (options.logo) {
            $login.find('.logo')
                .append($('<img>').attr('src', options.logo))
                .css(options.logoStyle);
        }

        $(options.providers).each(function () {
            if (this.name === 'local') {
                $login.append(createLocalForms(options, this));
            } else {
                $login.find('.buttons').append(createButton(options, this))
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
            onError: onError,
            dataType: 'json'
        });
    }

    function getQueryStringParam(paramName) {
        var qs = window.location.search,
            paramIndexInQs = qs.indexOf(paramName + '=') + paramName.length + 1,
            ampIndexInQs = qs.indexOf('&', paramIndexInQs);

        if (paramIndexInQs > -1) {
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
        });
    }

    function hideLogin($this) {
        $this.removeClass('visible').addClass('closed');
    }

    function showLogin($this, settings, attempts) {
        attempts = attempts || 0;
        if (attempts > 2) {
            console.error('campsi/login could not find .campsi-login');
            return false;
        }
        if ($this.find('.campsi-login').length < 1) {
            init($this, settings, function () {
                showLogin($this, settings, attempts + 1);
            });
        } else {
            $this.addClass('visible').removeClass('closed');
        }
    }

    function init($this, settings, cb) {
        $this.empty()
            .addClass('campsi-login-wrapper')
            .append(createMarkup(settings));

        $this.trigger('ready');
        $(window).trigger('hashchange');
        cb();
    }

    function getSettings(options) {
        if (options.translations) {
            options.translations = $.extend({}, $.fn.CampsiLogin.defaults.translations, options.translations);
        }
        var settings = $.extend({}, $.fn.CampsiLogin.defaults, options);
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

    /**
     *
     * @param {CampsiLoginOptions|String} options
     * @constructor
     */
    $.fn.CampsiLogin = function (options) {
        var $this = this, settings, t;

        if (typeof options === 'string') {
            return execute($this, options);
        }

        settings = getSettings(options);
        settings.invitation = settings.invitation || getQueryStringParam('invitation');
        t = settings.translations;

        $(window).on('hashchange', function () {
            if (!$this.hasClass('userLoggedIn')) {
                var activeForm = (location.hash.indexOf('#' + t.idPrefix) === 0)
                    ? location.hash
                    : getFormIds(settings).signin;

                $this.find('form').hide();
                $this.find(activeForm).show();
            }
        });

        settings.token = parseToken(settings);
        $this.data('campsi-login-settings', settings);

        getProviders(settings, function (providers) {
            settings.providers = providers;
            if (settings.token) {
                authUser(settings, function (userInfo) {
                    window.localStorage.setItem(settings.localStorageKey, JSON.stringify(userInfo.token));
                    $this.data('campsi-login-user', userInfo);
                    $this.addClass('userLoggedIn');
                    $this.trigger('login', userInfo);
                    $this.CampsiLogin('displayUser');
                }, function () {
                    $this.trigger('loginError');
                    $this.CampsiLogin('show');
                });
            }

            if (settings.autoShow) {
                $this.CampsiLogin('show');
            }
        });

        $this.on('click', '.close', function () {
            $this.CampsiLogin('hide');
        });

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