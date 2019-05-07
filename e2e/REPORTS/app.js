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
        "description": "Editing username to be (Monaliza) and Routing to profile page to check it|Editing profile",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24408,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557235856573,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/288/gay4imfq/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235870331,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/311/oo120qoq/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235872814,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/243/fpxbspwg/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235878661,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557235881325,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557235881547,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/170/tlhaffi3/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235881547,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557235892942,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000400b0-001f-004a-00cb-00b1000300c6.png",
        "timestamp": 1557235861072,
        "duration": 33353
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24408,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : C:Aya .. meSOFTWARE PROJECT FINAL\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : C:Aya .. meSOFTWARE PROJECT FINAL\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:106:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:97:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/682/tijalyjg/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235901431,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/564/yhpivg0u/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235904671,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/807/abcopejh/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235909083,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/416/l5nphzc2/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235912946,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557235915865,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557235915978,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/940/i3dhbphh/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557235915978,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001000a7-00a2-004c-00c7-007b00c4002b.png",
        "timestamp": 1557235894846,
        "duration": 29245
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 19176,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: Cannot find module '../../node_modules/protractor/node_modules/selenium-webdriver/remote'"
        ],
        "trace": [
            "Error: Cannot find module '../../node_modules/protractor/node_modules/selenium-webdriver/remote'\n    at Function.Module._resolveFilename (module.js:547:15)\n    at Function.Module._load (module.js:474:25)\n    at Module.require (module.js:596:17)\n    at require (internal/module.js:11:18)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:110:18)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557236690498,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/934/ynzebhne/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557236707887,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/370/eswnbsna/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557236710357,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/462/1tlxzjbe/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557236712697,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557236715449,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00e20010-00c9-003f-00e6-00c0004c00dc.png",
        "timestamp": 1557236694478,
        "duration": 21024
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 23144,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557236970425,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/778/weadveu0/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557236994643,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/532/de1gcjhw/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557236999950,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/612/xfzmwoxl/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237004451,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/013/ayf4vkch/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237011515,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557237016503,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0023001b-000f-0046-004c-009700760063.png",
        "timestamp": 1557236974681,
        "duration": 41980
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 13356,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: invalid argument: File not found : Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "WebDriverError: invalid argument: File not found : Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:110:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557237367912,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/756/5h0km1im/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237397104,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/280/at2a1pui/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237399901,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557237402180,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557237402361,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00c100dc-0082-00ad-002a-0066009c008e.png",
        "timestamp": 1557237371229,
        "duration": 39966
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 9576,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:110:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557237799332,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/402/5bx30odu/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237819862,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/340/xuped21g/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237823799,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557237830004,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557237830318,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/211/1inrp00d/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557237830318,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b80006-00d9-0014-0086-0069006500b6.png",
        "timestamp": 1557237803656,
        "duration": 34193
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 22608,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : ../Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : ../Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:110:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238072358,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/261/n22pxw1e/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238097800,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238101201,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238101406,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/541/xkatld44/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238101406,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0083004b-0020-002a-00e2-002b00a50074.png",
        "timestamp": 1557238075755,
        "duration": 35035
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 26676,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:112:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238276013,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/872/31zqagwv/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238292820,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/323/abruw1co/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238304860,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238308604,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00a800d5-00e3-0048-004f-003d00dd004c.png",
        "timestamp": 1557238279537,
        "duration": 29135
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 17872,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:112:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238462801,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/782/s2ninuyj/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238477857,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/906/hug1mfcq/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238488883,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238495519,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00e500d6-00ab-0032-00d2-007b00bb00db.png",
        "timestamp": 1557238466415,
        "duration": 29328
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 25728,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238610321,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/043/uj2qjthe/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238625991,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/053/ognujpwp/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238632998,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/182/z5ofbzbq/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238636142,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238639130,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238639414,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/549/253v4xjw/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238639414,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00940070-00e1-00e2-00d6-004800b2007d.png",
        "timestamp": 1557238614520,
        "duration": 34643
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 17016,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238733949,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/517/1mhb5jyv/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238747852,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/579/f2qnvxs2/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238757878,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238763824,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238764117,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/445/smwccrus/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238764117,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00f8006c-00b7-00ec-005f-00f7001300c7.png",
        "timestamp": 1557238737217,
        "duration": 34846
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10524,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238824596,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/889/dxnitwlc/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238837105,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/101/cjnipeta/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238843782,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/667/mwx45s2d/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238848014,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238850946,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b4000c-0069-007e-00b7-001b000400a3.png",
        "timestamp": 1557238825460,
        "duration": 34537
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 22608,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557238923802,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/me - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557238950345,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/me - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557238952286,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/822/mrhbrtlg/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557238959401,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557238962119,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00b90092-0096-0082-009c-0059005600ee.png",
        "timestamp": 1557238924521,
        "duration": 37754
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 16208,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : Pictures\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : Pictures\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557239071551,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/229/nmbxarar/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239085540,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/640/yctvdryg/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239094664,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/021/fma4lvzo/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239098566,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239101021,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239101229,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/534/rykpcro0/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239101229,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001500cf-0036-00b0-0017-007a000500e9.png",
        "timestamp": 1557239075028,
        "duration": 33739
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 28424,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557239255083,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/270/g02hkr5v/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239276928,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/475/vcth3l5t/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239285505,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/077/0yymefor/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239294723,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239298183,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0012003c-0019-00c9-00f5-008e007f003d.png",
        "timestamp": 1557239258361,
        "duration": 39965
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 9368,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557239484057,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/923/2zllhroj/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239531986,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/444/3klckksm/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239534585,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/942/v32w15ju/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239537301,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/942/sqgu1s2y/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239539832,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239542879,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0052009e-0006-00a4-0064-003200f900fc.png",
        "timestamp": 1557239491599,
        "duration": 51425
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 17604,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557239733218,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/522/klrsuh1t/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239750586,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/528/wofflyy5/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239762269,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/887/iq1kiby1/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239765225,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/058/j1ymizlw/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239767948,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239770518,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00150070-001f-008d-003d-00c10053004a.png",
        "timestamp": 1557239733689,
        "duration": 36959
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 27040,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "WebDriverError: invalid argument: File not found : /Pictures/testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557239898864,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/709/kh5u2qko/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239921300,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/172/4jt5j5bh/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239927462,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/632/m31yyhkr/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239930607,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239933415,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557239933555,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/139/a5jsgu4w/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557239933555,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00c7007b-00bb-0039-00ad-0083004e00e4.png",
        "timestamp": 1557239902403,
        "duration": 41185
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 20472,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: No element found using locator: By(css selector, *[name=\"email\"])"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "NoSuchElementError: No element found using locator: By(css selector, *[name=\"email\"])\n    at elementArrayFinder.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:21)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557240192382,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/303/imz0qods/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240238901,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557240250372,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\0011001c-000a-00b2-001b-00110071006b.png",
        "timestamp": 1557240197622,
        "duration": 52852
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 15404,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: no such window\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "NoSuchWindowError: no such window\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebDriver.switchTo().window(1)\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at TargetLocator.window (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1844:25)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:111:28)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557240597417,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/374/t1kg5ndr/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240624366,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/573/r5orvevd/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240630029,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557240632448,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000100ec-0031-000c-0055-00630025003e.png",
        "timestamp": 1557240600929,
        "duration": 40890
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 26836,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Aya .. meSOFTWARE PROJECT FINAL\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: invalid argument: File not found : C:\\Aya .. meSOFTWARE PROJECT FINAL\testingpicture.jpg\n  (Session info: chrome=74.0.3729.131)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:116:16)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557240746647,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/147/libnk4ux/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240770907,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/869/fk2oy3wi/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240774122,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/613/ztwbn30b/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557240779862,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557240782666,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00310047-009a-001c-005a-00f1002e00ca.png",
        "timestamp": 1557240753875,
        "duration": 37384
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 22620,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:112:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557242592167,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/631/5sehsb0h/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557242626221,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557242642479,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\001c00ee-0070-00ec-006e-00a200c100ae.png",
        "timestamp": 1557242592094,
        "duration": 50570
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 28108,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:112:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Timeout.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4283:11)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:100:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:9:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557242941471,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/896/0bw4htt1/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557242962339,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/626/a3xtkrvd/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557242965162,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/me - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557242969482,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557242977362,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\000b007e-0015-0092-00f1-00d700d5002f.png",
        "timestamp": 1557242945054,
        "duration": 32492
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 18956,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:114:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:108:15\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:11:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557243318376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/598/3ef0mj1w/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557243332314,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557243344559,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00820009-0073-00bc-007b-007e009600c0.png",
        "timestamp": 1557243321988,
        "duration": 22725
    },
    {
        "description": "Changing The Profile Photo and Routing to profile page to check it|Editing profile",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 16180,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Failed: Cannot read property 'resolve' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'resolve' of undefined\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:115:29)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:108:15\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Changing The Profile Photo and Routing to profile page to check it\") in control flow\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:102:5)\n    at addSpecsToSuite (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\edit-profile-page\\editingprofile.e2e-spec.ts:11:1)\n    at Module._compile (module.js:652:30)\n    at Module.m._compile (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (module.js:663:10)\n    at Object.require.extensions.(anonymous function) [as .ts] (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557243732499,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/621/i0jww2ch/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557243747312,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/615/23qvtuxk/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557243749815,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/831/zib2zeoz/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557243752232,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/745/aviqr3hq/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557243754678,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/null - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1557243756975,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00dc00e5-00d5-00be-0080-00100044003f.png",
        "timestamp": 1557243737023,
        "duration": 20100
    },
    {
        "description": "Should Redirect to Sign out when he clicks sign out button|Logout tests",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 16852,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Expected 'http://geeksreads.herokuapp.com/homepage' to be 'http://geeksreads.herokuapp.com/sign-out'.",
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasmine\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)",
            "Error: Failed expectation\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\sig-out-routing\\sign-out.e2e-spec.ts:32:21\n    at ManagedPromise.invokeCallback_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)",
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\e2e\\src\\sig-out-routing\\sign-out.e2e-spec.ts:34:40)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Aya .. me\\SOFTWARE PROJECT FINAL\\Project 3rd Phase\\Geeksreads-Frontend\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557266054915,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/SignOut - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266155375,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/user_status/show - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266155478,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/vendor.js 80742:18 \"ERROR\" HttpErrorResponse",
                "timestamp": 1557266155478,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00ef00b6-00d4-004d-0016-00cf003d0068.png",
        "timestamp": 1557266075140,
        "duration": 80471
    },
    {
        "description": "Should Redirect to Sign out when he clicks sign out button|Logout tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 22420,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557266448929,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/user_status/show - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266480891,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/SignOut - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266480891,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/vendor.js 80742:18 \"ERROR\" HttpErrorResponse",
                "timestamp": 1557266480891,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\00610015-00f6-0099-003f-009100730026.png",
        "timestamp": 1557266452683,
        "duration": 28232
    },
    {
        "description": "Should Sign out Checks to see the join in button if exist now|Logout tests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 3128,
        "browser": {
            "name": "chrome",
            "version": "74.0.3729.131"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1557266621588,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://localhost:4200/vendor.js 165635 WebSocket connection to 'ws://localhost:4200/sockjs-node/402/0dz3cctz/websocket' failed: WebSocket is closed before the connection is established.",
                "timestamp": 1557266638836,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/users/SignOut - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266650983,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://geeksreads.herokuapp.com/api/user_status/show - Failed to load resource: the server responded with a status of 401 (Unauthorized)",
                "timestamp": 1557266651090,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/vendor.js 80742:18 \"ERROR\" HttpErrorResponse",
                "timestamp": 1557266651090,
                "type": ""
            }
        ],
        "screenShotFile": "Screenshots\\006500b4-0012-00d0-0050-001e0014006c.png",
        "timestamp": 1557266625314,
        "duration": 25801
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

