// import { verifyNoBrowserErrors } from 'angular2/src/test_lib/e2e_util';

describe('testing the tests', () => {
	// afterEach(verifyNoBrowserErrors);

	browser.get('/');

  it('should have a title', function(){
    expect(browser.getTitle()).toEqual("Login | Minds");
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toEqual("Login | Minds");
  });

//  element(by.css('[value="add"]')).click();
	//browser.pause();

});
