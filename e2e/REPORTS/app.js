var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "should display welcome message|workspace-project App",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, app-root h1)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, app-root h1)\n    at elementArrayFinder.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at AppPage.getTitleText (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.po.ts:9:43)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:13:17)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"should display welcome message\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:11:3)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:4:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "Screenshots\\00d10076-009d-00c0-0077-00d1006b00d7.png",
        "timestamp": 1555136614586,
        "duration": 3643
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "Screenshots\\00330015-0030-00b2-0059-006a00900008.png",
        "timestamp": 1555136619828,
        "duration": 3780
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@gmail.com   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136627304,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\007700d0-0080-0022-00bb-000f00c80040.png",
        "timestamp": 1555136623929,
        "duration": 4080
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@asd.com.eg   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136631532,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00f600ea-007b-00c1-0051-0011003f00b4.png",
        "timestamp": 1555136628395,
        "duration": 3843
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@gmail   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-dirty ng-valid' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:44:60\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136635952,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000300d0-00d9-00dc-00a2-00c6003900a0.png",
        "timestamp": 1555136632584,
        "duration": 4396
    },
    {
        "description": "Signin form: EMAIL INPUT : ayagmail   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136640044,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00a30021-00ab-0013-00fc-000a007c0074.png",
        "timestamp": 1555136637359,
        "duration": 3126
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136643585,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00210044-00a4-003a-0006-00fb00d200ed.png",
        "timestamp": 1555136640798,
        "duration": 3220
    },
    {
        "description": "Signin form: EMAIL INPUT : @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136647136,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b80084-0062-0062-00de-0045000800fe.png",
        "timestamp": 1555136644338,
        "duration": 3275
    },
    {
        "description": "Signin form: EMAIL INPUT : aya @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136650280,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00280093-000e-000e-00d3-003a006c00fc.png",
        "timestamp": 1555136648003,
        "duration": 2717
    },
    {
        "description": "Signin form: PASSWORD INPUT : A123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136653866,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00a400d8-00f4-00e8-00c7-004b00b20083.png",
        "timestamp": 1555136651044,
        "duration": 3259
    },
    {
        "description": "Signin form: PASSWORD INPUT : Aya123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136657496,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00bf00f9-0003-008d-0048-0061007000e8.png",
        "timestamp": 1555136654635,
        "duration": 3360
    },
    {
        "description": "Signin form: PASSWORD INPUT : a1@aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136661117,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0044000d-006f-0012-004e-0066008f00a8.png",
        "timestamp": 1555136658313,
        "duration": 3297
    },
    {
        "description": "Signin form: PASSWORD INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136664744,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00ab002a-009e-00c6-0086-004e006400c0.png",
        "timestamp": 1555136661916,
        "duration": 3241
    },
    {
        "description": "Signin form: PASSWORD INPUT : aya   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136668346,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000e00b9-0062-00af-0036-0013008300f1.png",
        "timestamp": 1555136665477,
        "duration": 3267
    },
    {
        "description": "Signin form: PASSWORD INPUT : a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136671975,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00bf0083-001b-0033-0065-00dd0049006f.png",
        "timestamp": 1555136669098,
        "duration": 3335
    },
    {
        "description": "Signin form: PASSWORD INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136675614,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00d00084-006f-00ab-00d3-009700b700ed.png",
        "timestamp": 1555136672771,
        "duration": 3248
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@gmail.com   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136679308,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00d70010-00b4-0080-00d6-0088009400a0.png",
        "timestamp": 1555136676339,
        "duration": 4104
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@asd.com.eg   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136683593,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00600000-00b5-002d-0097-001100fa0036.png",
        "timestamp": 1555136680761,
        "duration": 3400
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@gmail   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-dirty ng-valid' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:47:60\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136687802,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\002500e7-0092-0032-0066-0065002e0047.png",
        "timestamp": 1555136684498,
        "duration": 3802
    },
    {
        "description": "Sign-up form: EMAIL INPUT : ayagmail   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136691412,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00be00f8-00c1-004f-00ac-0013002c007c.png",
        "timestamp": 1555136688629,
        "duration": 3306
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136695443,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00320070-00a4-008f-0003-00990085001f.png",
        "timestamp": 1555136692346,
        "duration": 3636
    },
    {
        "description": "Sign-up form: EMAIL INPUT : @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136698716,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0088003d-006e-0071-0082-0020007e007e.png",
        "timestamp": 1555136696360,
        "duration": 2682
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136702220,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00300026-0011-00ae-0064-00e700310080.png",
        "timestamp": 1555136699352,
        "duration": 3377
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : A123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136706205,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b80058-0038-0055-002a-00d2004c0012.png",
        "timestamp": 1555136703075,
        "duration": 3712
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : Aya123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136709964,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001100ba-0048-009a-00e2-0014006700fb.png",
        "timestamp": 1555136707148,
        "duration": 3182
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a1@aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136713929,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001c00e5-0042-00d3-002e-006c00a300be.png",
        "timestamp": 1555136710638,
        "duration": 3797
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136717474,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000d00ba-00c2-00d2-00cd-0096003800cd.png",
        "timestamp": 1555136714755,
        "duration": 3139
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : aya   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136720987,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00c1009a-00fc-005c-0073-00760018004c.png",
        "timestamp": 1555136718280,
        "duration": 3110
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136724047,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\005f006f-00a4-0017-00d0-00dc009f00cd.png",
        "timestamp": 1555136721731,
        "duration": 2620
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136727501,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\007600d7-0015-0021-00ed-004700ff00d9.png",
        "timestamp": 1555136724714,
        "duration": 3199
    },
    {
        "description": "Sign-up form: NAME INPUT : aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136730974,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\004e0001-00b5-0093-00f0-0091009e00d2.png",
        "timestamp": 1555136728234,
        "duration": 3154
    },
    {
        "description": "Sign-up form: NAME INPUT : aya hossam   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136734574,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\007400f1-00f7-0042-005f-00f4001d0020.png",
        "timestamp": 1555136731750,
        "duration": 3265
    },
    {
        "description": "Sign-up form: NAME INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136738091,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001d00b7-00ba-007b-0063-002a00d00024.png",
        "timestamp": 1555136735317,
        "duration": 3173
    },
    {
        "description": "Sign-up form: NAME INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136741544,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00f800bf-0052-00d5-0097-0093002c0063.png",
        "timestamp": 1555136738799,
        "duration": 3239
    },
    {
        "description": "Sign-up form: NAME INPUT : 1%s   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555136745114,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\006a0032-0027-00b8-0029-009800ba0091.png",
        "timestamp": 1555136742400,
        "duration": 3129
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, app-root h1)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, app-root h1)\n    at elementArrayFinder.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at AppPage.getTitleText (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.po.ts:9:43)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:13:17)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"should display welcome message\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:11:3)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\app.e2e-spec.ts:4:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "Screenshots\\00a000de-00ac-00eb-0077-006e00e300c8.png",
        "timestamp": 1555139440348,
        "duration": 4516
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "Screenshots\\00070019-0051-008f-007d-001f001e0000.png",
        "timestamp": 1555139445393,
        "duration": 2460
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@gmail.com   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139451788,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00ac00a9-008f-00e7-0052-00f200920049.png",
        "timestamp": 1555139448197,
        "duration": 4187
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@asd.com.eg   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139455090,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\007200f2-0060-0035-002b-000c00380078.png",
        "timestamp": 1555139452707,
        "duration": 2673
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@gmail   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-dirty ng-valid' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:44:60\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139457937,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0052001f-00e5-00a0-0062-005400af00ee.png",
        "timestamp": 1555139455817,
        "duration": 2356
    },
    {
        "description": "Signin form: EMAIL INPUT : ayagmail   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139460957,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\006c0006-001d-003d-00b8-008a0054002d.png",
        "timestamp": 1555139458555,
        "duration": 2776
    },
    {
        "description": "Signin form: EMAIL INPUT : aya@   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139464571,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b200ac-0010-0051-0055-003a00dd00d5.png",
        "timestamp": 1555139461659,
        "duration": 3556
    },
    {
        "description": "Signin form: EMAIL INPUT : @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139468612,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\009a00d4-00d5-0020-00b3-0040004700cd.png",
        "timestamp": 1555139465512,
        "duration": 3591
    },
    {
        "description": "Signin form: EMAIL INPUT : aya @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139472123,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00de00a8-0089-007a-004e-00140063007d.png",
        "timestamp": 1555139469408,
        "duration": 3235
    },
    {
        "description": "Signin form: PASSWORD INPUT : A123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139477019,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00de00c0-0013-0014-00f9-008a009b009b.png",
        "timestamp": 1555139473002,
        "duration": 4559
    },
    {
        "description": "Signin form: PASSWORD INPUT : Aya123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139480516,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\005b009e-0047-002a-0025-00f700c3006c.png",
        "timestamp": 1555139477928,
        "duration": 2836
    },
    {
        "description": "Signin form: PASSWORD INPUT : a1@aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139484041,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\004a00e6-00e1-00ed-00ac-005100e10012.png",
        "timestamp": 1555139481080,
        "duration": 3360
    },
    {
        "description": "Signin form: PASSWORD INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139487416,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00d6009c-00f6-0034-00a1-007000f000e8.png",
        "timestamp": 1555139484772,
        "duration": 3179
    },
    {
        "description": "Signin form: PASSWORD INPUT : aya   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139493270,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00af0042-00d2-000d-0045-0077008e0060.png",
        "timestamp": 1555139488319,
        "duration": 5407
    },
    {
        "description": "Signin form: PASSWORD INPUT : a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139497610,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\003300f0-00ad-0098-006a-000c00df0021.png",
        "timestamp": 1555139494064,
        "duration": 4357
    },
    {
        "description": "Signin form: PASSWORD INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signin\\login.e2e-spec.ts:68:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139502189,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0000002d-0063-008e-00d2-00f7006500b9.png",
        "timestamp": 1555139498768,
        "duration": 3785
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@gmail.com   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139506082,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00a10053-00ba-00c8-002d-00ca009300ae.png",
        "timestamp": 1555139502873,
        "duration": 3878
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@asd.com.eg   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139510991,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\005c0031-00c9-00b2-0080-00ec00a7000b.png",
        "timestamp": 1555139507095,
        "duration": 4567
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@gmail   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-dirty ng-valid' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:47:60\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139515537,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00aa0090-00df-00e7-0057-000e006a00fd.png",
        "timestamp": 1555139512060,
        "duration": 3891
    },
    {
        "description": "Sign-up form: EMAIL INPUT : ayagmail   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139519605,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\004800d7-00a4-00bd-0022-009200e50068.png",
        "timestamp": 1555139516262,
        "duration": 3908
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya@   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139523768,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\004b002f-00ac-00a0-005e-00b5005e0017.png",
        "timestamp": 1555139520483,
        "duration": 3848
    },
    {
        "description": "Sign-up form: EMAIL INPUT : @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139529452,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00ad001d-001c-00df-0099-004000a000fb.png",
        "timestamp": 1555139524721,
        "duration": 5260
    },
    {
        "description": "Sign-up form: EMAIL INPUT : aya @gmail.com   SHOULD BE : INVALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139533467,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\008c001b-0035-0075-0011-00a600cd006c.png",
        "timestamp": 1555139530283,
        "duration": 3723
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : A123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139536899,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00cc007b-0047-0006-008c-000b003f0039.png",
        "timestamp": 1555139534327,
        "duration": 2939
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : Aya123   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139540819,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00d4000d-004e-004b-00ee-009b00db0007.png",
        "timestamp": 1555139537587,
        "duration": 3850
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a1@aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139546638,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\009e00c1-0099-00b9-002c-00b200fe0022.png",
        "timestamp": 1555139541922,
        "duration": 5075
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139550026,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0060005c-0031-00b4-0036-000900c200d5.png",
        "timestamp": 1555139547321,
        "duration": 3172
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : aya   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139553842,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00e900a5-005c-001d-001d-004f000200fc.png",
        "timestamp": 1555139550890,
        "duration": 3330
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139558698,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00ed00dd-00c3-0061-00b2-0066001c00a1.png",
        "timestamp": 1555139554562,
        "duration": 4670
    },
    {
        "description": "Sign-up form: PASSWORD INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:71:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139562424,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b300cc-002e-0003-00a8-0035008d004a.png",
        "timestamp": 1555139559569,
        "duration": 3242
    },
    {
        "description": "Sign-up form: NAME INPUT : aya   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139565778,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\008100ce-0025-0014-00d4-00f0002b0044.png",
        "timestamp": 1555139563149,
        "duration": 2997
    },
    {
        "description": "Sign-up form: NAME INPUT : aya hossam   SHOULD BE : VALID|Login tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139568956,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00dc00eb-00dd-00b6-007e-00130090002f.png",
        "timestamp": 1555139566477,
        "duration": 2869
    },
    {
        "description": "Sign-up form: NAME INPUT : 123   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139573040,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00e40042-0032-0034-00a4-000d0036009f.png",
        "timestamp": 1555139569642,
        "duration": 3956
    },
    {
        "description": "Sign-up form: NAME INPUT : a@a   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139576863,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00850044-0013-0018-0059-005d008b0096.png",
        "timestamp": 1555139573914,
        "duration": 3443
    },
    {
        "description": "Sign-up form: NAME INPUT : 1%s   SHOULD BE : INVALID|Login tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 12508,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-untouched ng-valid ng-dirty' to contain 'ng-invalid'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\signup\\signup.e2e-spec.ts:95:58\n    at elementArrayFinder_.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:804:32)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 91052:16 \"\\n    It looks like you're using ngModel on the same form field as formControl. \\n    Support for using the ngModel input property and ngModelChange event with \\n    reactive form directives has been deprecated in Angular v6 and will be removed \\n    in Angular v7.\\n    \\n    For more information on this, see our API docs here:\\n    https://angular.io/api/forms/FormControlDirective#use-with-ngmodel\\n    \"",
                "timestamp": 1555139580333,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00e10098-00fe-00b4-0010-00fa001000bb.png",
        "timestamp": 1555139577692,
        "duration": 3106
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

