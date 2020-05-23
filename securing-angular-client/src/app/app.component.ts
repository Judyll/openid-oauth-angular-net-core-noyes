import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth-service.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private _authService: AuthService) {
    /** Event handler to update update the isLoggedIn property when
     * the logged in status changes
     */
    this._authService.loginChanged.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }

  ngOnInit() {
    this._authService.isLoggedIn().then((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }

  /** We just need to call the authService.login method which returns a promise
   * but there is rarely a reason to handle it because calling the signinRedirect()
   * in the User Manager is going to result in the redirect to the STS immediately.
   * Which means your app will be unloading from memory anyway as soon as that is called.
   */
  login() {
    this._authService.login();
  }

  logout() {
    this._authService.logout();
  }
}
