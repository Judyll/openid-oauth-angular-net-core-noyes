import { Injectable } from '@angular/core';
import { CoreModule } from './core.module';
import { UserManager, User} from 'oidc-client';
import { Constants } from '../constants';
import { Subject } from 'rxjs';

@Injectable({providedIn: CoreModule})
export class AuthService {
    private _userManager: UserManager;
    private _user: User;
    /** When the redirect comes back to Angular app from the STS, the process that obtains
     * the ID and access token happens asynchronously from the loading of the root view,
     * so we need to raise an event when the user is loaded so that we can update the UI
     * that depends on that. We will use RxJS observable to do that.
     */
    private _loginChangedSubject = new Subject<boolean>();

    /** This is a public observable that is produced by the _loginChangedSubject */
    loginChanged = this._loginChangedSubject.asObservable();

    constructor() { 
        const stsSettings = {
            // The URL of your STS/Identity server
            authority: Constants.stsAuthority,
            /** An identifier that will be used to match the client app
             * against your client configuration in STS. This is determined
             * by the identity provider you are working with.
             */
            client_id: Constants.clientId,
            /** The URL the STS will redirect to after the user authenticates with the
             * STS.
             */
            redirect_uri: `${Constants.clientRoot}signin-callback`,
            /** Identify the scopes that your app require. It is part of the STS configuration
             * for the client to identify which scopes should be allowed for each client app.
             * You will always need the openid connect and the profile scope is optional. The scope
             * associated with the project's api is also needed which is the backend for this
             * app. If the client ask for scopes that are not configured in STS, you will get an
             * error when you attempt to log-in indicating the client has an invalid configuration
             * due to unauthorized scopes.
             */
            scope: 'openid profile projects-api',
            /** Response type that you need. For Authorization Code Flow with PKCE, this will be
             * just 'code'. In Implicit Flow, the response type has two values, 'id_token' and 'token'.
             * This is the only indication or change in the client configuration for Authorization
             * Code Flow vs Implicit Flow
             */
            response_type: 'code',
            /** This is where the STS can redirect you to after log out. Remember that both
             * login and logout at the STS because that is where the lifetime and granting of the
             * tokens happen.
             */
            post_logout_redirect_uri: `${Constants.clientRoot}signout-callback`
        };
        this._userManager = new UserManager(stsSettings);
    }

    /** User Manager makes login easy for us. You don't need to know what the request of the STS
     * need to be, you just ask User Manager to do the right thing. That involves redirecting to STS
     * to login, and then getting redirected back to our app with an authorization code. Then the 
     * User Manager calls the token endpoint of the STS with the authorization code to exchange it 
     * for ID and access token. When using PKCE, the User Manager will also take care of creating the 
     * code verifier, hashing it to create the code challenge and will send those to the appropriate
     * requests to the STS. So, all I need to do to cause the first redirect is to ask the User
     * Manager to do that for us.
     */
    login() {
        return this._userManager.signinRedirect();
    }

    /** This will have a way that any code in the app can determine if the user has a successful login. 
     * After a successful login, User Manager stores in session storage the resulting user object
     * that it creates so that it can be retrieved anytime that is needed, such as to get the access
     * token to send to your API calls. The user object contains the ID and access tokens, as well
     * as an expired flag you can check to make sure the access token is not expired.
     */
    async isLoggedIn(): Promise<boolean> {
        const user = await this._userManager.getUser();
        const userCurrent = !!user && !user.expired;
        /** Fire the _loginChangedSubject observable. Keep in mind that if the user
         * goes and load a different site in the browser tab your app was loaded in
         * then they will come back to your app, it will be a fresh load of the application.
         * This is the case when the user is redirected to the STS and back again as well.
         * This check is also added in the root app.component.ts so that user gets loaded
         * on launch if there is already one in session storage from the previous login.
        */
        if (this._user !== user) {
            this._loginChangedSubject.next(userCurrent);
        }
        this._user = user;
        return userCurrent;
    }   

    /** At the completion of the signin redirect login at the STS, the STS will redirect
     * back to the client with an authorization code in the redirect response location
     * header. You can then add code that gets invoked when the callback comes back into the 
     * sign-in process. That completion will get a user object populated with a resulting
     * ID and access token for calling your APIs, which happens behind the scenes
     * as an API request to the STS token endpoint. That call is made by UserManager when you call
     * userManager.signinRedirectCallBack
     */
    async completeLogin(): Promise<any> {
        const user = await this._userManager.signinRedirectCallback();
        this._user = user;
        this._loginChangedSubject.next(!!user && !user.expired);
        return user;
    }
    
}