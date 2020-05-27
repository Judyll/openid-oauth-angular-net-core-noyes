import { Injectable } from '@angular/core';
import { CoreModule } from './core.module';
import { UserManager, User } from 'oidc-client';
import { Constants } from '../constants';
import { Subject } from 'rxjs';

@Injectable()
export class AuthService {
  private _userManager: UserManager;
  private _user: User;
  private _loginChangedSubject = new Subject<boolean>();

  loginChanged = this._loginChangedSubject.asObservable();

  constructor() {
    const stsSettings = {
      authority: Constants.stsAuthority,
      client_id: Constants.clientId,
      redirect_uri: `${Constants.clientRoot}signin-callback`,
      scope: 'openid profile projects-api',
      response_type: 'code',
      post_logout_redirect_uri: `${Constants.clientRoot}signout-callback`,
      // metadata: {
      //   issuer: `${Constants.stsAuthority}`,
      //   authorization_endpoint: `${Constants.stsAuthority}authorize?audience=projects-api`,
      //   jwks_uri: `${Constants.stsAuthority}.well-known/jwks.json`,
      //   token_endpoint: `${Constants.stsAuthority}oauth/token`,
      //   userinfo_endpoint: `${Constants.stsAuthority}userinfo`,
      //   end_session_endpoint: `${Constants.stsAuthority}v2/logout?client_id=${Constants.clientId}&returnTo=${encodeURI(Constants.clientRoot)}signout-callback`
      // }
    };
    this._userManager = new UserManager(stsSettings);
  }

  login() {
    return this._userManager.signinRedirect();
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await this._userManager.getUser();
    const userCurrent = !!user && !user.expired;
    if (this._user !== user) {
      this._loginChangedSubject.next(userCurrent);
    }
    this._user = user;
    return userCurrent;
  }

  async completeLogin() {
    const user = await this._userManager.signinRedirectCallback();
    this._user = user;
    this._loginChangedSubject.next(!!user && !user.expired);
    return user;
  }

  logout() {
    this._userManager.signoutRedirect();
  }

  completeLogout() {
    this._user = null;
    return this._userManager.signoutRedirectCallback();
  }

  /**This allows to get the access token if the user is logged in. When can use the
   * _user object, but this one is not yet populated until the user explicitly logs
   * in or is logged in check occurs. 
   */
  async getAccessToken() {
    const user = await this._userManager.getUser();
    if (!!user && !user.expired) {
      return user.access_token;
    } else {
      return null;
    }
  }
}