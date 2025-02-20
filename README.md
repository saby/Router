# saby-router

**saby-router** provides modules and components that help you to implement a single-page application.

## Ответственные
  * Санников Кирилл
  * Мустафин Ленар

## Документация
  https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/

## Table of Contents

  * [Running the Tests](#running-the-tests)
  * [Running the Demo](#running-the-demo)
  * [Using Route to Match URLs](#using-route-to-match-urls)
    * [Mask Types](#mask-types)
    * [Opening and Closing Popups on URL Change](#opening-and-closing-popups-on-url-change)
  * [Using Reference to Change URLs](#using-reference-to-change-urls)
    * [Specifying a Pretty URL](#specifying-a-pretty-url)
    * [Clearing a Part of the URL](#clearing-a-part-of-the-url)
  * [Using Controller to Change URLs in TS/JS](#using-controller-to-change-urls-in-tsjs)
    * [Replacing the Current State](#replacing-the-current-state)
  * [Using MaskResolver to Do URL Calculations in TS/JS](#using-maskresolver-to-do-url-calculations-in-tsjs)

## Running the Tests

To start the unit testing server, run the following commands:

    npm install
    npm run build
    npm start:units

Go to http://localhost:[port], port will be displayed in console, in your browser to execute the tests and see the results. The tests themselves are located in the `RouterTest` folder, filename of every test file ends with `.test.js`.

## Running the Demo

To start the demo server, run the following commands:

    npm install
    npm run build
    npm start

Go to [http://localhost:777/](http://localhost:777/) in your browser to see the demo page. The demo itself is located in `RouterDemo` folder, with an entry file of `Index.ts` that loads the module `RouterDemo/Main`.

## Using Route to Match URLs

`Route` is a component that matches URLs and extracts values from them.

This component has a `mask` option. Mask is a string that contains a special placeholder that starts with a colon character (:) and represents an arbitrary parameter in the URL. The value of this parameter is extracted from the URL when it changes and is passed inside of the `Route` with the same name as the placeholder itself.

**Example:**

    <Router.router:Route mask="destination/:myDestination">
       <p>Selected destination: {{ content.myDestination }}</p>
    </Router.router:Route>

In the example above, if the URL contains the substring `destination/Italy`, the user will see `Selected destination: Italy`. If the URL doesn't match the mask `destination/*` at all, `myDestination` will be undefined.

### Mask Types

`Route` supports two mask types: standard param and query param.

#### Standard Param Mask

Standard param mask looks like `paramName/:paramValue` and can contain any number of placeholders, for example `tour/:priceMin/:priceMax`. It matches any URL that contains the
mask.

Placeholder value for standard param mask ends when the URL ends, or when a `#`, `/` or `?` character is encountered.

**Example:**

    Mask: "paramName/:paramValue"

    URL: "/paramName/valueOne"        -> paramValue = "valueOne"
    URL: "/paramName/value/Two"       -> paramValue = "value"
    URL: "/paramName/value?num=three" -> paramValue = "value"
    URL: "/paramName/value#Four"      -> paramValue = "value"

#### Query Param Mask

Query param mask looks like `paramName=:paramValue` and has to contain exactly one placeholder. It matches and extracts the placeholder value from any URL that contains the specified query param, for example the URL `/mypurchases?filtered=true&paramName=age&greaterthan=2` would match the mask, and the extracted value would be `age`.

Placeholder value for query param mask ends when the URL ends, or when `#` or `&` character is encountered.

**Example:**

    Mask: "paramName=:paramValue"

    URL: "/page?paramName=valueOne"       -> paramValue = "valueOne"
    URL: "/page?paramName=value&two=true" -> paramValue = "value"
    URL: "/page?paramName=value#three"    -> paramValue = "value"

### Opening and Closing Popups on URL Change

`Route` has three events: `on:enter` fires when the current URL starts to match this route's mask, `on:leave` fires when the current URL no longer matches the specified mask and `on:urlChange` fires whenever the parameters specified by the mask option change.

**Example:**

    <Router.router:Route mask="search/:query">...</Router.router:Route>

    Current URL: "/home"
    Go to: "/page/search/My+query"           -> on:enter fires
    Then go to: "/page/search/Another+query" -> no events fired
    Then go to: "/about"                     -> on:leave fires

These events can be used to perform custom actions when the URL changes, for example to open popup windows.

**Example:**

    <Router.router:Route mask="alert/:popupInfo" on:enter="showPopup()" on:leave="closePopup()" />

    Current URL: "/home"
    Go to: "/home/alert/signup" -> showPopup() is executed
    Go to: "/home"              -> closePopup() is executed

`on:enter` and `on:leave` handlers receive two parameters - the new and the old locations that user navigated between. These locations are represented by a state-object `{ state, href }` where state is an actual URL the router is working with and `href` is a pretty URL that is being displayed to the user.

`on:urlChange` handler receives two arguments as well, these are objects that contain the values of parameters specified by the mask after and before the navigation.

**Example:**

    <Router.router:Route mask="alert/:alertType" on:urlChange="changeAlert()" />

    Current URL: "/home"
    Go to: "/home/alert/signup" -> changeAlert({ alertType: 'signup' }, { alertType: undefined })
    Go to: "/home/alert/login"  -> changeAlert({ alertType: 'login' }, { alertType: 'signup' })
    Go to: "/home"              -> changeAlert({ alertType: undefined }, { alertType: 'login' })

## Using Reference to Change URLs

`Reference` is a component that changes the URL without page reload on click, while still updating the values for `Route`, which causes changed templates to update and redraw. It calculates the resulting url based on the options passed to it and passes the resulting `href` string parameter inside its content.

The `state` option specifies the mask for URL change, and the rest of the options specify the values for the placeholders. `Reference` uses [the same mask types](#mask-types) as `Route`.

**Example:**

    <Router.router:Reference state="destination/:country" country="Italy">
       <a href="{{ content.href }}">Go to Italy</a>
    </Router.router:Reference>

Clicking on the link in the example above would add the `destination/Italy` part to the URL if it currently does not contain `destination`, and would change the currently specified destination otherwise. The rest of the URL stays unchanged.

    URL: "/book"                                          -> After click: "/book/destination/Italy"
    URL: "/book/destination/Russia"                       -> After click: "/book/destination/Italy"
    URL: "/book/destination/France/day/Tuesday?price=mid" -> After click: "/book/destination/Italy/day/Tuesday?price=mid"
    URL: "/book/all"                                      -> After click: "/book/all/destination/Italy"

### Specifying a Pretty URL

The `href` option can be specified, if the actual URL should be hidden from the user. This string will be displayed in the user's address bar, but `Route` and `Reference` components will still work with the *actual* URL.

**Example:**

    <Router.router:Reference state="page/:pageType" pageType="register" href="/signup">
       <a href="{{ content.href }}">Sign up</a>
    </Router.router:Reference>

When the user clicks the link in the example above, their URL changes to include `page/register` in it, but they see `/signup` in their address bar.

It is important to note, that if the user reloads the page while pretty URL is displayed, it becomes the *actual* URL after the reload. Because of this, `Route`s that match the mask `page/:pageType` in the example above will stop matching against it, since `/signup` becomes the actual URL after reload.

### Clearing a Part of the URL

If `Reference` should not add or change the value specified by a mask, but completely remove it from the URL, the `clear` option should be set to `true`. The part of the URL that matches the mask will be removed and the rest of it stays unchanged.

**Example:**

    <Router.router:Reference state="type/:regType" clear="{{true}}">
       <a href="{{ content.href }}">Change registration type</a>
    </Router.router:Reference>

<!-- brk -->

    URL: "/signup/type/company"                    -> After click: "/signup"
    URL: "/signup"                                 -> After click: "/signup"
    URL: "/signup/type/individual/oauth?ref=email" -> After click: "/signup/oauth?ref=email"

## Using Controller to Change URLs in TS/JS

`Controller` is a module that exports the `navigate({ state, href })` function which can be used to change the current URL and update `Route`s and `Reference`s without reloading the page. `state` is the URL to navigate to excluding the protocol, host and port. It should begin with a forward slash (/). `href` is an optional parameter, it specifies the pretty URL that will be displayed to the user instead of `state`. [As with the href option of Reference](#specifying-a-pretty-url), `Route` and `Reference` components will still work with the *actual* `state` URL.

**Example:**

    Current URL: "/signup"

    RouterController.navigate({ state: "/signup/verify" })
    Current URL: "/signup/verify", user sees: "/signup/verify"

    RouterController.navigate({ state: "/signup/oauth/saby", href: "/sabylogin" })
    Current URL: "/signup/oauth/saby", user sees: "/sabylogin"

### Replacing the Current State

`Controller` exports the `replaceState({ state, href })` function that allows you to replace the current history state instead of navigating to a new one (you can think of it as of a `window.history.replaceState` alternative). The current state is removed from history and replaced with the state you have specified. This allows you to change the current state without adding a new record to the browser's history.

## Using MaskResolver to Do URL Calculations in TS/JS

If you are using `Reference` to change the history state, it calculates a new URL automatically based on the mask and parameters specified. `MaskResolver` module provides functions that can be used to calculate URL parameters programmatically without using the `Reference` component.

To calculate a new URL based on the mask and parameters (like the `Reference` does), use `calculateHref(mask, { ...parameters })` function. It supports the same [the same mask types](#mask-types) like `Route` and `Reference` do. The `parameters` object should contain the values for the parameter placeholders used in the mask. The function returns a calculated new URL that can be then passed to [`Controller.navigate` method](#using-controller-to-change-urls-in-tsjs) to change the current state.

To get values of the parameters from the current URL based on the mask (like the `Route` does), use the `calculateUrlParams(mask)` function. It returns a hash with the values of the parameter values extracted from the current state URL based on the mask specified.
