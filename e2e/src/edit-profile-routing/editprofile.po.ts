import { browser, by, element, promise, ElementFinder, ElementArrayFinder } from 'protractor';

export class LoginPage {
    navigateTo() {
        browser.get('http://localhost:4200');
        return browser.get('/profile-edit');
    }

    getbuttonclick() {
        return element(by.className('mat-stroked-button'));
    }

    getForm() {
        return element(by.className('ng-star-inserted'));
    }


}
